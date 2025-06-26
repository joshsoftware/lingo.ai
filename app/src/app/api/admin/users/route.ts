import { validateRequest } from "@/auth";
import { db } from "@/db";
import { userTable, subscriptionTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { ilike, eq, sql, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdmin(async function (req: NextRequest) {
  const { user } = await validateRequest();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search")?.trim().toLowerCase() || "";

  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(
        ilike(userTable.username, `%${search}%`),
        ilike(userTable.name, `%${search}%`),
        ilike(userTable.contactNumber, `%${search}%`)
      )
    : undefined;

  const users = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      name: userTable.name,
      contactNumber: userTable.contactNumber,
      role: userTable.role,
      subscriptionName: subscriptionTable.name,
    })
    .from(userTable)
    .leftJoin(
      subscriptionTable,
      eq(userTable.subscriptionId, subscriptionTable.id)
    )
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userTable)
    .where(whereClause);

  return NextResponse.json({ users, total: count, page, limit });
});
