import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord, Course } from '@/models';
import User from '@/models/User';
import { OpenSessionRequest } from '@/types/session';
import { requireAuth, canAccessCourse, badRequestResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);

    if (user.role !== 'admin' && user.role !== 'teacher') {
      return forbiddenResponse('Only admin and teachers can open sessions');
    }

    const body: OpenSessionRequest = await request.json();
    const { courseId, sessionDate, dayOfWeek, startTime, endTime, room } = body;

    if (!courseId || !sessionDate || dayOfWeek === undefined || !startTime || !endTime) {
      return badRequestResponse('Missing required fields');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const hasAccess = await canAccessCourse(courseId, user);
    if (!hasAccess && user.role !== 'admin') {
      return forbiddenResponse('You do not have access to this course');
    }

    const parsedDate = new Date(sessionDate);
    const existingSession = await AttendanceSession.findOne({
      courseId: course._id,
      sessionDate: parsedDate,
    });

    if (existingSession) {
      return badRequestResponse('Session already exists for this course on this date');
    }

    const scheduleSlot = course.schedule.find((slot) => slot.dayOfWeek === dayOfWeek);
    const graceMinutes = scheduleSlot?.graceMinutes || 30;

    const currentUser = await User.findOne({ username: user.username });
    const sessionId = uuidv4();

    const newSession = await AttendanceSession.create({
      id: sessionId,
      courseId: course._id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      sessionDate: parsedDate,
      dayOfWeek,
      startTime,
      endTime,
      graceMinutes,
      status: 'active',
      openedAt: new Date(),
      openedBy: currentUser?._id,
      room: room || course.room,
      stats: {
        expectedCount: course.enrolledStudents.length,
        presentCount: 0,
        normalCount: 0,
        lateCount: 0,
        absentCount: course.enrolledStudents.length,
        leaveCount: 0,
      },
    });

    const attendanceRecords = course.enrolledStudents.map((enrollment) => ({
      id: uuidv4(),
      sessionId: newSession._id,
      courseId: course._id,
      studentId: enrollment.studentId,
      studentName: '',
      status: 'absent',
      checkInMethod: 'face_recognition',
      detectionCount: 0,
    }));

    if (attendanceRecords.length > 0) {
      await AttendanceRecord.insertMany(attendanceRecords);
    }

    return NextResponse.json(
      {
        success: true,
        data: newSession.toObject(),
        message: 'Session opened successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    if (error.message === 'Insufficient permissions') {
      return forbiddenResponse();
    }
    console.error('Error opening session:', error);
    return serverErrorResponse('Failed to open session');
  }
}
