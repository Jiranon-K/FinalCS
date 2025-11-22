import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Student, User } from '@/models';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied: Admin only' }, { status: 403 });
    }

    const { studentId, email } = await request.json();
    
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student record not found' }, { status: 404 });
    }

    if (student.accountStatus === 'active') {
      return NextResponse.json({ success: false, error: 'Student account is already active' }, { status: 400 });
    }

    if (!student.studentId) {
      return NextResponse.json({ success: false, error: 'Student record is missing ID Card Number' }, { status: 400 });
    }

    const existingEmailUser = await User.findOne({ 
      $or: [{ username: email }, { email: email }]
    });
    if (existingEmailUser) {
      return NextResponse.json({ success: false, error: 'Email or Username is already in use' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(student.studentId, 10);

    const newUser = await User.create({
      username: email,
      email: email,
      password: hashedPassword,
      role: 'student',
      fullName: student.name,
      studentId: student.studentId,
      profileId: student._id,
      imageUrl: student.imageUrl,
      imageKey: student.imageKey
    });

    student.accountStatus = 'active';
    student.userId = newUser._id;
    student.email = email; 
    await student.save();

    return NextResponse.json({
      success: true,
      message: 'Student activated successfully',
      data: {
        userId: newUser._id,
        userEmail: newUser.email,
        studentId: student._id,
        status: student.accountStatus
      }
    });

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
