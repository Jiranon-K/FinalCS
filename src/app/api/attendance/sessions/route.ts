/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, Course } from '@/models';
import User from '@/models/User';
import { requireAuth, serverErrorResponse } from '@/lib/auth-helpers';
import { isSessionExpired } from '@/lib/attendance-helpers';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    interface SessionQuery {
      courseId?: any;
      status?: string;
      sessionDate?: any;
    }

    const query: SessionQuery = {};

    if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        query.courseId = new mongoose.Types.ObjectId(courseId);
      } else {
        const course = await Course.findOne({ id: courseId }).select('_id');
        if (course) {
          query.courseId = course._id;
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { total: 0, limit, skip, hasMore: false },
          });
        }
      }
    }

    if (status) {
      query.status = status as any;
    }

    if (startDate || endDate) {
      query.sessionDate = {};
      if (startDate) {
        query.sessionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sessionDate.$lte = new Date(endDate);
      }
    }

    if (user.role === 'teacher') {
      const userDoc = await User.findOne({ username: user.username });
      if (userDoc) {
        const teacherCourses = await Course.find({ teacherId: userDoc._id }).select('_id');
        const courseIds = teacherCourses.map((c) => c._id);
        query.courseId = { $in: courseIds };
      }
    }

    if (user.role === 'student') {
      const userDoc = await User.findOne({ username: user.username });
      if (!userDoc?.profileId) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { total: 0, limit, skip, hasMore: false },
        });
      }

      const enrolledCourses = await Course.find({
        'enrolledStudents.studentId': userDoc.profileId,
      }).select('_id');
      const courseIds = enrolledCourses.map((c) => c._id);
      query.courseId = { $in: courseIds };
    }

    // --- Auto-Creation Logic (Lazy Loading) ---
    try {
      let candidateCourseIds: string[] = [];
      if (query.courseId) {
        const qCid = query.courseId as any;
        if (qCid && qCid.$in) {
           candidateCourseIds = qCid.$in.map((id: any) => id.toString());
        } else if (typeof query.courseId === 'string' || query.courseId instanceof mongoose.Types.ObjectId) {
           candidateCourseIds = [query.courseId.toString()];
        }
      }
      if (candidateCourseIds.length === 0) {
         if (user.role === 'teacher') {
            const userDoc = await User.findOne({ username: user.username });
            if (userDoc) {
                const teacherCourses = await Course.find({ teacherId: userDoc._id }).select('_id');
                candidateCourseIds = teacherCourses.map(c => c._id.toString());
            }
         } else if (user.role === 'student') {
             const userDoc = await User.findOne({ username: user.username });
             if (userDoc?.profileId) {
                const enrolledCourses = await Course.find({ 'enrolledStudents.studentId': userDoc.profileId }).select('_id');
                candidateCourseIds = enrolledCourses.map(c => c._id.toString());
             }
         }
      }

      const { checkAndCreateScheduledSessions } = await import('@/lib/session-service');
      if (candidateCourseIds.length > 0) {
         await checkAndCreateScheduledSessions(candidateCourseIds);
      } else if (user.role === 'admin') {
         await checkAndCreateScheduledSessions();
      }

    } catch (err) {
      console.error('Error in auto-creation key block:', err);
    } 
    // ------------------------------------------

    const [sessions, total] = await Promise.all([
      AttendanceSession.find(query)
        .sort({ sessionDate: -1, startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AttendanceSession.countDocuments(query),
    ]);

    const expiredSessionIds: string[] = [];
    const processedSessions = sessions.map((session) => {
      if (session.status === 'active' && isSessionExpired(session as any)) {
        expiredSessionIds.push(session._id.toString());
        return { ...session, status: 'closed', closedAt: new Date() };
      }
      return session;
    });

    if (expiredSessionIds.length > 0) {
      await AttendanceSession.updateMany(
        { _id: { $in: expiredSessionIds } },
        { $set: { status: 'closed', closedAt: new Date() } }
      );
    }

    return NextResponse.json({
      success: true,
      data: processedSessions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + sessions.length < total,
      },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching sessions:', error);
    return serverErrorResponse('Failed to fetch sessions');
  }
}
