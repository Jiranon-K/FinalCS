import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { Course } from '@/models';
import User from '@/models/User';
import { Student } from '@/models';
import { CreateCourseRequest } from '@/types/course';
import { requireAuth, requireRole, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireRole(request, ['admin']);

    const body: CreateCourseRequest = await request.json();
    const {
      courseCode,
      courseName,
      teacherId,
      semester,
      academicYear,
      room,
      schedule,
      enrolledStudentIds,
    } = body;

    if (!courseCode || !courseName || !teacherId || !semester || !academicYear || !room || !schedule || schedule.length === 0) {
      return badRequestResponse('Missing required fields');
    }

    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return badRequestResponse('Course code already exists');
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return badRequestResponse('Invalid teacher ID');
    }

    const courseId = uuidv4();

    const enrolledStudents = [];
    if (enrolledStudentIds && enrolledStudentIds.length > 0) {
      for (const studentIdStr of enrolledStudentIds) {
        const student = await Student.findById(studentIdStr);
        if (student) {
          enrolledStudents.push({
            studentId: student._id,
            enrolledAt: new Date(),
          });
        }
      }
    }

    const scheduleWithDefaults = schedule.map((slot) => ({
      ...slot,
      graceMinutes: 30,
    }));

    const currentUser = await User.findOne({ username: user.username });

    const newCourse = await Course.create({
      id: courseId,
      courseCode,
      courseName,
      teacherId: teacher._id,
      teacherName: teacher.fullName || teacher.username,
      semester,
      academicYear,
      room,
      schedule: scheduleWithDefaults,
      enrolledStudents,
      status: 'active',
      createdBy: currentUser?._id,
    });

    return NextResponse.json(
      {
        success: true,
        data: newCourse.toObject(),
        message: 'Course created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid token')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return forbiddenResponse();
    }
    console.error('Error creating course:', error);
    return serverErrorResponse('Failed to create course');
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const teacherId = searchParams.get('teacherId') || '';
    const semester = searchParams.get('semester') || '';
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    interface CourseQuery {
      $or?: Array<{
        courseName?: { $regex: string; $options: string };
        courseCode?: { $regex: string; $options: string };
      }>;
      teacherId?: string | Types.ObjectId;
      semester?: string;
      status?: string;
      'enrolledStudents.studentId'?: string | Types.ObjectId;
    }

    const query: CourseQuery = {};

    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    if (studentId) {
       query['enrolledStudents.studentId'] = studentId;
    }

    if (semester) {
      query.semester = semester;
    }

    if (status) {
      query.status = status;
    }

    if (user.role === 'teacher') {
      const userDoc = await User.findOne({ username: user.username });
      if (userDoc) {
        query.teacherId = userDoc._id;
      }
    }

    if (user.role === 'student') {
      const userDoc = await User.findOne({ username: user.username });
      if (!userDoc?.profileId) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { total: 0, limit, skip, hasMore: false },
        });
      }

      const courses = await Course.find({
        'enrolledStudents.studentId': userDoc.profileId,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Course.countDocuments({
        'enrolledStudents.studentId': userDoc.profileId,
      });

      return NextResponse.json({
        success: true,
        data: courses,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + courses.length < total,
        },
      });
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + courses.length < total,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid token')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    console.error('Error fetching courses:', error);
    return serverErrorResponse('Failed to fetch courses');
  }
}
