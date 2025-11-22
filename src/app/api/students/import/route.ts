/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Student } from "@/models";
import { verifyToken } from "@/lib/jwt";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_HEADER_MAPPING: Record<string, string> = {
  รหัสนักศึกษา: "studentId",
  "ชื่อ-นามสกุล ไทย": "name",
  "ชื่อ-นามสกุล": "name",
  อีเมล: "email",
  รหัสสาขาวิชา: "department",
  สาขาวิชา: "department",
  ชั้นปี: "grade",
  ห้อง: "class",
  "ห้อง/กลุ่มเรียน": "class",
  เบอร์โทรศัพท์: "phone",
  เบอร์โทร: "phone",
};

function detectHeaderRow(sheetData: any[][]): number {
  for (let i = 0; i < Math.min(sheetData.length, 20); i++) {
    const row = sheetData[i];
    if (row && Array.isArray(row)) {
      const hasStudentId = row.some(
        (cell) =>
          typeof cell === "string" &&
          (cell.includes("รหัสนักศึกษา") ||
            cell.toLowerCase().includes("student id")),
      );
      if (hasStudentId) return i;
    }
  }
  return 12;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }
    const payload = verifyToken(token);
    if (!payload || (payload.role !== "admin" && payload.role !== "teacher")) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const columnMappingStr = formData.get("columnMapping") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }

    let customMapping: Record<string, string> | null = null;
    if (columnMappingStr) {
      try {
        customMapping = JSON.parse(columnMappingStr);
      } catch {
        // Fallback to auto-detect if JSON is invalid
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const sheetData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as any[][];
    const headerRowIndex = detectHeaderRow(sheetData);

    const rawHeaderRow = sheetData[headerRowIndex] || [];
    const headers: string[] = rawHeaderRow.map((h: any) =>
      String(h ?? "").trim(),
    );

    const columnIndexMapping: Record<number, string> = {};

    if (customMapping) {
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const headerName = headers[colIdx];
        if (!headerName) continue;

        if (customMapping[headerName] && customMapping[headerName] !== "") {
          columnIndexMapping[colIdx] = customMapping[headerName];
          continue;
        }

        const matchKey = Object.keys(customMapping).find(
          (k) => k.toLowerCase().trim() === headerName.toLowerCase(),
        );
        if (
          matchKey &&
          customMapping[matchKey] &&
          customMapping[matchKey] !== ""
        ) {
          columnIndexMapping[colIdx] = customMapping[matchKey];
        }
      }
    } else {
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const headerName = headers[colIdx];
        if (!headerName) continue;

        if (DEFAULT_HEADER_MAPPING[headerName]) {
          columnIndexMapping[colIdx] = DEFAULT_HEADER_MAPPING[headerName];
        } else {
          const matchKey = Object.keys(DEFAULT_HEADER_MAPPING).find(
            (k) => k.toLowerCase() === headerName.toLowerCase(),
          );
          if (matchKey) {
            columnIndexMapping[colIdx] = DEFAULT_HEADER_MAPPING[matchKey];
          }
        }
      }
    }

    const results = {
      success: 0,
      failed: 0,
      updated: 0,
      created: 0,
      errors: [] as { row: number; studentId: string; message: string }[],
      successList: [] as { name: string; studentId: string; status: string }[],
    };

    const dataRows = sheetData.slice(headerRowIndex + 1);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = headerRowIndex + 2 + i;

      if (!row || !Array.isArray(row)) continue;

      const processed: Record<string, string | undefined> = {};
      for (const [colIdxStr, fieldKey] of Object.entries(columnIndexMapping)) {
        const colIdx = parseInt(colIdxStr);
        const cellValue = row[colIdx];
        if (
          cellValue !== undefined &&
          cellValue !== null &&
          String(cellValue).trim() !== ""
        ) {
          processed[fieldKey] = String(cellValue).trim();
        }
      }

      const { studentId, name, email } = processed;

      if (!studentId || !name) {
        if (studentId || name || Object.values(processed).some((v) => v)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentId || "-",
            message: !studentId ? "ไม่มีรหัสนักศึกษา" : "ไม่มีชื่อ-นามสกุล",
          });
        }
        continue;
      }

      try {
        const existingStudent = await Student.findOne({ studentId });

        if (existingStudent) {
          existingStudent.name = name;
          if (email) existingStudent.email = email;
          if (processed.department)
            existingStudent.department = processed.department;
          if (processed.grade) existingStudent.grade = processed.grade;
          if (processed.class) existingStudent.class = processed.class;
          if (processed.phone) existingStudent.phone = processed.phone;

          if (
            !existingStudent.userId &&
            (!existingStudent.accountStatus ||
              existingStudent.accountStatus !== "active")
          ) {
            existingStudent.accountStatus = "waiting";
          }

          await existingStudent.save();
          results.updated++;
          results.successList.push({
            name,
            studentId,
            status: existingStudent.accountStatus || "unknown",
          });
        } else {
          await Student.create({
            id: uuidv4(),
            studentId,
            name,
            email: email || undefined,
            department: processed.department,
            grade: processed.grade,
            class: processed.class,
            phone: processed.phone,
            imageUrl: "/profile-deafault/student.png",
            accountStatus: "waiting",
          });
          results.created++;
          results.successList.push({ name, studentId, status: "waiting" });
        }
        results.success++;
      } catch (err) {
        console.error(`Error importing student ${studentId}:`, err);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          studentId,
          message: (err as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete. Created: ${results.created}, Updated: ${results.updated}, Failed: ${results.failed}`,
      details: results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error: " + (error as Error).message,
      },
      { status: 500 },
    );
  }
}
