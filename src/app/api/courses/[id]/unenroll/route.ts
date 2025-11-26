import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Course, Student } from '@/models';
import { UnenrollStudentsRequest } from '@/types/course';
import { requireRole, notFoundResponse, badRequestResponse, serverErrorResponse, forbiddenResponse } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    await requireRole(request, ['admin']);
    const courseId = params.id;

    const body: UnenrollStudentsRequest = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return badRequestResponse('Student IDs are required');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const removed = [];
    const notFound = [];

    for (const studentIdStr of studentIds) {
      const student = await Student.findById(studentIdStr);

      if (!student) {
        notFound.push(studentIdStr);
        continue;
      }

      const initialLength = course.enrolledStudents.length;
      course.enrolledStudents = course.enrolledStudents.filter(
        (enrollment) => enrollment.studentId.toString() !== student._id.toString()
      );

      if (course.enrolledStudents.length < initialLength) {
        removed.push(student.name);
      } else {
        notFound.push(student.name);
      }
    }

    await course.save();

    return NextResponse.json({
      success: true,
      data: course.toObject(),
      message: `Removed ${removed.length} student(s) successfully`,
      details: {
        removed,
        notEnrolled: notFound,
      },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    if (error.message === 'Insufficient permissions') {
      return forbiddenResponse();
    }
    console.error('Error unenrolling students:', error);
    return serverErrorResponse('Failed to unenroll students');
  }
}
