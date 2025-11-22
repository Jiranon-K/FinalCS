export interface JWTPayload {
  username: string;
  role: "student" | "teacher" | "admin";
  userId?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: "student" | "teacher" | "admin";
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  imageUrl?: string;
}
