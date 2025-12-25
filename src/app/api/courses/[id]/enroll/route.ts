/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Course, Student } from '@/models';
import { EnrollStudentsRequest } from '@/types/course';
import { requireRole, notFoundResponse, badRequestResponse, serverErrorResponse, forbiddenResponse } from '@/lib/auth-helpers';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    await requireRole(request, ['admin']);
    const { id: courseId } = await params;

    const body: EnrollStudentsRequest = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return badRequestResponse('Student IDs are required');
    }

    let course;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }
    if (!course) {
      course = await Course.findOne({ id: courseId });
    }

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const newEnrollments = [];
    const alreadyEnrolled = [];

    for (const studentIdStr of studentIds) {
      const student = await Student.findById(studentIdStr);

      if (!student) {
        continue;
      }

      const isEnrolled = course.enrolledStudents.some(
        (enrollment) => enrollment.studentId.toString() === student._id.toString()
      );

      if (isEnrolled) {
        alreadyEnrolled.push(student.name);
      } else {
        course.enrolledStudents.push({
          studentId: student._id,
          enrolledAt: new Date(),
        });
        newEnrollments.push(student.name);
      }
    }

    await course.save();

    return NextResponse.json({
      success: true,
      data: course.toObject(),
      message: `Enrolled ${newEnrollments.length} student(s) successfully`,
      details: {
        enrolled: newEnrollments,
        alreadyEnrolled,
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
    console.error('Error enrolling students:', error);
    return serverErrorResponse('Failed to enroll students');
  }
}
