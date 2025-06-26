import { db } from "@/db";
import { subscriptionTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAdmin(async function (req: NextRequest) {
  const { id, ...data } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 }
    );
  }

  await db
    .update(subscriptionTable)
    .set(data)
    .where(eq(subscriptionTable.id, id));

  return NextResponse.json({ success: true });
});
