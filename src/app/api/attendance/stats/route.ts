import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceRecord, AttendanceSession, Course } from '@/models';
import User from '@/models/User';
import { requireAuth, serverErrorResponse } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'week') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const sessionQuery: any = {
      sessionDate: { $gte: startDate, $lte: endDate }
    };

    if (user.role === 'teacher') {
      const userDoc = await User.findOne({ username: user.username });
      if (userDoc) {
        const teacherCourses = await Course.find({ teacherId: userDoc._id }).select('_id');
        sessionQuery.courseId = { $in: teacherCourses.map(c => c._id) };
      }
    }

    const sessions = await AttendanceSession.find(sessionQuery);
    const sessionIds = sessions.map(s => s._id);

    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds }
    });

    const totalSessions = sessions.length;
    const totalRecords = records.length;

    const presentCount = records.filter(r => r.status === 'normal').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const leaveCount = records.filter(r => r.status === 'leave').length;

    const averageRate = totalRecords > 0
      ? ((presentCount + lateCount) / totalRecords) * 100
      : 0;

    const courseStatsMap = new Map();

    for (const session of sessions) {
      const courseId = session.courseId.toString();
      if (!courseStatsMap.has(courseId)) {
        const course = await Course.findById(courseId).select('courseName courseCode');
        if (course) {
          courseStatsMap.set(courseId, {
            courseId,
            courseName: course.courseName,
            courseCode: course.courseCode,
            totalSessions: 0,
            presentCount: 0,
            totalExpected: 0
          });
        }
      }

      const stats = courseStatsMap.get(courseId);
      if (stats) {
        stats.totalSessions++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalRecords,
        averageRate,
        todayStats: {
          sessions: totalSessions,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          leave: leaveCount
        },
        weeklyStats: {
          sessions: totalSessions,
          presentRate: averageRate
        }
      },
      courseStats: Array.from(courseStatsMap.values())
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return serverErrorResponse('Failed to fetch statistics');
  }
}
