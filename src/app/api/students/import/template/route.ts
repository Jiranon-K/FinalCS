import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const headers = [
      "รหัสนักศึกษา",
      "ชื่อ-นามสกุล ไทย",
      "อีเมล",
      "สาขาวิชา",
      "ชั้นปี",
      "ห้อง",
      "เบอร์โทรศัพท์",
    ];

    const sampleData = [
      [
        "6501001",
        "สมชาย ใจดี",
        "somchai@email.com",
        "วิทยาการคอมพิวเตอร์",
        "1",
        "1",
        "081-234-5678",
      ],
      [
        "6501002",
        "สมหญิง รักเรียน",
        "somying@email.com",
        "เทคโนโลยีสารสนเทศ",
        "2",
        "1",
        "089-876-5432",
      ],
    ];

    const wb = XLSX.utils.book_new();

    const blankRows: string[][] = Array.from({ length: 12 }, () => []);
    const sheetData = [...blankRows, headers, ...sampleData];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!cols"] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 28 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="student_import_template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate template" },
      { status: 500 },
    );
  }
}
