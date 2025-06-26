import { ROLES } from "@/constants/roles";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAdmin(async function (req: NextRequest) {
  const { userId, role } = await req.json();

  const roles = [ROLES.ADMIN, ROLES.USER] as never as [string];
  if (
    typeof userId !== "string" ||
    typeof role !== "string" ||
    !roles.includes(role)
  ) {
    return NextResponse.json(
      { error: "Invalid or missing parameters" },
      { status: 400 }
    );
  }

  const [updatedUser] = await db
    .update(userTable)
    .set({ role })
    .where(eq(userTable.id, userId))
    .returning({
      id: userTable.id,
      username: userTable.username,
      name: userTable.name,
      contactNumber: userTable.contactNumber,
      role: userTable.role,
    });

  if (!updatedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updatedUser });
});
