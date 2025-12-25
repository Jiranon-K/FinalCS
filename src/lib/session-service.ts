import { AttendanceRecord, AttendanceSession } from '@/models';
import { AttendanceSessionDocument } from '@/models/AttendanceSession';

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
