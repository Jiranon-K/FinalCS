/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceRecord, AttendanceSession, Course, Student } from '@/models';
import { AttendanceSessionDocument } from '@/models/AttendanceSession';
import { v4 as uuidv4 } from 'uuid';

export async function closeSession(session: AttendanceSessionDocument) {
  const records = await AttendanceRecord.find({ sessionId: session._id });

  let presentCount = 0;
  let absentCount = 0;

  for (const record of records) {
    if (record.status === 'present') {
      presentCount++;
    } else if (record.status === 'absent') {
      absentCount++;
    }
  }

  session.status = 'closed';
  session.closedAt = new Date();
  
  session.stats = {
    expectedCount: session.stats?.expectedCount || records.length, 
    presentCount,
    absentCount,
  };

  await session.save();
}

export async function checkAndCloseExpiredSessions() {
  const now = new Date();
  const activeSessions = await AttendanceSession.find({ status: 'active' });

  for (const session of activeSessions) {
    try {
      const sessionDate = new Date(session.sessionDate);
      const [endHour, endMinute] = session.endTime.split(':').map(Number);
      
      const sessionEndTime = new Date(sessionDate);
      sessionEndTime.setHours(endHour, endMinute, 0, 0);

      if (now > sessionEndTime) {
        console.log(`Auto-closing session ${session.id} (ended at ${session.endTime})`);
        await closeSession(session);
      }
    } catch (error) {
      console.error(`Error auto-closing session ${session.id}:`, error);
    }
  }
}

export async function checkAndCreateScheduledSessions(courseIds?: string[]) {
  try {
    const now = new Date();
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const query: any = {
      'schedule.dayOfWeek': dayOfWeek,
    };

    if (courseIds && courseIds.length > 0) {
      query._id = { $in: courseIds };
    }

    const coursesToCheck = await Course.find(query);

    for (const course of coursesToCheck) {
      if (!course.schedule || course.schedule.length === 0) continue;

      const activeSlot = course.schedule.find((slot: any) => 
        slot.dayOfWeek === dayOfWeek && 
        currentTime >= slot.startTime && 
        currentTime <= slot.endTime
      );

      if (activeSlot) {
        const exists = await AttendanceSession.exists({
          courseId: course._id,
          sessionDate: todayDate,
          startTime: activeSlot.startTime
        });

        if (!exists) {
          try {
            console.log(`Auto-creating session for course ${course.courseCode} at ${activeSlot.startTime}`);
            const sessionId = uuidv4();
            
            const openerId = course.teacherId; 

            const newSession = await AttendanceSession.create({
              id: sessionId,
              courseId: course._id,
              courseName: course.courseName,
              courseCode: course.courseCode,
              sessionDate: todayDate,
              dayOfWeek: activeSlot.dayOfWeek,
              startTime: activeSlot.startTime,
              endTime: activeSlot.endTime,
              graceMinutes: activeSlot.graceMinutes || 30,
              status: 'active',
              openedAt: new Date(),
              openedBy: openerId,
              room: activeSlot.room || course.room,
              stats: {
                expectedCount: course.enrolledStudents.length,
                presentCount: 0,
                absentCount: course.enrolledStudents.length,
              },
            });

            if (course.enrolledStudents && course.enrolledStudents.length > 0) {
              const studentIds = course.enrolledStudents.map((e: any) => e.studentId);
              const students = await Student.find({ _id: { $in: studentIds } }).lean();
              const studentMap = new Map((students as any[]).map((s) => [s._id.toString(), { name: s.name, studentNumber: s.studentId }]));

              const attendanceRecords = course.enrolledStudents.map((enrollment: any) => {
                const studentInfo = studentMap.get(enrollment.studentId.toString());
                return {
                  id: uuidv4(),
                  sessionId: newSession._id,
                  courseId: course._id,
                  studentId: enrollment.studentId,
                  studentName: studentInfo?.name || 'Unknown',
                  studentNumber: studentInfo?.studentNumber || '',
                  status: 'absent',
                  checkInMethod: 'face_recognition',
                  detectionCount: 0,
                };
              });

              if (attendanceRecords.length > 0) {
                  await AttendanceRecord.insertMany(attendanceRecords);
              }
            }
            
            console.log(`Session created: ${sessionId}`);
          } catch (createError: any) {
            if (createError.code !== 11000) {
                console.error('Error auto-creating session:', createError);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in checkAndCreateScheduledSessions:', err);
  }
}
