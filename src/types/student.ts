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
  accountStatus?: 'active' | 'waiting';
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
  faceDescriptor?: number[];
  faceDescriptors?: number[][];
  imageData?: string;
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
