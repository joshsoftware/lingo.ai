import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmLeadsTable } from "@/db/schema";

export async function GET() {
  try {
    console.log("Fetching all CRM leads");
    
    // Query all CRM leads
    const allLeads = await db
      .select()
      .from(crmLeadsTable);
    
    console.log(`Found ${allLeads.length} CRM leads`);
    
    if (allLeads.length > 0) {
      console.log("Sample lead data:", {
        id: allLeads[0].id,
        leadId: allLeads[0].leadId,
        fileName: allLeads[0].fileName
      });
    }
    
    // Return the leads, even if empty
    return NextResponse.json({
      success: true,
      data: allLeads,
      count: allLeads.length
    });
  } catch (error) {
    console.error("Error retrieving CRM leads:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}