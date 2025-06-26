import { db } from "@/db";
import { subscriptionTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { NextResponse } from "next/server";

export const GET = withAdmin(async function () {
  const subscriptions = await db.select().from(subscriptionTable);
  return NextResponse.json({ subscriptions });
});
