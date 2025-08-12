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

  try {
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
  } catch (error: any) {
    // Handle unique constraint error (PostgreSQL code 23505)
    if (error.code === "23505") {
      if (error.constraint === "subscriptions_name_unique") {
        return NextResponse.json(
          { error: "Subscription name already exists" },
          { status: 409 }
        );
      }
    }

    // Generic DB error fallback
    console.error("DB Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
