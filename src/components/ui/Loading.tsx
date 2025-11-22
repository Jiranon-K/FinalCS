import React from 'react';

export type LoadingVariant = 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity';
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export default function Loading({
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
  fullScreen = false,
}: LoadingProps) {
  const loadingClass = `loading loading-${variant} loading-${size} ${className}`;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-100/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <span className={loadingClass}></span>
          {text && <span className="text-sm font-medium text-base-content/70">{text}</span>}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className={loadingClass}></span>
        <span className="text-sm font-medium text-base-content/70">{text}</span>
      </div>
    );
  }

  return <span className={loadingClass}></span>;
}
