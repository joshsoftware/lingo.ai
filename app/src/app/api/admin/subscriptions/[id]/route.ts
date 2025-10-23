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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 }
    );
  }

  const data = await req.json();

  const { id: _ignore, createdAt, updatedAt, ...safeData } = data;

  try {
    const [updated] = await db
      .update(subscriptionTable)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionTable.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (
      error.code === "23505" &&
      error.constraint === "subscriptions_name_unique"
    ) {
      return NextResponse.json(
        { error: "Subscription name already exists" },
        { status: 409 }
      );
    }

    // Generic DB error fallback
    console.error("DB Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
