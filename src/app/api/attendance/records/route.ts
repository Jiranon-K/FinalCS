import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceRecord, Course } from '@/models';
import User from '@/models/User';
import { requireAuth, serverErrorResponse } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || '';
    const courseId = searchParams.get('courseId') || '';
    const studentId = searchParams.get('studentId') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    interface RecordQuery {
      sessionId?: any;
      courseId?: any;
      studentId?: any;
      status?: string;
      createdAt?: any;
    }

    const query: RecordQuery = {};

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (courseId) {
      query.courseId = courseId;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (status) {
      query.status = status as any;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
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
      query.studentId = userDoc.profileId;
    }

    if (user.role === 'teacher' && !courseId) {
      const userDoc = await User.findOne({ username: user.username });
      if (userDoc) {
        const teacherCourses = await Course.find({ teacherId: userDoc._id }).select('_id');
        const courseIds = teacherCourses.map((c) => c._id);
        query.courseId = { $in: courseIds };
      }
    }

    const [records, total] = await Promise.all([
      AttendanceRecord.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('studentId', 'imageUrl')
        .lean(),
      AttendanceRecord.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + records.length < total,
      },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching attendance records:', error);
    return serverErrorResponse('Failed to fetch attendance records');
  }
}
