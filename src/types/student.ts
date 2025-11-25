export interface Student {
  _id?: string;
  id: string;
  userId?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentRequest {
  name: string;
  studentId?: string;
  email?: string;
  phone?: string;
  department?: string;
  grade?: string;
  class?: string;
  faceDescriptor: number[];
}

export interface UpdateStudentRequest {
  name?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  department?: string;
  grade?: string;
  class?: string;
}
