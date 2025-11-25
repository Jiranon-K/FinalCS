import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import { uploadBase64Image } from '@/lib/r2-upload';
import { hashPassword } from '@/lib/password';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { username: decodeURIComponent(id) };

    const user = await User.findOne(query)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const { password, role, profileId, imageData } = body;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { username: decodeURIComponent(id) };

    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: {
      password?: string;
      role?: 'student' | 'teacher' | 'admin';
      profileId?: string | null;
      imageUrl?: string;
      imageKey?: string;
    } = {};

    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      updateData.role = role;
    }

    if (profileId !== undefined) {
      updateData.profileId = profileId || null;
    }

    if (imageData) {
      const uploadResult = await uploadBase64Image(imageData, id, 'user');
      updateData.imageUrl = uploadResult.imageUrl;
      updateData.imageKey = uploadResult.imageKey;
    }

    const updatedUser = await User.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    )
      .select('-password')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { username: decodeURIComponent(id) };

    const result = await User.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
