import { db } from "@/db";
import { subscriptionTable, userTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ROLES } from "@/constants/roles";

// GET /api/admin/users/:id
export const GET = withAdmin(async function (
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const user = await db
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
    .where(eq(userTable.id, id))
    .then((res) => res[0]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
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
