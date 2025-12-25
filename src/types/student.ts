
/**
 * Student Interface Definition
 * Defines the structure of student data in the application.
 */

export interface Student {
  _id?: string;
  id: string;
  userId?: string | { _id: string; imageUrl?: string; };
  name: string;
  studentId?: string;
  email?: string;
  phone?: string;
  department?: string;
  grade?: string;
  class?: string;
  imageUrl: string;
  imageKey: string;
  faceDescriptor?: number[];
  faceDescriptors?: number[][];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payload for creating a new student
 */
export interface CreateStudentRequest {
  name: string;
  studentId?: string;
  email?: string;
  phone?: string;
  department?: string;
  grade?: string;
  class?: string;
  faceDescriptor?: number[];
  faceDescriptors?: number[][];
  imageData?: string;
}

/**
 * Payload for updating an existing student
 */
export interface UpdateStudentRequest {
  name?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  department?: string;
  grade?: string;
  class?: string;
}
