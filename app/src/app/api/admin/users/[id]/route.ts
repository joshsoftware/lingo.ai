import { db } from "@/db";
import { subscriptionTable, transcriptions, userTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ROLES } from "@/constants/roles";

// GET /api/admin/users/:id
export const GET = withAdmin(async function (
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Fetch user with subscription info
  const [user] = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      name: userTable.name,
      contactNumber: userTable.contactNumber,
      role: userTable.role,
      subscription: {
        name: subscriptionTable.name,
        recordingCount: subscriptionTable.recordingCount,
        fileSizeLimitMB: subscriptionTable.fileSizeLimitMB,
        durationDays: subscriptionTable.durationDays,
      },
    })
    .from(userTable)
    .leftJoin(
      subscriptionTable,
      eq(userTable.subscriptionId, subscriptionTable.id)
    )
    .where(eq(userTable.id, id));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Count user’s personal (non-default) transcriptions
  const [{ count: usedCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transcriptions)
    .where(eq(transcriptions.userID, id));

  // Calculate remaining recordings
  const limit = user.subscription?.recordingCount ?? 0;
  const remaining = Math.max(limit - usedCount, 0);

  return NextResponse.json({
    ...user,
    recordingsUsed: usedCount,
    recordingsRemaining: remaining,
  });
});
// PATCH /api/admin/users/:id
export const PATCH = withAdmin(async function (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const data = await req.json();

  // Optional: Validate `role` if it's present in the payload
  if (data.role && ![ROLES.ADMIN, ROLES.USER].includes(data.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const [updated] = await db
    .update(userTable)
    .set(data)
    .where(eq(userTable.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { password_hash, ...user } = updated; // removed password hash from response
  return NextResponse.json(user);
});
