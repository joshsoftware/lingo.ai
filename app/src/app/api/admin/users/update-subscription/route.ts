import { db } from "@/db";
import { userTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAdmin(async function (req: NextRequest) {
  const { userId, subscriptionId } = await req.json();

  if (!userId || !subscriptionId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const [updatedUser] = await db
    .update(userTable)
    .set({ subscriptionId })
    .where(eq(userTable.id, userId))
    .returning();

  if (!updatedUser) {
    return NextResponse.json(
      { error: "User not found or not updated" },
      { status: 404 }
    );
  }

  return NextResponse.json({ user: updatedUser });
});
