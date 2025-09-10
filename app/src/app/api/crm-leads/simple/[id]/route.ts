import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmLeadsTable } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    // Try to match by any ID field
    const lead = await db
      .select()
      .from(crmLeadsTable)
      .where(
        or(
          eq(crmLeadsTable.id, id),
          eq(crmLeadsTable.leadId, id)
        )
      )
      .limit(1);
    
    // If no leads are found, check if the table has any data at all
    if (!lead || lead.length === 0) {
      const count = await db
        .select({ count: db.fn.count() })
        .from(crmLeadsTable);
      
      const totalCount = Number(count[0]?.count || 0);
      
      return NextResponse.json({ 
        error: "CRM lead not found", 
        id,
        tableHasData: totalCount > 0,
        totalLeads: totalCount 
      }, { status: 404 });
    }
    
    // Return the found lead
    return NextResponse.json(lead[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}