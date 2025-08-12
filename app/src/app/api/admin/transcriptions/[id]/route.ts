import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdmin(async function (
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [transcription] = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.id, id));

  if (!transcription) {
    return NextResponse.json(
      { error: "Transcription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(transcription);
});

export const DELETE = withAdmin(async function (
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [deleted] = await db
    .delete(transcriptions)
    .where(eq(transcriptions.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { error: "Transcription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, id });
});
