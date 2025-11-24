import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Teacher } from '@/models';
import { uploadBase64Image } from '@/lib/r2-upload';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      teacherId,
      email,
      phone,
      department,
      faceDescriptor,
      imageData,
    } = body;

    if (!name || !faceDescriptor || !imageData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, faceDescriptor, imageData' },
        { status: 400 }
      );
    }

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    if (teacherId) {
      const existingTeacher = await Teacher.findOne({ teacherId });
      if (existingTeacher) {
        return NextResponse.json(
          { success: false, error: 'Teacher with this ID already exists' },
          { status: 409 }
        );
      }
    }

    const personId = uuidv4();
    const { imageUrl, imageKey } = await uploadBase64Image(imageData, personId, 'teacher');

    const newTeacher = await Teacher.create({
      id: personId,
      name,
      teacherId: teacherId || undefined,
      email: email || undefined,
      phone: phone || undefined,
      department: department || undefined,
      imageUrl,
      imageKey,
      faceDescriptor,
    });

    return NextResponse.json(
      {
        success: true,
        data: newTeacher.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create teacher' },
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

    interface TeacherQuery {
      $or?: Array<{
        name?: { $regex: string; $options: string };
        teacherId?: { $regex: string; $options: string };
        email?: { $regex: string; $options: string };
      }>;
    }

    const query: TeacherQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { teacherId: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Teacher.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: teachers,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + teachers.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}
