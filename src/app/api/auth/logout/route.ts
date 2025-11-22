import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/jwt';

export async function POST() {
  try {
    await clearTokenCookie();

    return NextResponse.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
