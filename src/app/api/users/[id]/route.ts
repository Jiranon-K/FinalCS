import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import { Student, FaceUpdateRequest } from '@/models';
import { uploadBase64Image, deleteR2Image } from '@/lib/r2-upload';
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
    const { password, role, profileId, imageData, fullName, studentId, removeImage } = body;

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
      imageUrl?: string | null;
      imageKey?: string | null;
      fullName?: string;
      studentId?: string;
    } = {};

    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      updateData.role = role;
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }

    if (role === 'student' || (user.role === 'student' && !role)) {
        if (studentId !== undefined) {
            updateData.studentId = studentId;
        }
    }

    if (profileId !== undefined) {
      updateData.profileId = profileId || null;
    }

    if (imageData) {
      const uploadResult = await uploadBase64Image(imageData, id, 'user');
      updateData.imageUrl = uploadResult.imageUrl;
      updateData.imageKey = uploadResult.imageKey;
    } else if (removeImage) {
        if (user.imageKey) {
            try {
                await deleteR2Image(user.imageKey);
            } catch (error) {
                console.error('Failed to delete R2 image:', error);
            }
        }
        updateData.imageUrl = null;
        updateData.imageKey = null;
    }

    const finalUpdate: {
        $set: typeof updateData;
        $unset?: { [key: string]: 1 };
    } = { $set: updateData };

    if (role && role !== 'student' && user.role === 'student') {
        finalUpdate.$unset = { studentId: 1 };
    }

    const updatedUser = await User.findOneAndUpdate(
      query,
      finalUpdate,
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

    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const studentDeleteResult = await Student.deleteMany({ userId: user._id });
    console.log(`Deleted ${studentDeleteResult.deletedCount} student(s) for user ${user.username}`);

    const requestDeleteResult = await FaceUpdateRequest.deleteMany({ userId: user._id });
    console.log(`Deleted ${requestDeleteResult.deletedCount} face update request(s) for user ${user.username}`);

    if (user.imageKey) {
      try {
        await deleteR2Image(user.imageKey);
      } catch (error) {
        console.error('Failed to delete R2 image:', error);
      }
    }

    const result = await User.deleteOne({ _id: user._id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User and related data deleted successfully',
      details: {
        studentsDeleted: studentDeleteResult.deletedCount,
        requestsDeleted: requestDeleteResult.deletedCount,
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
