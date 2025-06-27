// src/app/api/admin/subscriptions/route.ts

import { db } from "@/db";
import { subscriptionTable } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define schema for request validation
const subscriptionSchema = z.object({
  name: z.string().min(1),
  recordingCount: z.number().int().min(0),
  fileSizeLimitMB: z.number().int().min(1),
  durationDays: z.number().int().min(1),
  price: z.number().int().min(0).default(0),
});

// GET: Fetch all subscriptions
export const GET = withAdmin(async function () {
  const subscriptions = await db.select().from(subscriptionTable);
  return NextResponse.json({ subscriptions });
});

// POST: Create a new subscription

export const POST = withAdmin(async function (req: NextRequest) {
  try {
    const json = await req.json();
    const data = subscriptionSchema.parse(json);

    // 🔍 Check if a subscription with the same name (case-insensitive) exists
    const existing = await db
      .select()
      .from(subscriptionTable)
      .where(ilike(subscriptionTable.name, data.name));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Subscription "${data.name}" already exists` },
        { status: 409 }
      );
    }

    const [newSub] = await db
      .insert(subscriptionTable)
      .values(data)
      .returning();

    return NextResponse.json(newSub, { status: 201 });
  } catch (err) {
    console.error("POST /admin/subscriptions error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.errors },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
});
