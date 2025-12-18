import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Student } from '@/models';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'teacher')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { students } = await request.json();
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      successList: [] as { name: string; studentId: string }[]
    };

    interface StudentImportData {
      studentId: string;
      name: string;
      email: string;
      department?: string;
      grade?: string;
      class?: string;
      phone?: string;
      [key: string]: string | undefined;
    }

    const headerMapping: { [key: string]: string } = {
      'รหัสนักศึกษา': 'studentId',
      'ชื่อ-นามสกุล': 'name',
      'ชื่อ': 'name',
      'อีเมล': 'email',
      'รหัสสาขาวิชา': 'department',
      'สาขาวิชา': 'department',
      'ชั้นปี': 'grade',
      'ห้อง': 'class',
      'ห้อง/กลุ่มเรียน': 'class',
      'เบอร์โทรศัพท์': 'phone',
      'เบอร์โทร': 'phone'
    };

    const normalizeKey = (key: string): string => {
      if (headerMapping[key]) return headerMapping[key];
      
      const lowerKey = key.toLowerCase();
      const mappedKey = Object.keys(headerMapping).find(k => k.toLowerCase() === lowerKey);
      if (mappedKey) return headerMapping[mappedKey];
      
      if (lowerKey === 'studentid' || lowerKey === 'id') return 'studentId';
      
      return lowerKey;
    };

    for (const rawData of students) {
      const studentData: Partial<StudentImportData> = {};
      Object.keys(rawData).forEach(key => {
        studentData[normalizeKey(key)] = rawData[key];
      });

      const { studentId, name, email, department, grade, class: studentClass, phone } = studentData;

      if (!studentId || !name || !email) {
        results.failed++;
        results.errors.push(`Missing ID, Name, or Email for student: ${name || studentId || 'Unknown'}`);
        continue;
      }
      
      const userIdForLogin = email ? email : studentId;
      try {
      let targetUserId = null;
      
      const existingUser = await User.findOne({ 
          $or: [
              { username: userIdForLogin },
              { studentId: studentId }
          ]
      });
      
      if (existingUser) {
        if (existingUser.profileId) {
            results.failed++;
            results.errors.push(`User and Profile already exist: ${studentId} / ${userIdForLogin}`);
            continue;
        }
        // User exists but has no profile - attach to this user
        targetUserId = existingUser._id;
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(studentId.toString(), 10);
        const newUser = await User.create({
          username: userIdForLogin,
          password: passwordHash,
          fullName: name,
          role: 'student',
          studentId: studentId,
        });
        targetUserId = newUser._id;
      }

      const personId = uuidv4();
      const newStudent = await Student.create({
        id: personId,
        userId: targetUserId,
        name: name,
        studentId: studentId,
        email: email,
        phone: phone,
        department: department,
        grade: grade,
        class: studentClass,
        imageUrl: `${process.env.R2_PUBLIC_URL}/default_profile/student.png`,
        imageKey: 'default_profile/student.png',
        faceDescriptor: [],
      });

      await User.findByIdAndUpdate(targetUserId, {
        profileId: newStudent._id
      });

        results.success++;
        results.successList.push({ name, studentId });
      } catch (err) {
        console.error(`Error importing student ${studentId}:`, err);
        results.failed++;
        results.errors.push(`Failed to import ${studentId}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import processed. Success: ${results.success}, Failed: ${results.failed}`,
      details: results
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
