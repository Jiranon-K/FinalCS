import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { uploadBase64Image } from '@/lib/r2-upload';
import type { Student } from '@/types/student';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
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
    const collection = db.collection<Student>('students');

    const existingStudent = await collection.findOne({
      studentId: studentId || '',
    });

    if (existingStudent && studentId) {
      return NextResponse.json(
        { success: false, error: 'Student with this ID already exists' },
        { status: 409 }
      );
    }

    const personId = uuidv4();
    const { imageUrl, imageKey } = await uploadBase64Image(imageData, personId, 'student');

    const newStudent: Student = {
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
      faceDescriptor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newStudent as any);

    return NextResponse.json(
      {
        success: true,
        data: { ...newStudent, _id: result.insertedId },
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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    const collection = db.collection<Student>('students');

    let query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
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
