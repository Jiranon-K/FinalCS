import { NextResponse } from 'next/server';
import { getTokenFromCookies, verifyToken } from '@/lib/jwt';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

export async function GET() {
  try {
    const token = await getTokenFromCookies();

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ username: payload.username, role: payload.role });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let profile = null;
    
    if (user.role === 'student' && user.profileId) {
      profile = await Student.findById(user.profileId).lean();
    } else if (user.role === 'teacher' && user.profileId) {
      profile = await Teacher.findById(user.profileId).lean();
    }

    return NextResponse.json({
      user: {
        username: payload.username,
        role: payload.role,
        name: profile?.name,
        fullName: user.fullName,
        email: profile?.email,
        phone: profile?.phone,
        department: profile?.department,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
