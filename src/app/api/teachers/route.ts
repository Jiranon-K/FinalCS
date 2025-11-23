import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { uploadBase64Image } from '@/lib/r2-upload';
import type { Teacher } from '@/types/teacher';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
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

    const db = await getDatabase();
    const collection = db.collection<Teacher>('teachers');

    const existingTeacher = await collection.findOne({
      teacherId: teacherId || '',
    });

    if (existingTeacher && teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher with this ID already exists' },
        { status: 409 }
      );
    }

    const personId = uuidv4();
    const { imageUrl, imageKey } = await uploadBase64Image(imageData, personId, 'teacher');

    const newTeacher: Teacher = {
      id: personId,
      name,
      teacherId: teacherId || undefined,
      email: email || undefined,
      phone: phone || undefined,
      department: department || undefined,
      imageUrl,
      imageKey,
      faceDescriptor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newTeacher as any);

    return NextResponse.json(
      {
        success: true,
        data: { ...newTeacher, _id: result.insertedId },
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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    const collection = db.collection<Teacher>('teachers');

    let query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
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
