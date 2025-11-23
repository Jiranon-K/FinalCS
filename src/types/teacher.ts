export interface Teacher {
  _id?: string;
  id: string;
  name: string;
  teacherId?: string;
  email?: string;
  phone?: string;
  department?: string;
  imageUrl: string;
  imageKey: string;
  faceDescriptor: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeacherRequest {
  name: string;
  teacherId?: string;
  email?: string;
  phone?: string;
  department?: string;
  faceDescriptor: number[];
}

export interface UpdateTeacherRequest {
  name?: string;
  teacherId?: string;
  email?: string;
  phone?: string;
  department?: string;
}
