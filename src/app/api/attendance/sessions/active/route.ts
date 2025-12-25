import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceSession } from '@/models';
import { checkAndCloseExpiredSessions } from '@/lib/session-service';
import { serverErrorResponse } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await connectDB();
    await checkAndCloseExpiredSessions();

    const activeSessions = await AttendanceSession.find({ status: 'active' })
      .sort({ sessionDate: -1, startTime: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: activeSessions,
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return serverErrorResponse('Failed to fetch active sessions');
  }
}
