import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { Course } from '@/models';
import User from '@/models/User';

export interface JWTPayload {
  username: string;
  role: 'student' | 'teacher' | 'admin';
  userId?: string;
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    throw new Error('Authentication required');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Invalid token');
  }

  return payload as JWTPayload;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<JWTPayload> {
  const payload = await requireAuth(request);

  if (!allowedRoles.includes(payload.role)) {
    throw new Error('Insufficient permissions');
  }

  return payload;
}

export async function canAccessCourse(
  courseId: string,
  user: JWTPayload
): Promise<boolean> {
  if (user.role === 'admin') {
    return true;
  }

  let course = null;
  try {
    course = await Course.findById(courseId);
  } catch {
    course = null;
  }
  if (!course) {
    course = await Course.findOne({ id: courseId });
  }

  if (!course) {
    return false;
  }

  if (user.role === 'teacher') {
    const userDoc = await User.findOne({ username: user.username });
    return course.teacherId.toString() === userDoc?._id?.toString();
  }

  if (user.role === 'student') {
    const userDoc = await User.findOne({ username: user.username });

    if (!userDoc?.profileId) {
      return false;
    }

    return course.enrolledStudents.some(
      (enrollment) => enrollment.studentId.toString() === userDoc.profileId?.toString()
    );
  }

  return false;
}

export function unauthorizedResponse(message: string = 'Authentication required') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message: string = 'Insufficient permissions') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

export function notFoundResponse(message: string = 'Resource not found') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  );
}

export function badRequestResponse(message: string = 'Bad request') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  );
}

export function serverErrorResponse(message: string = 'Internal server error') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}
