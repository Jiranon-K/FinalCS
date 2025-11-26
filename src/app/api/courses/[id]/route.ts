import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Course } from '@/models';
import User from '@/models/User';
import { UpdateCourseRequest } from '@/types/course';
import { requireAuth, requireRole, canAccessCourse, forbiddenResponse, notFoundResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    const { id: courseId } = await params;

    const course = await Course.findById(courseId).lean();

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const hasAccess = await canAccessCourse(courseId, user);

    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this course');
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching course:', error);
    return serverErrorResponse('Failed to fetch course');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await requireRole(request, ['admin']);
    const { id: courseId } = await params;

    const body: UpdateCourseRequest = await request.json();

    const course = await Course.findById(courseId);

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const { teacherId, schedule, ...updateFields } = body;

    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return badRequestResponse('Invalid teacher ID');
      }
      course.teacherId = teacher._id;
      course.teacherName = teacher.fullName || teacher.username;
    }

    if (schedule && schedule.length > 0) {
      course.schedule = schedule.map((slot) => ({
        ...slot,
        graceMinutes: 30,
      }));
    }

    Object.assign(course, updateFields);

    await course.save();

    return NextResponse.json({
      success: true,
      data: course.toObject(),
      message: 'Course updated successfully',
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
    console.error('Error updating course:', error);
    return serverErrorResponse('Failed to update course');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    await requireRole(request, ['admin']);
    const { id: courseId } = await params;

    const result = await Course.deleteOne({ _id: courseId });

    if (result.deletedCount === 0) {
      return notFoundResponse('Course not found');
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
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
    console.error('Error deleting course:', error);
    return serverErrorResponse('Failed to delete course');
  }
}
