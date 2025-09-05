import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmLeadsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Get the default CRM leads
    const defaultLeads = await db
      .select()
      .from(crmLeadsTable)
      .where(eq(crmLeadsTable.isDefault, true));
    
    // Return the results
    return NextResponse.json({
      success: true,
      data: defaultLeads
    });
  } catch (error) {
    console.error("Error fetching default CRM leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch default CRM leads" },
      { status: 500 }
    );
  }
}
