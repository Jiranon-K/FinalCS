/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceRecord, AttendanceSession } from '@/models';
import User from '@/models/User';
import { AdjustAttendanceRequest } from '@/types/attendance';
import { requireAuth, canAccessCourse, forbiddenResponse, notFoundResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);

    if (user.role !== 'admin' && user.role !== 'teacher') {
      return forbiddenResponse('Only admin and teachers can adjust attendance');
    }

    const { id: recordId } = await params;
    const body: AdjustAttendanceRequest = await request.json();
    const { status, note } = body;

    if (!status) {
      return badRequestResponse('Status is required');
    }

    const record = await AttendanceRecord.findById(recordId);

    if (!record) {
      return notFoundResponse('Attendance record not found');
    }

    const session = await AttendanceSession.findById(record.sessionId);

    if (!session) {
      return notFoundResponse('Session not found');
    }

    const hasAccess = await canAccessCourse(session.courseId.toString(), user);
    if (!hasAccess && user.role !== 'admin') {
      return forbiddenResponse('You do not have access to this course');
    }

    const oldStatus = record.status;
    record.originalStatus = oldStatus;
    record.status = status;
    record.adjustmentNote = note;

    const currentUser = await User.findOne({ username: user.username });
    record.adjustedBy = currentUser?._id;
    record.adjustedAt = new Date();

    await record.save();

    let presentCount = 0;
    let absentCount = 0;

    const allRecords = await AttendanceRecord.find({ sessionId: session._id });

    for (const rec of allRecords) {
      if (rec.status === 'present') {
        presentCount++;
      } else if (rec.status === 'absent') {
        absentCount++;
      }
    }

    session.stats = {
      expectedCount: session.stats.expectedCount,
      presentCount,
      absentCount,
    };

    await session.save();

    return NextResponse.json({
      success: true,
      data: record.toObject(),
      message: 'Attendance status adjusted successfully',
    });
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
    console.error('Error adjusting attendance:', error);
    return serverErrorResponse('Failed to adjust attendance');
  }
}
