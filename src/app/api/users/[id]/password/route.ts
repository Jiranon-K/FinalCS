import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/models';
import { hashPassword, verifyPassword } from '@/lib/password';
import { getTokenFromCookies, verifyToken } from '@/lib/jwt';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. JWT Authentication Check
    const token = await getTokenFromCookies();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. Authorization Check - User can only change their own password
    const username = decodeURIComponent(params.id);
    if (payload.username !== username) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only change your own password' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 4. Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // 5. Validate new password policy
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // 6. Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // 7. Connect to database
    await connectDB();

    // 8. Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 9. Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // 10. Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // 11. Update password in database
    await User.findOneAndUpdate(
      { username },
      { $set: { password: hashedPassword } }
    );

    // 12. Return success response
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change password',
      },
      { status: 500 }
    );
  }
}
