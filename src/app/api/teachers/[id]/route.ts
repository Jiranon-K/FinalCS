import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Teacher } from '@/models';
import type { UpdateTeacherRequest } from '@/types/teacher';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const teacher = await Teacher.findOne({ id }).lean();

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher' },
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
    const { name, teacherId, email, phone, department } = body;

    const updateData: Partial<UpdateTeacherRequest> = {};

    if (name !== undefined) updateData.name = name;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;

    const result = await Teacher.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update teacher' },
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

    const result = await Teacher.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}
