import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allLeads = await db.select().from(leads).orderBy(leads.createdAt);
    return NextResponse.json({ leads: allLeads });
  } catch (error) {
    console.error("Failed to fetch leads from CRM:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Check if lead already exists
    const existing = await db.select().from(leads).where(eq(leads.id, data.id));
    if (existing.length > 0) {
      // Update existing
      await db.update(leads)
        .set({
          auditData: data.auditData || existing[0].auditData,
          pipelineStage: data.pipelineStage || existing[0].pipelineStage,
          updatedAt: new Date()
        })
        .where(eq(leads.id, data.id));
      return NextResponse.json({ success: true, action: "updated" });
    }

    // Insert new lead
    await db.insert(leads).values({
      id: data.id,
      name: data.name,
      category: data.category,
      city: data.city || "Unknown",
      phone: data.phone || null,
      website: data.website || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      rating: data.rating?.toString() || null,
      reviewsCount: data.reviewsCount?.toString() || null,
      auditData: data.auditData || null,
      pipelineStage: data.pipelineStage || "audited",
    });

    return NextResponse.json({ success: true, action: "inserted" });
  } catch (error) {
    console.error("Failed to insert/update lead in CRM:", error);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, pipelineStage } = await req.json();
    if (!id || !pipelineStage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.update(leads)
      .set({
        pipelineStage,
        updatedAt: new Date()
      })
      .where(eq(leads.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update pipeline stage:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
