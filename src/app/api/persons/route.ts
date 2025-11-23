import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { uploadImage, generateFaceImageKey, base64ToBuffer, extractContentType } from '@/lib/r2';
import type { Person, CreatePersonRequest } from '@/types/person';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const personsCollection = db.collection<Person>('persons');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    interface QueryFilter {
      'metadata.role'?: string;
      $or?: Array<{
        name?: { $regex: string; $options: string };
        studentId?: { $regex: string; $options: string };
        email?: { $regex: string; $options: string };
      }>;
    }

    const query: QueryFilter = {};
    if (role) {
      query['metadata.role'] = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const persons = await personsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await personsCollection.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: persons,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch persons',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePersonRequest = await request.json();

    if (!body.name || !body.image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and image are required',
        },
        { status: 400 }
      );
    }

    const faceDescriptorData = (request.headers.get('X-Face-Descriptor') || '');
    if (!faceDescriptorData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Face descriptor is required. Please ensure face detection was successful.',
        },
        { status: 400 }
      );
    }

    const faceDescriptor = JSON.parse(faceDescriptorData);

    const personId = randomUUID();

    const imageBuffer = base64ToBuffer(body.image);
    const contentType = extractContentType(body.image);
    const imageKey = generateFaceImageKey(personId, contentType.split('/')[1]);

    await uploadImage(imageBuffer, imageKey, contentType);

    const person: Person = {
      id: personId,
      name: body.name,
      studentId: body.studentId,
      email: body.email,
      phone: body.phone,
      imageUrl: `${process.env.R2_PUBLIC_URL}/${imageKey}`,
      imageKey,
      faceDescriptor: Array.from(faceDescriptor),
      metadata: body.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    const personsCollection = db.collection<Person>('persons');
    await personsCollection.insertOne(person);

    return NextResponse.json({
      success: true,
      data: person,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create person',
      },
      { status: 500 }
    );
  }
}
