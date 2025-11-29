import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import FaceUpdateRequest from '@/models/FaceUpdateRequest';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    const recentRequests = await FaceUpdateRequest.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username role fullName');

    const activities = recentRequests.map(req => ({
      id: req._id,
      action: req.requestType,
      details: req.status,
      timestamp: req.createdAt,
      user: {
        name: (req.userId as any)?.fullName || (req.userId as any)?.username || 'Unknown',
        role: (req.userId as any)?.role || 'student'
      }
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to fetch dashboard activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
