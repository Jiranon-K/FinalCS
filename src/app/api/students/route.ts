import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Student } from '@/models';
import User from '@/models/User';
import { uploadBase64Image } from '@/lib/r2-upload';
import { verifyToken } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (payload.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can register face' },
        { status: 403 }
      );
    }

    const user = await User.findOne({
      username: payload.username,
      role: 'student'
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile already registered. Use profile page to update.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const {
      name,
      studentId,
      email,
      phone,
      department,
      grade,
      class: className,
      faceDescriptor,
      imageData,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    if (studentId && studentId !== user.studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID does not match your account' },
        { status: 400 }
      );
    }

    if (studentId || user.studentId) {
      const existingStudent = await Student.findOne({
        studentId: studentId || user.studentId
      });
      if (existingStudent) {
        return NextResponse.json(
          { success: false, error: 'Student with this ID already exists' },
          { status: 409 }
        );
      }
    }

    const personId = uuidv4();
    let imageUrl = `${process.env.R2_PUBLIC_URL}/default_profile/student.png`;
    let imageKey = 'default_profile/student.png';

    if (imageData) {
      const uploadResult = await uploadBase64Image(imageData, personId, 'student');
      imageUrl = uploadResult.imageUrl;
      imageKey = uploadResult.imageKey;
    }

    const newStudent = await Student.create({
      id: personId,
      userId: user._id,
      name,
      studentId: studentId || user.studentId,
      email: email || undefined,
      phone: phone || undefined,
      department: department || undefined,
      grade: grade || undefined,
      class: className || undefined,
      imageUrl,
      imageKey,
      faceDescriptor,
    });

    await User.findByIdAndUpdate(user._id, {
      $set: {
        profileId: newStudent._id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newStudent.toObject(),
        message: 'Face registration completed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    interface StudentQuery {
      $or?: Array<{
        name?: { $regex: string; $options: string };
        studentId?: { $regex: string; $options: string };
        email?: { $regex: string; $options: string };
      }>;
    }

    const query: StudentQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      Student.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + students.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
