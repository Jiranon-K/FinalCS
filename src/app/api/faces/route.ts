import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Student, Teacher } from '@/models';
import type { PersonForRecognition } from '@/types/person';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const faceFilter = {
      faceDescriptor: { $exists: true, $ne: null },
    };

    const [students, teachers] = await Promise.all([
      Student.find(faceFilter, 'id name imageUrl faceDescriptor').lean(),
      Teacher.find(faceFilter, 'id name imageUrl faceDescriptor').lean(),
    ]);

    const personsForRecognition: PersonForRecognition[] = [
      ...students.map(s => ({
        id: s.id,
        name: s.name,
        role: 'student' as const,
        imageUrl: s.imageUrl,
        faceDescriptor: s.faceDescriptor!,
      })),
      ...teachers.map(t => ({
        id: t.id,
        name: t.name,
        role: 'teacher' as const,
        imageUrl: t.imageUrl,
        faceDescriptor: t.faceDescriptor!,
      })),
    ];

    return NextResponse.json({
      success: true,
      data: personsForRecognition,
      total: personsForRecognition.length,
    });
  } catch (error) {
    console.error('Error fetching faces for recognition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faces' },
      { status: 500 }
    );
  }
}
