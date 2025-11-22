import { Types } from 'mongoose';

export interface CourseScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  graceMinutes: number;
}

export interface EnrolledStudent {
  studentId: Types.ObjectId;
  enrolledAt: Date;
}

export interface Course {
  _id?: Types.ObjectId;
  id: string;
  courseCode: string;
  courseName: string;

  teacherId: Types.ObjectId;
  teacherName: string;

  semester: string;
  academicYear: string;
  room: string;

  schedule: CourseScheduleSlot[];

  enrolledStudents: EnrolledStudent[];

  status: 'active' | 'archived' | 'draft';
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseRequest {
  courseCode: string;
  courseName: string;
  teacherId: string;
  semester: string;
  academicYear: string;
  room: string;
  schedule: Omit<CourseScheduleSlot, 'graceMinutes'>[];
  enrolledStudentIds?: string[];
}

export interface UpdateCourseRequest {
  courseCode?: string;
  courseName?: string;
  teacherId?: string;
  semester?: string;
  academicYear?: string;
  room?: string;
  schedule?: Omit<CourseScheduleSlot, 'graceMinutes'>[];
  status?: 'active' | 'archived' | 'draft';
  enrolledStudentIds?: string[];
}

export interface EnrollStudentsRequest {
  studentIds: string[];
}

export interface UnenrollStudentsRequest {
  studentIds: string[];
}

export interface CourseQuery {
  search?: string;
  teacherId?: string;
  semester?: string;
  status?: 'active' | 'archived' | 'draft';
  limit?: number;
  skip?: number;
}
