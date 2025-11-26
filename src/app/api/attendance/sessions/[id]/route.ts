import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord } from '@/models';
import { requireAuth, canAccessCourse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth-helpers';
import { isSessionExpired } from '@/lib/attendance-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    const { id: sessionId } = await params;

    const session = await AttendanceSession.findOne({ id: sessionId });

    if (!session) {
      return notFoundResponse('Session not found');
    }

    if (session.status === 'active' && isSessionExpired(session)) {
      session.status = 'closed';
      session.closedAt = new Date();
      await session.save();
    }

    const hasAccess = await canAccessCourse(session.courseId.toString(), user);
    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this session');
    }

    const records = await AttendanceRecord.find({ sessionId: session._id })
      .sort({ studentName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        session,
        records,
      },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching session:', error);
    return serverErrorResponse('Failed to fetch session');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    const { id: sessionId } = await params;

    if (user.role !== 'admin' && user.role !== 'teacher') {
      return forbiddenResponse('Only admin and teacher can delete sessions');
    }

    const session = await AttendanceSession.findOne({ id: sessionId }).lean();

    if (!session) {
      return notFoundResponse('Session not found');
    }

    const hasAccess = await canAccessCourse(session.courseId.toString(), user);
    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this session');
    }

    if (session.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete active session. Please close it first.' },
        { status: 400 }
      );
    }

    await AttendanceRecord.deleteMany({ sessionId: session._id });

    await AttendanceSession.deleteOne({ id: sessionId });

    return NextResponse.json({
      success: true,
      data: { message: 'Session deleted successfully' },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error deleting session:', error);
    return serverErrorResponse('Failed to delete session');
  }
}
