import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { AttendanceRecord, CreateAttendanceRequest} from '@/types/attendance';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const attendanceCollection = db.collection<AttendanceRecord>('attendance');

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const sessionId = searchParams.get('sessionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    interface QueryFilter {
      personId?: string;
      sessionId?: string;
      confidence?: { $gte: number };
      timestamp?: {
        $gte?: Date;
        $lte?: Date;
      };
    }

    const query: QueryFilter = {};

    if (personId) {
      query.personId = personId;
    }

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (minConfidence > 0) {
      query.confidence = { $gte: minConfidence };
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const records = await attendanceCollection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await attendanceCollection.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance records',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAttendanceRequest = await request.json();

    if (!body.personId || !body.personName || body.confidence === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'personId, personName, and confidence are required',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const attendanceCollection = db.collection<AttendanceRecord>('attendance');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAttendance = await attendanceCollection.findOne({
      personId: body.personId,
      timestamp: { $gte: fiveMinutesAgo },
      ...(body.sessionId && { sessionId: body.sessionId }),
    });

    if (recentAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate attendance detected. Person was already recorded within the last 5 minutes.',
          existingRecord: recentAttendance,
        },
        { status: 409 }
      );
    }

    const attendanceRecord: AttendanceRecord = {
      id: randomUUID(),
      personId: body.personId,
      personName: body.personName,
      timestamp: new Date(),
      confidence: body.confidence,
      imageUrl: body.imageUrl,
      sessionId: body.sessionId,
      metadata: body.metadata || { method: 'face_recognition' },
      createdAt: new Date(),
    };

    await attendanceCollection.insertOne(attendanceRecord);

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create attendance record',
      },
      { status: 500 }
    );
  }
}
