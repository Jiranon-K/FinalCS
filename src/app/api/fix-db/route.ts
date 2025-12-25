/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Course from '@/models/Course';

export async function GET() {
  try {
    await connectDB();
    const collection = Course.collection;
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    const indexExists = indexes.some(idx => idx.name === 'code_1');

    if (indexExists) {
        await collection.dropIndex('code_1');
        return NextResponse.json({ success: true, message: 'Dropped code_1 index' });
    }

    return NextResponse.json({ success: true, message: 'Index code_1 not found', indexes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
