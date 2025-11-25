import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import { uploadBase64Image } from '@/lib/r2-upload';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { username, password, role, fullName, imageData } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: username, password, role' },
        { status: 400 }
      );
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be student, teacher, or admin' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    let imageUrl = `${process.env.R2_PUBLIC_URL}/default_profile/user.png`;
    let imageKey = 'default_profile/user.png';

    if (imageData) {
      const uploadResult = await uploadBase64Image(imageData, username, 'user');
      imageUrl = uploadResult.imageUrl;
      imageKey = uploadResult.imageKey;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      fullName: fullName || undefined,
      imageUrl,
      imageKey,
    });

    const userObject = newUser.toObject();
    delete userObject.password;

    return NextResponse.json(
      {
        success: true,
        data: userObject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    interface UserQuery {
      $and?: Array<{
        username?: { $regex: string; $options: string };
        role?: string;
      }>;
    }

    const query: UserQuery = {};
    const conditions = [];

    if (search) {
      conditions.push({ username: { $regex: search, $options: 'i' } });
    }

    if (role) {
      conditions.push({ role });
    }

    if (conditions.length > 0) {
      query.$and = conditions;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
