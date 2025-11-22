/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AttendanceRecord, AttendanceSession, Course, Student } from "@/models";
import { requireAuth, serverErrorResponse } from "@/lib/auth-helpers";
import mongoose from "mongoose";

/**
 * Export attendance data as CSV
 * Query params:
 * - courseId: Filter by course (optional)
 * - sessionId: Filter by specific session (optional)
 * - startDate: Start date filter (optional)
 * - endDate: End date filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(request);

    if (user.role === "student") {
      return NextResponse.json(
        { success: false, error: "Students cannot export attendance data" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") || "";
    const sessionId = searchParams.get("sessionId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    interface SessionQuery {
      courseId?: any;
      _id?: any;
      sessionDate?: any;
    }
    const sessionQuery: SessionQuery = {};

    if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        sessionQuery.courseId = new mongoose.Types.ObjectId(courseId);
      } else {
        const course = await Course.findOne({ id: courseId }).select("_id");
        if (course) {
          sessionQuery.courseId = course._id;
        }
      }
    }

    if (sessionId) {
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        sessionQuery._id = new mongoose.Types.ObjectId(sessionId);
      }
    }

    if (startDate || endDate) {
      sessionQuery.sessionDate = {};
      if (startDate) {
        sessionQuery.sessionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        sessionQuery.sessionDate.$lte = new Date(endDate);
      }
    }

    const sessions = await AttendanceSession.find(sessionQuery)
      .sort({ sessionDate: -1 })
      .lean();

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No sessions found" },
        { status: 404 },
      );
    }

    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
    }).lean();

    const courseIds = [...new Set(sessions.map((s) => s.courseId.toString()))];
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("courseName courseCode")
      .lean();
    const courseMap = new Map(
      courses.map((c: any) => [
        c._id.toString(),
        { name: c.courseName, code: c.courseCode },
      ]),
    );

    const studentIds = [
      ...new Set(records.map((r: any) => r.studentId.toString())),
    ];
    const students = await Student.find({ _id: { $in: studentIds } })
      .select("name studentId")
      .lean();
    const studentMap = new Map(
      students.map((s: any) => [
        s._id.toString(),
        { name: s.name, studentNumber: s.studentId },
      ]),
    );

    const headers = [
      "Course Code",
      "Course Name",
      "Session Date",
      "Start Time",
      "End Time",
      "Student ID",
      "Student Name",
      "Status",
      "Check-in Time",
    ];

    const rows: string[][] = [];

    for (const session of sessions) {
      const courseInfo = courseMap.get(session.courseId.toString()) || {
        name: "Unknown",
        code: "N/A",
      };
      const sessionRecords = records.filter(
        (r: any) => r.sessionId.toString() === session._id.toString(),
      );

      for (const record of sessionRecords) {
        const studentInfo = studentMap.get(
          (record as any).studentId.toString(),
        ) || {
          name: "Unknown",
          studentNumber: "N/A",
        };

        rows.push([
          courseInfo.code,
          courseInfo.name,
          new Date(session.sessionDate).toLocaleDateString("th-TH"),
          session.startTime,
          session.endTime,
          studentInfo.studentNumber,
          studentInfo.name,
          (record as any).status === "present" ? "มา" : "ขาด",
          (record as any).checkInTime
            ? new Date((record as any).checkInTime).toLocaleTimeString("th-TH")
            : "-",
        ]);
      }
    }

    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 },
      );
    }
    console.error("Error exporting attendance:", error);
    return serverErrorResponse("Failed to export attendance data");
  }
}
