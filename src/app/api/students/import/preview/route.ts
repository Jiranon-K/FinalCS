/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import * as XLSX from "xlsx";

const HEADER_MAPPING: Record<string, string> = {
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
  "student id": "studentId",
  name: "name",
  email: "email",
  department: "department",
  grade: "grade",
  class: "class",
  phone: "phone",
};

const SYSTEM_FIELDS = [
  { key: "studentId", label: "รหัสนักศึกษา", required: true },
  { key: "name", label: "ชื่อ-นามสกุล", required: true },
  { key: "email", label: "อีเมล", required: false },
  { key: "department", label: "สาขาวิชา", required: false },
  { key: "grade", label: "ชั้นปี", required: false },
  { key: "class", label: "ห้อง", required: false },
  { key: "phone", label: "เบอร์โทรศัพท์", required: false },
];

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

function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const trimmed = header.trim();
    if (HEADER_MAPPING[trimmed]) {
      mapping[header] = HEADER_MAPPING[trimmed];
      continue;
    }
    const lowerTrimmed = trimmed.toLowerCase();
    const matchKey = Object.keys(HEADER_MAPPING).find(
      (k) => k.toLowerCase() === lowerTrimmed,
    );
    if (matchKey) {
      mapping[header] = HEADER_MAPPING[matchKey];
    }
  }
  return mapping;
}

export async function POST(request: NextRequest) {
  try {
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

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const sheetData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as any[][];
    const headerRowIndex = detectHeaderRow(sheetData);

    const headerRow = sheetData[headerRowIndex];
    if (!headerRow || !Array.isArray(headerRow)) {
      return NextResponse.json(
        { success: false, error: "Could not detect header row" },
        { status: 400 },
      );
    }

    const headers = headerRow
      .map((h: any) => String(h ?? "").trim())
      .filter(Boolean);
    const detectedMapping = autoDetectMapping(headers);

    const previewRows: string[][] = [];
    for (
      let i = headerRowIndex + 1;
      i < Math.min(sheetData.length, headerRowIndex + 11);
      i++
    ) {
      const row = sheetData[i];
      if (row && Array.isArray(row)) {
        const mapped = headers.map((_, colIdx) =>
          String(row[colIdx] ?? "").trim(),
        );
        if (mapped.some((v) => v !== "")) {
          previewRows.push(mapped);
        }
      }
    }

    const totalDataRows = sheetData
      .slice(headerRowIndex + 1)
      .filter(
        (row) =>
          row &&
          Array.isArray(row) &&
          row.some(
            (cell) =>
              cell !== undefined && cell !== null && String(cell).trim() !== "",
          ),
      ).length;

    return NextResponse.json({
      success: true,
      headers,
      previewRows,
      detectedMapping,
      systemFields: SYSTEM_FIELDS,
      headerRowIndex,
      totalDataRows,
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to preview file: " + (error as Error).message,
      },
      { status: 500 },
    );
  }
}
