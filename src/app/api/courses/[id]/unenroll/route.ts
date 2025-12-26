/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Course, Student } from '@/models';
import { UnenrollStudentsRequest } from '@/types/course';
import { requireRole, notFoundResponse, badRequestResponse, serverErrorResponse, forbiddenResponse, canAccessCourse } from '@/lib/auth-helpers';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireRole(request, ['admin', 'teacher']);

    const { id: courseId } = await params;

    if (!(await canAccessCourse(courseId, user))) {
      return forbiddenResponse();
    }

    const body: UnenrollStudentsRequest = await request.json();
    const { studentIds } = body;

    console.log(`Unenrolling students from course ${courseId}:`, studentIds);

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

    const removed = [];
    const notFound = [];

    for (const studentIdStr of studentIds) {
      try {
        if (!mongoose.Types.ObjectId.isValid(studentIdStr)) {
          console.warn(`Invalid student ID format: ${studentIdStr}`);
          notFound.push(studentIdStr);
          continue;
        }

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
      } catch (err) {
        console.error(`Error processing student ${studentIdStr}:`, err);
        // Continue with other students instead of crashing entire request
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
