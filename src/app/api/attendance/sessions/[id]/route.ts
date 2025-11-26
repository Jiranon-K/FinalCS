import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession, AttendanceRecord } from '@/models';
import { requireAuth, canAccessCourse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    const { id: sessionId } = await params;

    const session = await AttendanceSession.findById(sessionId).lean();

    if (!session) {
      return notFoundResponse('Session not found');
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
