'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isLoginPage = pathname === '/login' || pathname === '/admin/login';
      
      if (isLoginPage) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/session');
        
        if (!res.ok) {
          router.push('/login');
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return <>{children}</>;
}
