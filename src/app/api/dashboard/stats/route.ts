import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import FaceUpdateRequest from '@/models/FaceUpdateRequest';
import { Course } from '@/models';

export async function GET() {
  try {
    await connectDB();

    const [
      totalUsers,
      pendingRequests,
      activeStudents,
      totalCourses
    ] = await Promise.all([
      User.countDocuments(),
      FaceUpdateRequest.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'student', profileId: { $exists: true, $ne: null } }),
      Course.countDocuments()
    ]);

    return NextResponse.json({
      totalUsers,
      pendingRequests,
      activeStudents,
      totalCourses
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
