import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord } from '@/models';
import { requireAuth, canAccessCourse, notFoundResponse, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);

    if (user.role !== 'admin' && user.role !== 'teacher') {
      return forbiddenResponse('Only admin and teachers can close sessions');
    }

    const { id: sessionId } = await params;

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return notFoundResponse('Session not found');
    }

    if (session.status === 'closed') {
      return badRequestResponse('Session is already closed');
    }

    const hasAccess = await canAccessCourse(session.courseId.toString(), user);
    if (!hasAccess && user.role !== 'admin') {
      return forbiddenResponse('You do not have access to this session');
    }

    session.status = 'closed';
    session.closedAt = new Date();

    const records = await AttendanceRecord.find({ sessionId: session._id });

    let presentCount = 0;
    let normalCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    for (const record of records) {
      if (record.status === 'normal') {
        presentCount++;
        normalCount++;
      } else if (record.status === 'late') {
        presentCount++;
        lateCount++;
      } else if (record.status === 'leave') {
        leaveCount++;
      } else if (record.status === 'absent') {
        absentCount++;
      }
    }

    session.stats = {
      expectedCount: session.stats.expectedCount,
      presentCount,
      normalCount,
      lateCount,
      absentCount,
      leaveCount,
    };

    await session.save();

    return NextResponse.json({
      success: true,
      data: session.toObject(),
      message: 'Session closed successfully',
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
    console.error('Error closing session:', error);
    return serverErrorResponse('Failed to close session');
  }
}
