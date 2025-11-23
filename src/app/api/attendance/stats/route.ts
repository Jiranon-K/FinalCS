import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { AttendanceRecord, DailyAttendanceStats } from '@/types/attendance';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const attendanceCollection = db.collection<AttendanceRecord>('attendance');

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day';

    interface DateQueryFilter {
      timestamp?: {
        $gte?: Date;
        $lte?: Date;
      };
    }

    const dateQuery: DateQueryFilter = {};
    if (startDate || endDate) {
      dateQuery.timestamp = {};
      if (startDate) {
        dateQuery.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.timestamp.$lte = new Date(endDate);
      }
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateQuery.timestamp = { $gte: thirtyDaysAgo };
    }

    const totalRecords = await attendanceCollection.countDocuments(dateQuery);

    const uniquePersons = await attendanceCollection.distinct('personId', dateQuery);

    const avgConfidenceResult = await attendanceCollection
      .aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            avgConfidence: { $avg: '$confidence' },
          },
        },
      ])
      .toArray();

    const averageConfidence =
      avgConfidenceResult.length > 0 ? avgConfidenceResult[0].avgConfidence : 0;

    const dailyStats = await attendanceCollection
      .aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
            },
            totalAttendance: { $sum: 1 },
            uniquePersons: { $addToSet: '$personId' },
            avgConfidence: { $avg: '$confidence' },
            faceRecognitionCount: {
              $sum: {
                $cond: [{ $eq: ['$metadata.method', 'face_recognition'] }, 1, 0],
              },
            },
            manualCount: {
              $sum: {
                $cond: [{ $eq: ['$metadata.method', 'manual'] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            date: '$_id',
            totalAttendance: 1,
            uniquePersons: { $size: '$uniquePersons' },
            averageConfidence: '$avgConfidence',
            byMethod: {
              face_recognition: '$faceRecognitionCount',
              manual: '$manualCount',
            },
          },
        },
        { $sort: { date: 1 } },
      ])
      .toArray();

    const byMethodResult = await attendanceCollection
      .aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$metadata.method',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const byMethod = byMethodResult.reduce((acc: Record<string, number>, item) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});

    const topAttendees = await attendanceCollection
      .aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$personId',
            personName: { $first: '$personName' },
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            personId: '$_id',
            personName: 1,
            count: 1,
            avgConfidence: 1,
          },
        },
      ])
      .toArray();

    const hourlyDistribution = await attendanceCollection
      .aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            hour: '$_id',
            count: 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRecords,
          uniquePersons: uniquePersons.length,
          averageConfidence,
          byMethod,
        },
        dailyStats,
        topAttendees,
        hourlyDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance statistics',
      },
      { status: 500 }
    );
  }
}
