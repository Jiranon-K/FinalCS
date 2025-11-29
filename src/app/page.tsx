'use client';

import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import { useLocale } from "@/i18n/useLocale";

export default function Home() {
  const { user, isLoading: loading } = useAuth();
  const { t } = useLocale();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hero min-h-[calc(100vh-4rem)] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t.nav.title}</h1>
            <p className="py-6">
              {t.login?.subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'teacher' && <TeacherDashboard />}
      {user.role === 'student' && <StudentDashboard />}
    </div>
  );
}
