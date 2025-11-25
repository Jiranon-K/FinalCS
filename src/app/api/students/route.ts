import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Student } from '@/models';
import { uploadBase64Image } from '@/lib/r2-upload';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    if (faceDescriptor && (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128)) {
      return NextResponse.json(
        { success: false, error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    if (studentId) {
      const existingStudent = await Student.findOne({ studentId });
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
      name,
      studentId: studentId || undefined,
      email: email || undefined,
      phone: phone || undefined,
      department: department || undefined,
      grade: grade || undefined,
      class: className || undefined,
      imageUrl,
      imageKey,
      faceDescriptor: faceDescriptor || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: newStudent.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
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
