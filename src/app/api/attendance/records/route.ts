import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceRecord, Course, AttendanceSession, Student } from '@/models';
import User from '@/models/User';
import { requireAuth, serverErrorResponse } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

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
      sessionId?: mongoose.Types.ObjectId;
      courseId?: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] };
      studentId?: mongoose.Types.ObjectId;
      status?: string;
      createdAt?: {
        $gte?: Date;
        $lte?: Date; 
      };
    }

    const query: RecordQuery = {};

    if (sessionId) {
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        query.sessionId = new mongoose.Types.ObjectId(sessionId);
      } else {
        const session = await AttendanceSession.findOne({ id: sessionId }).select('_id');
        if (session) {
          query.sessionId = session._id;
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { total: 0, limit, skip, hasMore: false },
          });
        }
      }
    }

    if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        query.courseId = new mongoose.Types.ObjectId(courseId);
      } else {
        const course = await Course.findOne({ id: courseId }).select('_id');
        if (course) {
          query.courseId = course._id;
        }
      }
    }

    if (studentId) {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        query.studentId = new mongoose.Types.ObjectId(studentId);
      } else {
        const student = await Student.findOne({ id: studentId }).select('_id');
        if (student) {
          query.studentId = student._id;
        }
      }
    }

    if (status) {
      query.status = status;
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
        .populate('courseId', 'courseCode courseName')
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
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid token')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching attendance records:', error);
    return serverErrorResponse('Failed to fetch attendance records');
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(request);

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userDoc = await User.findOne({ username: user.username });
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { studentId, sessionId, status, method = 'manual', note } = body;

    if (!studentId || !sessionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let sessionDoc;
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      sessionDoc = await AttendanceSession.findById(sessionId);
    } else {
      sessionDoc = await AttendanceSession.findOne({ id: sessionId });
    }
    if (!sessionDoc) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    let studentDoc;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentDoc = await Student.findById(studentId);
    } else {
      studentDoc = await Student.findOne({ id: studentId });
    }
    if (!studentDoc) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    let record = await AttendanceRecord.findOne({
      sessionId: sessionDoc._id,
      studentId: studentDoc._id
    });

    if (record) {
      record.status = status;
      record.checkInMethod = method;
      record.checkInTime = new Date();
      if (note) record.adjustmentNote = note;
      record.adjustedBy = userDoc._id;
      record.adjustedAt = new Date();
      await record.save();
    } else {
      record = await AttendanceRecord.create({
        id: uuidv4(),
        sessionId: sessionDoc._id,
        studentId: studentDoc._id,
        courseId: sessionDoc.courseId,
        studentName: studentDoc.name,
        studentNumber: studentDoc.studentId,
        status,
        checkInTime: new Date(),
        checkInMethod: method,
        adjustmentNote: note,
        adjustedBy: userDoc._id,
        adjustedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    return serverErrorResponse('Failed to record attendance');
  }
}
