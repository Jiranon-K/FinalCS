import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Student } from '@/types/student';
import type { Teacher } from '@/types/teacher';
import type { PersonForRecognition } from '@/types/person';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    const studentsCollection = db.collection<Student>('students');
    const teachersCollection = db.collection<Teacher>('teachers');

    const [students, teachers] = await Promise.all([
      studentsCollection
        .find(
          { faceDescriptor: { $exists: true, $ne: null } },
          { projection: { id: 1, name: 1, imageUrl: 1, faceDescriptor: 1, _id: 0 } }
        )
        .toArray(),
      teachersCollection
        .find(
          { faceDescriptor: { $exists: true, $ne: null } },
          { projection: { id: 1, name: 1, imageUrl: 1, faceDescriptor: 1, _id: 0 } }
        )
        .toArray(),
    ]);

    const personsForRecognition: PersonForRecognition[] = [
      ...students.map(s => ({
        id: s.id,
        name: s.name,
        role: 'student' as const,
        imageUrl: s.imageUrl,
        faceDescriptor: s.faceDescriptor,
      })),
      ...teachers.map(t => ({
        id: t.id,
        name: t.name,
        role: 'teacher' as const,
        imageUrl: t.imageUrl,
        faceDescriptor: t.faceDescriptor,
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
