import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord, Course } from '@/models';
import { Student } from '@/models';
import { RecordAttendanceRequest } from '@/types/attendance';
import { isSessionExpired } from '@/lib/attendance-helpers';
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

    if (isSessionExpired(session)) {
      session.status = 'closed';
      session.closedAt = new Date();
      await session.save();
      return badRequestResponse('Session has expired');
    }

    const course = await Course.findById(session.courseId);

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const student = await Student.findOne({ id: studentId }).lean();

    if (!student) {
      return notFoundResponse('Student not found');
    }

    const isEnrolled = course.enrolledStudents.some(
      (enrollment) => enrollment.studentId.toString() === student._id.toString()
    );

    if (!isEnrolled) {
      return badRequestResponse('Student is not enrolled in this course');
    }

    const checkInTime = new Date(timestamp);

    let record = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: student._id,
    });
    const status = 'present';

    if (!record) {
      record = new AttendanceRecord({
        id: `${session._id}-${student._id}-${Date.now()}`,
        sessionId: session._id,
        courseId: session.courseId,
        studentId: student._id,
        studentName: student.name,
        studentNumber: student.studentId || '',
        checkInTime: checkInTime,
        status: status,
        confidence: confidence,
        checkInMethod: method,
        detectionCount: 1,
        lastDetectedAt: checkInTime,
      });

      await record.save();

      // Update Session Stats: New Check-in
      session.stats.absentCount = Math.max(0, session.stats.absentCount - 1);
      session.stats.presentCount++;
      await session.save();

      return NextResponse.json({
        success: true,
        data: record.toObject(),
        message: 'Attendance recorded successfully',
        isNewCheckIn: true,
      });
    }

    const oldStatus = record.status;
    let statsUpdated = false;

    if (record.status !== 'present') {
      record.status = 'present';
      if (oldStatus !== 'present') {
        session.stats.absentCount = Math.max(0, session.stats.absentCount - 1);
        session.stats.presentCount++;
        statsUpdated = true;
      }
    }

    record.checkInTime = record.checkInTime || checkInTime; 
    record.lastDetectedAt = checkInTime;
    record.detectionCount = (record.detectionCount || 0) + 1;
    record.confidence = Math.max(record.confidence || 0, confidence); 

    await record.save();

    if (statsUpdated && session.status === 'active') {
      await session.save();
    }

    return NextResponse.json({
      success: true,
      data: record.toObject(),
      message: 'Attendance updated',
      isNewCheckIn: false,
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return serverErrorResponse('Failed to record attendance');
  }
}
