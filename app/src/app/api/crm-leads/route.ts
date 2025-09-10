import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmLeadsTable } from "@/db/schema";

export async function GET() {
  try {

    

    const allLeads = await db
      .select()
      .from(crmLeadsTable);
    
    

    return NextResponse.json({
      success: true,
      data: allLeads,
      count: allLeads.length
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}