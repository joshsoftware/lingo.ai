import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    const microserviceUrl = process.env.NEXT_PUBLIC_MICROSERVICE_URL || "http://localhost:8000";
    const url = `${microserviceUrl}/admin/error-logs/audio/${encodeURIComponent(filename)}`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Audio not found" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "audio/wav";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error: any) {
    console.error("Error fetching error log audio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
