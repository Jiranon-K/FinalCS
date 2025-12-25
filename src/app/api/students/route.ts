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
      faceDescriptors,
      imageData,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const hasSingleDescriptor = faceDescriptor && Array.isArray(faceDescriptor) && faceDescriptor.length === 128;
    const hasMultiDescriptors = faceDescriptors && Array.isArray(faceDescriptors) && faceDescriptors.length > 0;

    if (!hasMultiDescriptors && !hasSingleDescriptor) {
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
      faceDescriptor: faceDescriptor || (faceDescriptors && faceDescriptors[0]),
      faceDescriptors: faceDescriptors,
    });

    await User.findByIdAndUpdate(user._id, {
      $set: {
        profileId: newStudent._id,
        imageUrl,
        imageKey,
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

    const hasFaceParam = searchParams.get('hasFace');

    const searchConditions = search
      ? [
          { name: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      : [];

    const query: Record<string, unknown> = {};
    const conditions: Record<string, unknown>[] = [];

    // Add search conditions if present
    if (searchConditions.length > 0) {
      conditions.push({ $or: searchConditions });
    }

    // Add face filter condition if present
    if (hasFaceParam !== null) {
      const hasFace = hasFaceParam === 'true';
      if (hasFace) {
        conditions.push({
          faceDescriptor: { $exists: true, $not: { $size: 0 } }
        });
      } else {
        // Find students with NO face descriptor, NULL, or EMPTY array
        conditions.push({
          $or: [
            { faceDescriptor: { $exists: false } },
            { faceDescriptor: null },
            { faceDescriptor: { $size: 0 } }
          ]
        });
      }
    }

    // Combine conditions
    if (conditions.length > 0) {
      if (conditions.length === 1) {
        // If only one condition, merge it directly to avoid unnecessary $and nesting
        // Check if the condition is an $or or simple field
        const condition = conditions[0];
        if (condition.$or) {
          query.$or = condition.$or;
        } else {
          Object.assign(query, condition);
        }
      } else {
        query.$and = conditions;
      }
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('userId', 'imageUrl')
        .lean()
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
