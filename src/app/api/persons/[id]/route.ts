import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  uploadImage,
  deleteImage,
  generateFaceImageKey,
  base64ToBuffer,
  extractContentType,
} from '@/lib/r2';
import type { Person, UpdatePersonRequest } from '@/types/person';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const personsCollection = db.collection<Person>('persons');

    const person = await personsCollection.findOne({ id });

    if (!person) {
      return NextResponse.json(
        {
          success: false,
          error: 'Person not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: person,
    });
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch person',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdatePersonRequest = await request.json();

    const db = await getDatabase();
    const personsCollection = db.collection<Person>('persons');

    const existingPerson = await personsCollection.findOne({ id });
    if (!existingPerson) {
      return NextResponse.json(
        {
          success: false,
          error: 'Person not found',
        },
        { status: 404 }
      );
    }

    const updateData: Partial<Person> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.studentId !== undefined) updateData.studentId = body.studentId;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    if (body.image) {
      const faceDescriptorData = request.headers.get('X-Face-Descriptor') || '';
      if (!faceDescriptorData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Face descriptor is required when updating image',
          },
          { status: 400 }
        );
      }

      const faceDescriptor = JSON.parse(faceDescriptorData);

      try {
        await deleteImage(existingPerson.imageKey);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }

      const imageBuffer = base64ToBuffer(body.image);
      const contentType = extractContentType(body.image);
      const imageKey = generateFaceImageKey(id, contentType.split('/')[1]);

      await uploadImage(imageBuffer, imageKey, contentType);

      updateData.imageUrl = `${process.env.R2_PUBLIC_URL}/${imageKey}`;
      updateData.imageKey = imageKey;
      updateData.faceDescriptor = Array.from(faceDescriptor);
    }

    await personsCollection.updateOne({ id }, { $set: updateData });

    const updatedPerson = await personsCollection.findOne({ id });

    return NextResponse.json({
      success: true,
      data: updatedPerson,
    });
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update person',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const personsCollection = db.collection<Person>('persons');

    const person = await personsCollection.findOne({ id });
    if (!person) {
      return NextResponse.json(
        {
          success: false,
          error: 'Person not found',
        },
        { status: 404 }
      );
    }

    try {
      await deleteImage(person.imageKey);
    } catch (error) {
      console.error('Error deleting image from R2:', error);
    }

    await personsCollection.deleteOne({ id });

    return NextResponse.json({
      success: true,
      message: 'Person deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete person',
      },
      { status: 500 }
    );
  }
}
