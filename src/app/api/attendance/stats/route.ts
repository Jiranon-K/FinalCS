import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { AttendanceRecord, AttendanceSession, Course } from '@/models';
import User from '@/models/User';
import Student from '@/models/Student';
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
    let teacherCourseIds: string[] = [];

    if (user.role === 'teacher') {
      const userDoc = await User.findOne({ username: user.username });
      if (userDoc) {
        const teacherCourses = await Course.find({ teacherId: userDoc._id }).select('_id');
        teacherCourseIds = teacherCourses.map(c => c._id.toString());
        sessionQuery.courseId = { $in: teacherCourseIds };
      }
    }
    
    let studentId: string | null = null;
    if (user.role === 'student') {
      const userDoc = await User.findOne({ username: user.username });
      if (userDoc && userDoc.profileId) {
        studentId = userDoc.profileId.toString();
        const studentCourses = await Course.find({ enrolledStudents: { $in: [userDoc.profileId] } as any }).select('_id');
        const studentCourseIds = studentCourses.map(c => c._id.toString());
        sessionQuery.courseId = { $in: studentCourseIds };
      } else {
        return NextResponse.json({
          success: true,
          stats: {
            totalSessions: 0,
            totalRecords: 0,
            averageRate: 0,
            todayStats: { sessions: 0, present: 0, late: 0, absent: 0, leave: 0 },
            weeklyStats: { sessions: 0, presentRate: 0 }
          },
          courseStats: [],
          trend: [],
          recentSessions: [],
          atRiskStudents: []
        });
      }
    }

    const sessions = await AttendanceSession.find(sessionQuery).sort({ sessionDate: -1 });
    const sessionIds = sessions.map(s => s._id);

    const recordQuery: any = { sessionId: { $in: sessionIds } };
    if (studentId) {
      recordQuery.studentId = studentId;
    }

    const records = await AttendanceRecord.find(recordQuery);

    // --- Basic Stats ---
    const totalSessions = sessions.length;
    const totalRecords = records.length; // For student, this is number of attended/marked sessions
    const presentCount = records.filter(r => r.status === 'normal').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const leaveCount = records.filter(r => r.status === 'leave').length;

    let averageRate = 0;
    if (user.role === 'student') {
        averageRate = totalSessions > 0 
            ? ((presentCount + lateCount) / totalSessions) * 100 
            : 0;
    } else {
        averageRate = totalRecords > 0
            ? ((presentCount + lateCount) / totalRecords) * 100
            : 0;
    }

   
    const courseStatsMap = new Map();
    
    if (user.role === 'teacher') {
        const allTeacherCourses = await Course.find({ _id: { $in: teacherCourseIds } }).select('courseName courseCode');
        for (const course of allTeacherCourses) {
            courseStatsMap.set(course._id.toString(), {
                courseId: course._id.toString(),
                courseName: course.courseName,
                courseCode: course.courseCode,
                totalSessions: 0,
                presentCount: 0,
                totalExpected: 0,
                attendanceRate: 0
            });
        }
    } else if (user.role === 'student' && studentId) {
         const studentCourses = await Course.find({ enrolledStudents: { $in: [studentId] } as any }).select('courseName courseCode');
         for (const course of studentCourses) {
            courseStatsMap.set(course._id.toString(), {
                courseId: course._id.toString(),
                courseName: course.courseName,
                courseCode: course.courseCode,
                totalSessions: 0,
                presentCount: 0,
                totalExpected: 0,
                attendanceRate: 0
            });
        }
    }

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
            totalExpected: 0,
            attendanceRate: 0
          });
        }
      }

      const stats = courseStatsMap.get(courseId);
      if (stats) {
        stats.totalSessions++;
        
        if (user.role === 'student') {
             stats.totalExpected++;
             const myRecord = records.find(r => r.sessionId.toString() === session._id.toString());
             if (myRecord && (myRecord.status === 'normal' || myRecord.status === 'late')) {
                 stats.presentCount++;
             }
        } else {
            const sessionRecords = records.filter(r => r.sessionId.toString() === session._id.toString());
            stats.totalExpected += sessionRecords.length;
            stats.presentCount += sessionRecords.filter(r => r.status === 'normal' || r.status === 'late').length;
        }
      }
    }

    for (const stats of courseStatsMap.values()) {
        stats.attendanceRate = stats.totalExpected > 0 
            ? (stats.presentCount / stats.totalExpected) * 100 
            : 0;
    }

    
    const trendMap = new Map();
    if (range === 'week') {
        const curr = new Date(startDate);
        while (curr <= endDate) {
            const dateStr = curr.toISOString().split('T')[0];
            trendMap.set(dateStr, { date: dateStr, present: 0, late: 0, absent: 0, leave: 0 });
            curr.setDate(curr.getDate() + 1);
        }
    }

    if (user.role === 'student') {
        records.forEach(record => {
             const session = sessions.find(s => s._id.toString() === record.sessionId.toString());
             if (session) {
                const dateStr = new Date(session.sessionDate).toISOString().split('T')[0];
                if (!trendMap.has(dateStr)) {
                     trendMap.set(dateStr, { date: dateStr, present: 0, late: 0, absent: 0, leave: 0 });
                }
                const entry = trendMap.get(dateStr);
                if (record.status === 'normal') entry.present++;
                else if (record.status === 'late') entry.late++;
                else if (record.status === 'absent') entry.absent++;
                else if (record.status === 'leave') entry.leave++;
             }
        });
    } else {
        records.forEach(record => {
            const session = sessions.find(s => s._id.toString() === record.sessionId.toString());
            if (session) {
                const dateStr = new Date(session.sessionDate).toISOString().split('T')[0];
                if (!trendMap.has(dateStr)) {
                     trendMap.set(dateStr, { date: dateStr, present: 0, late: 0, absent: 0, leave: 0 });
                }
                const entry = trendMap.get(dateStr);
                if (record.status === 'normal') entry.present++;
                else if (record.status === 'late') entry.late++;
                else if (record.status === 'absent') entry.absent++;
                else if (record.status === 'leave') entry.leave++;
            }
        });
    }
    const trend = Array.from(trendMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date));

 
    const recentSessions = await Promise.all(sessions.slice(0, 5).map(async (session) => {
        const course = courseStatsMap.get(session.courseId.toString()) || await Course.findById(session.courseId).select('courseName courseCode');
        
        if (user.role === 'student') {
            const myRecord = records.find(r => r.sessionId.toString() === session._id.toString());
            return {
                id: session._id,
                courseName: course?.courseName || 'Unknown Course',
                date: session.sessionDate,
                presentCount: (myRecord && (myRecord.status === 'normal' || myRecord.status === 'late')) ? 1 : 0,
                totalCount: 1, 
                status: myRecord ? myRecord.status : 'absent'
            };
        } else {
            const sessionRecords = records.filter(r => r.sessionId.toString() === session._id.toString());
            const sessionPresent = sessionRecords.filter(r => r.status === 'normal' || r.status === 'late').length;
            const sessionTotal = sessionRecords.length;
            
            return {
                id: session._id,
                courseName: course?.courseName || 'Unknown Course',
                date: session.sessionDate,
                presentCount: sessionPresent,
                totalCount: sessionTotal,
                status: session.status
            };
        }
    }));
    
    let atRiskStudents: any[] = [];
    if (user.role !== 'student') {
        const studentStats = new Map();
        records.forEach(record => {
            const studentId = record.studentId.toString();
            if (!studentStats.has(studentId)) {
                studentStats.set(studentId, { total: 0, present: 0, studentId });
            }
            const stats = studentStats.get(studentId);
            stats.total++;
            if (record.status === 'normal' || record.status === 'late') {
                stats.present++;
            }
        });

        for (const [studentId, stats] of studentStats.entries()) {
            const rate = (stats.present / stats.total) * 100;
            if (rate < 80) { 
                const student = await Student.findById(studentId).select('firstName lastName studentId');
                if (student) {
                    atRiskStudents.push({
                        id: student._id,
                        name: student.name,
                        studentId: student.studentId,
                        rate: rate,
                        totalClasses: stats.total,
                        missed: stats.total - stats.present
                    });
                }
            }
        }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalRecords: user.role === 'student' ? totalSessions : totalRecords,
        averageRate,
        todayStats: {
            sessions: sessions.filter(s => {
                const d = new Date(s.sessionDate);
                const today = new Date();
                return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            }).length,
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
      courseStats: Array.from(courseStatsMap.values()),
      trend,
      recentSessions,
      atRiskStudents: atRiskStudents.sort((a, b) => a.rate - b.rate).slice(0, 5) 
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return serverErrorResponse('Failed to fetch statistics');
  }
}
