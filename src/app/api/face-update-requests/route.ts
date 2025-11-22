import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { FaceUpdateRequest, Student } from '@/models';
import User from '@/models/User';
import { uploadBase64Image } from '@/lib/r2-upload';
import { verifyToken } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can submit face update requests' },
        { status: 403 }
      );
    }

    const user = await User.findOne({ username: payload.username, role: 'student' });
    if (!user || !user.profileId) {
      return NextResponse.json(
        { success: false, error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Allow multiple pending requests
    // const existingPending = await FaceUpdateRequest.findOne({
    //   userId: user._id,
    //   status: 'pending',
    // });

    // if (existingPending) {
    //   return NextResponse.json(
    //     { success: false, error: 'You already have a pending request' },
    //     { status: 409 }
    //   );
    // }

    const body = await request.json();
    const { faceDescriptor, imageData } = body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      );
    }

    const tempId = uuidv4();
    const uploadResult = await uploadBase64Image(imageData, tempId, 'temp-face');

    const student = await Student.findById(user.profileId);

    const newRequest = await FaceUpdateRequest.create({
      userId: user._id,
      studentId: user.profileId,
      requestType: 'update',
      status: 'pending',
      newFaceDescriptor: faceDescriptor,
      newImageUrl: uploadResult.imageUrl,
      newImageKey: uploadResult.imageKey,
      oldImageUrl: student?.imageUrl,
      oldImageKey: student?.imageKey,
    });

    return NextResponse.json(
      {
        success: true,
        data: newRequest.toObject(),
        message: 'Face update request submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating face update request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query: any = {};

    if (payload.role === 'student') {
      const user = await User.findOne({ username: payload.username });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      query.userId = user._id;
    } else if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const requests = await FaceUpdateRequest.find(query)
      .populate('userId', 'username fullName studentId')
      .populate('studentId', 'name studentId email department')
      .sort({ requestedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching face update requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
