import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all leads from PostgreSQL, sorted by newest first
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ 
      count: leads.length, 
      leads 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads from database" }, { status: 500 });
  }
}
