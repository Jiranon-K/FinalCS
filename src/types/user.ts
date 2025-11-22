export interface User {
  _id: string;
  username: string;
  email?: string;
  fullName?: string;
  role: "student" | "teacher" | "admin";
  imageUrl?: string;
  imageKey?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: Date;
  profileId?: string;
}

export interface CreateUserRequest {
  username: string;
  password?: string;
  email?: string;
  fullName?: string;
  role: "student" | "teacher" | "admin";
  imageUrl?: string;
}
