/* eslint-disable @typescript-eslint/no-explicit-any */
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

    const course = await Course.findOne({ id: courseId }).lean();

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

    const user = await requireAuth(request);
    const { id: courseId } = await params;

    const course = await Course.findOne({ id: courseId });

    if (!course) {
      return notFoundResponse('Course not found');
    }

    const isAdmin = user.role === 'admin';
    let isTeacherOwner = false;

    if (user.role === 'teacher') {
      const userDoc = await User.findOne({ username: user.username });
      isTeacherOwner = course.teacherId.toString() === userDoc?._id.toString();
    }

    if (!isAdmin && !isTeacherOwner) {
      return forbiddenResponse('You do not have permission to edit this course');
    }

    const body: UpdateCourseRequest = await request.json();

    const { teacherId, schedule, enrolledStudentIds, ...updateFields } = body;

    if (teacherId && isAdmin) {
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

    if (enrolledStudentIds !== undefined && (isAdmin || isTeacherOwner)) {
      const Student = (await import('@/models/Student')).default;
      const validStudents = await Student.find({ _id: { $in: enrolledStudentIds } });
      course.enrolledStudents = validStudents.map((s: any) => ({
        studentId: s._id,
        enrolledAt: new Date(),
      }));
    }

    if (isAdmin) {
      Object.assign(course, updateFields);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { status, ...teacherAllowedFields } = updateFields;
      Object.assign(course, teacherAllowedFields);
    }

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

    const result = await Course.deleteOne({ id: courseId });

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
