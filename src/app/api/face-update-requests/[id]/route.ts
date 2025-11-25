import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { FaceUpdateRequest, Student } from '@/models';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const adminUser = await User.findOne({ username: payload.username, role: 'admin' });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin user not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const faceRequest = await FaceUpdateRequest.findById(id);
    if (!faceRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    if (faceRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Request already processed' },
        { status: 409 }
      );
    }

    if (action === 'approve') {
      await Student.findByIdAndUpdate(faceRequest.studentId, {
        $set: {
          faceDescriptor: faceRequest.newFaceDescriptor,
          imageUrl: faceRequest.newImageUrl,
          imageKey: faceRequest.newImageKey,
        },
      });

      await User.findByIdAndUpdate(faceRequest.userId, {
        $set: {
          imageUrl: faceRequest.newImageUrl,
          imageKey: faceRequest.newImageKey,
        },
      });

      faceRequest.status = 'approved';
      faceRequest.reviewedAt = new Date();
      faceRequest.reviewedBy = adminUser._id;
      await faceRequest.save();

      return NextResponse.json({
        success: true,
        message: 'Face update approved and applied',
        data: faceRequest.toObject(),
      });
    } else {
      // Reject
      if (!rejectionReason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      faceRequest.status = 'rejected';
      faceRequest.rejectionReason = rejectionReason;
      faceRequest.reviewedAt = new Date();
      faceRequest.reviewedBy = adminUser._id;
      await faceRequest.save();

      return NextResponse.json({
        success: true,
        message: 'Face update request rejected',
        data: faceRequest.toObject(),
      });
    }
  } catch (error) {
    console.error('Error updating face request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const faceRequest = await FaceUpdateRequest.findById(id);
    if (!faceRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const user = await User.findOne({ username: payload.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const isOwner = faceRequest.userId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this request' },
        { status: 403 }
      );
    }

    if (faceRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only delete pending requests' },
        { status: 409 }
      );
    }

    await FaceUpdateRequest.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully',
    });
  } catch (error) {
    console.error('Error deleting face request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}
