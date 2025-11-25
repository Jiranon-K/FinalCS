import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import { generateToken, setTokenCookie } from '@/lib/jwt';
import { verifyPassword } from '@/lib/password';

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username, role });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or role' },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken({
      username: user.username,
      role: user.role,
    });

    await setTokenCookie(token);

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
