export interface Person {
  _id?: string;
  id: string;
  name: string;
  studentId?: string;
  email?: string;
  phone?: string;
  imageUrl: string;
  imageKey: string;
  faceDescriptor: number[];
  metadata?: PersonMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonMetadata {
  department?: string;
  grade?: string;
  class?: string;
  role?: 'student' | 'teacher' | 'staff';
  notes?: string;
  [key: string]: unknown;
}

export interface CreatePersonRequest {
  name: string;
  studentId?: string;
  email?: string;
  phone?: string;
  image: string;
  metadata?: PersonMetadata;
}

export interface UpdatePersonRequest {
  name?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  image?: string;
  metadata?: PersonMetadata;
}

export interface PersonListItem {
  id: string;
  name: string;
  studentId?: string;
  imageUrl: string;
  role?: string;
  createdAt: Date;
}

export interface PersonStats {
  totalPersons: number;
  students: number;
  teachers: number;
  staff: number;
  recentlyAdded: number;
}

export interface PersonForRecognition {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  imageUrl: string;
  faceDescriptor: number[];
}
