import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord, Course } from '@/models';
import { Student } from '@/models';
import { RecordAttendanceRequest } from '@/types/attendance';
import { calculateAttendanceStatus } from '@/lib/attendance-helpers';
import { badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: RecordAttendanceRequest = await request.json();
    const { studentId, sessionId, timestamp, confidence, method } = body;

    if (!studentId || !sessionId || !timestamp) {
      return badRequestResponse('Missing required fields');
    }

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return notFoundResponse('Session not found');
    }

    if (session.status !== 'active') {
      return badRequestResponse('Session is not active');
    }

    const course = await Course.findById(session.courseId);

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return notFoundResponse('Student not found');
    }

    const isEnrolled = course.enrolledStudents.some(
      (enrollment) => enrollment.studentId.toString() === student._id.toString()
    );

    if (!isEnrolled) {
      return badRequestResponse('Student is not enrolled in this course');
    }

    const record = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: student._id,
    });

    const checkInTime = new Date(timestamp);

    if (!record) {
      return notFoundResponse('Attendance record not found');
    }

    if (!record.checkInTime) {
      const status = calculateAttendanceStatus(
        checkInTime,
        session.startTime,
        session.sessionDate,
        session.graceMinutes
      );

      record.checkInTime = checkInTime;
      record.status = status;
      record.confidence = confidence;
      record.checkInMethod = method;
      record.detectionCount = 1;
      record.lastDetectedAt = checkInTime;

      session.stats.absentCount = Math.max(0, session.stats.absentCount - 1);
      session.stats.presentCount++;
      if (status === 'normal') {
        session.stats.normalCount++;
      } else {
        session.stats.lateCount++;
      }
    } else {
      const minutesSinceCheckIn = (checkInTime.getTime() - record.checkInTime.getTime()) / 60000;

      if (minutesSinceCheckIn >= 5) {
        record.checkOutTime = checkInTime;
      }

      record.detectionCount++;
      record.lastDetectedAt = checkInTime;
    }

    await record.save();
    await session.save();

    return NextResponse.json({
      success: true,
      data: record.toObject(),
      message: 'Attendance recorded successfully',
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return serverErrorResponse('Failed to record attendance');
  }
}
