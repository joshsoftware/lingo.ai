import { db } from "@/db";
import { transcriptions, userTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdmin(async function (
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;
  const userId = params.userId;
  console.log("userId is ", userId);
  // Validate user exists
  const [user] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch paginated transcriptions
  const transcriptionsList = await db
    .select({
      id: transcriptions.id,
      documentName: transcriptions.documentName,
      translation: transcriptions.translation,
      summary: transcriptions.summary,
      createdAt: transcriptions.createdAt,
      audioDuration: transcriptions.audioDuration,
      isDefault: transcriptions.isDefault,
    })
    .from(transcriptions)
    .where(eq(transcriptions.userID, userId))
    .limit(limit)
    .offset(offset);

  // Count total records
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transcriptions)
    .where(eq(transcriptions.userID, userId));

  return NextResponse.json({
    data: transcriptionsList,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});
