import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Student } from "@/models";

export async function GET() {
  try {
    await connectDB();

    const students = await Student.find(
      {
        faceDescriptor: { $exists: true, $ne: null, $not: { $size: 0 } },
        imageUrl: { $exists: true, $nin: [null, ""] },
      },
      "id name studentId imageUrl faceDescriptor",
    ).lean();

    return NextResponse.json({
      success: true,
      data: students.map((s) => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId,
        imageUrl: s.imageUrl,
        faceDescriptor: s.faceDescriptor,
      })),
      total: students.length,
    });
  } catch (error) {
    console.error("Error fetching benchmark faces:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch benchmark faces" },
      { status: 500 },
    );
  }
}
