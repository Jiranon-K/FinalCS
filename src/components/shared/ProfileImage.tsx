'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProfileImageProps {
  imageUrl: string | null | undefined;
  role: 'student' | 'teacher' | 'admin';
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
  fill?: boolean;
}

const sizeMap = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-36 h-36',
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

function getDefaultImagePath(role: 'student' | 'teacher' | 'admin'): string {
  return role === 'student' 
    ? '/profile-deafault/student.png' 
    : '/profile-deafault/teacher.png';
}

export default function ProfileImage({
  imageUrl,
  role,
  alt = 'Profile',
  size = 'md',
  className = '',
  fallbackText,
  fill = false,
}: ProfileImageProps) {
  const [hasError, setHasError] = useState(false);
  
  const imageSrc = imageUrl && !hasError 
    ? imageUrl 
    : getDefaultImagePath(role);
  
  const handleError = () => {
    if (imageUrl) {
      setHasError(true);
    }
  };

  const initials = fallbackText 
    ? fallbackText.substring(0, 2).toUpperCase() 
    : role.substring(0, 2).toUpperCase();

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        onError={handleError}
      />
    );
  }

  return (
    <div className={`${sizeMap[size]} relative overflow-hidden rounded-full ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover"
        onError={handleError}
      />
    </div>
  );
}

export function ProfileImageWithFallback({
  imageUrl,
  role,
  alt = 'Profile',
  size = 'md',
  className = '',
  fallbackText,
}: ProfileImageProps) {
  const [hasError, setHasError] = useState(false);
  
  const initials = fallbackText 
    ? fallbackText.substring(0, 2).toUpperCase() 
    : role.substring(0, 2).toUpperCase();

  if (!imageUrl || hasError) {
    return (
      <div className={`${sizeMap[size]} rounded-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${textSizeMap[size]} font-bold text-primary ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeMap[size]} relative overflow-hidden rounded-full ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
