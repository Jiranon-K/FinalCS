'use client';

import { ReactNode } from 'react';

interface ProfileSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
}

export default function ProfileSection({
  title,
  icon,
  children,
  action,
  className = '',
  isCollapsible = false,
  defaultOpen = true,
}: ProfileSectionProps) {
  if (isCollapsible) {
    return (
      <div 
        className={`collapse collapse-arrow bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl ${className}`}
      >
        <input type="checkbox" defaultChecked={defaultOpen} />
        <div className="collapse-title">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
              <h3 className="font-semibold text-lg text-base-content">{title}</h3>
            </div>
            {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
          </div>
        </div>
        <div className="collapse-content">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in-up ${className}`}
    >
      <div className="card-body p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
            <h3 className="font-semibold text-lg text-base-content">{title}</h3>
          </div>
          {action}
        </div>
        <div className="divider my-0 mb-4"></div>
        {children}
      </div>
    </div>
  );
}
