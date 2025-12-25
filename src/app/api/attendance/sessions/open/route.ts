import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord, Course } from '@/models';
import User from '@/models/User';
import Student from '@/models/Student';
import { OpenSessionRequest } from '@/types/session';
import { requireAuth, canAccessCourse, badRequestResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth-helpers';
import { createServerTranslator } from '@/lib/i18n-server';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { translate, locale } = createServerTranslator(request);

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
    parsedDate.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const sessionEndDateTime = new Date(sessionDate);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    sessionEndDateTime.setHours(endHour, endMinute, 0, 0);

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const sessionStartDateTime = new Date(sessionDate);
    sessionStartDateTime.setHours(startHour, startMinute, 0, 0);

    if (now < sessionStartDateTime) {
      const formattedDate = new Date(sessionDate).toLocaleDateString(
        locale === 'th' ? 'th-TH' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
      
      const errorMessage = translate('attendanceManagement.sessionTooEarly', {
        startTime,
        date: formattedDate
      }) || `It is too early to open this session. Please wait until ${startTime}.`;

      return badRequestResponse(errorMessage);
    }

    if (now > sessionEndDateTime) {
      const formattedDate = new Date(sessionDate).toLocaleDateString(
        locale === 'th' ? 'th-TH' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );

      const errorMessage = translate('attendanceManagement.sessionExpiredDetail', {
        endTime,
        date: formattedDate,
      });

      return badRequestResponse(errorMessage);
    }

    const existingSession = await AttendanceSession.findOne({
      courseId: course._id,
      sessionDate: parsedDate,
      startTime,
    });

    if (existingSession) {
      if (existingSession.status === 'closed' || existingSession.status === 'cancelled') {
        if (now > sessionEndDateTime) {
             existingSession.status = 'active';
             existingSession.closedAt = undefined; 
             await existingSession.save();

             return NextResponse.json({
                success: true,
                data: existingSession.toObject(),
                message: 'Session re-opened successfully',
             });
        }
         existingSession.status = 'active';
         existingSession.closedAt = undefined;
         await existingSession.save();

         return NextResponse.json({
            success: true,
            data: existingSession.toObject(),
            message: 'Session re-opened successfully',
         });
      }

      return badRequestResponse(
        `Session already exists for this course on ${parsedDate.toLocaleDateString()} at ${startTime}. Please choose a different date or time slot.`
      );
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
        absentCount: course.enrolledStudents.length,
      },
    });

    const studentIds = course.enrolledStudents.map((e: { studentId: mongoose.Types.ObjectId }) => e.studentId);
    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(students.map((s: { _id: mongoose.Types.ObjectId; name: string; studentId?: string }) => [s._id.toString(), { name: s.name, studentNumber: s.studentId }]));

    const attendanceRecords = course.enrolledStudents.map((enrollment: { studentId: mongoose.Types.ObjectId }) => {
      const studentInfo = studentMap.get(enrollment.studentId.toString());
      return {
        id: uuidv4(),
        sessionId: newSession._id,
        courseId: course._id,
        studentId: enrollment.studentId,
        studentName: studentInfo?.name || 'Unknown',
        studentNumber: studentInfo?.studentNumber || '',
        status: 'absent',
        checkInMethod: 'face_recognition',
        detectionCount: 0,
      };
    });

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error opening session:', error);

    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    if (error.message === 'Insufficient permissions') {
      return forbiddenResponse();
    }
    if (error.code === 11000) {
      return badRequestResponse(
        'Session already exists for this course, date, and time slot. Please choose a different date or time.'
      );
    }
    return serverErrorResponse(`Failed to open session: ${error.message}`);
  }
}
