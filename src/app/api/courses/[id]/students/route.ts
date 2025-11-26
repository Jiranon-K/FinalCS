import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Course, Student } from '@/models';
import { requireAuth, canAccessCourse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth-helpers';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    const { id: courseId } = await params;

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

    const hasAccess = await canAccessCourse(courseId, user);

    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this course');
    }

    const studentIds = course.enrolledStudents.map((s: any) => s.studentId);

    const students = await Student.find({ _id: { $in: studentIds } })
      .select('name studentId imageKey imageUrl')
      .lean();

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching course students:', error);
    return serverErrorResponse('Failed to fetch course students');
  }
}
