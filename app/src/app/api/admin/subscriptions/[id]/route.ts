import { db } from "@/db";
import { subscriptionTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/subscriptions/:id
export const GET = withAdmin(async function (
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const subscription = await db
    .select()
    .from(subscriptionTable)
    .where(eq(subscriptionTable.id, id))
    .then((res) => res[0]);

  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(subscription);
});

// PATCH /api/admin/subscriptions/:id
export const PATCH = withAdmin(async function (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await req.json();
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(subscriptionTable)
    .set(data)
    .where(eq(subscriptionTable.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
});
