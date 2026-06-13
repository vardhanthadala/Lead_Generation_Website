import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead, ScrapeInput } from "@/lib/types";
import { prisma } from "@/lib/prisma";

// Removed top-level const APIFY_TOKEN
// Removed top-level const APIFY_ACTOR

async function loadSeed(): Promise<{ leads: Lead[] }> {
  const p = path.join(process.cwd(), "data", "leads-seed.json");
  const raw = await fs.readFile(p, "utf-8");
  const json = JSON.parse(raw);
  return { leads: json.leads as Lead[] };
}

// --- APIFY PREMIUM EMAIL SCRAPER ---
async function enrichWithEmails(leads: Lead[]) {
  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  if (!APIFY_TOKEN) return leads; // If no token, just return original

  const validWebsites = leads.filter(l => l.website).map(l => ({ url: l.website }));
  if (validWebsites.length === 0) return leads;

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/vdrmota~contact-info-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startUrls: validWebsites,
          maxRequestsPerStartUrl: 3, // Limit to 3 pages per site to keep it fast
          maxDepth: 1, // Only go one click deep (e.g. from Home to Contact Us)
        }),
      }
    );
    
    if (!runRes.ok) return leads; // If scraper fails, gracefully fallback
    
    const items = (await runRes.json()) as Array<Record<string, unknown>>;
    
    // Map found emails back to our leads
    for (const lead of leads) {
      if (!lead.website) continue;
      
      // Try to find the scraped results for this specific website
      // Since URLs get normalized (e.g. with/without trailing slashes or www), we check for inclusion
      const matchingItem = items.find(it => {
        const itemUrl = String(it.originalStartUrl ?? it.url ?? "");
        try {
          const lHost = new URL(lead.website!).hostname.replace('www.', '');
          const itHost = new URL(itemUrl).hostname.replace('www.', '');
          return lHost === itHost;
        } catch {
          return itemUrl.includes(lead.website!) || lead.website!.includes(itemUrl);
        }
      });
      
      if (matchingItem && Array.isArray(matchingItem.emails) && matchingItem.emails.length > 0) {
        // Filter out obvious fake template emails
        const validEmails = (matchingItem.emails as string[]).filter(e => 
          !e.toLowerCase().endsWith('.png') && 
          !e.toLowerCase().endsWith('.jpg') && 
          !e.toLowerCase().includes('sentry') && 
          !e.toLowerCase().includes('you@company.com') &&
          !e.toLowerCase().includes('name@company.com') &&
          !e.toLowerCase().includes('email@example.com') &&
          !e.toLowerCase().includes('your@email.com') &&
          !e.toLowerCase().includes('domain.com') &&
          e.length < 50
        );
        
        if (validEmails.length > 0) {
          // Get the shortest email 
          const sorted = validEmails.sort((a, b) => a.length - b.length);
          lead.email = sorted[0].toLowerCase();
        }
      }
    }
  } catch (e) {
    // Ignore and fallback to original leads if the Apify run fails or times out
  }
  return leads;
}
// ---------------------------------

export async function POST(req: Request) {
  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  const APIFY_ACTOR = process.env.APIFY_ACTOR ?? "compass~crawler-google-places";
  const input = (await req.json()) as ScrapeInput;

  // No token = serve cached seed (matches user's input where possible)
  if (!APIFY_TOKEN) {
    const { leads } = await loadSeed();
    const sliced = leads.slice(0, Math.max(1, Math.min(input.count, leads.length)));
    const enriched = await enrichWithEmails(sliced);
    return NextResponse.json({ source: "seed", leads: enriched });
  }

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [`${input.niche} in ${input.city}`],
          maxCrawledPlacesPerSearch: Math.max(input.count * 2, 40), // Fetch a larger pool for deduplication
          language: "en",
        }),
      },
    );
    if (!runRes.ok) throw new Error(`Apify ${runRes.status}`);
    const items = (await runRes.json()) as Array<Record<string, unknown>>;

    const scrapedLeads: Lead[] = items.map((it, i) => ({
      id: `live-${String(i + 1).padStart(2, "0")}`,
      name: String(it.title ?? it.name ?? "Unknown"),
      category: String(it.categoryName ?? input.niche),
      address: String(it.address ?? ""),
      city: input.city,
      phone: it.phone ? String(it.phone) : undefined,
      whatsapp: it.phone ? String(it.phone) : undefined,
      email: undefined,
      website: it.website ? String(it.website) : undefined,
      rating: typeof it.totalScore === "number" ? (it.totalScore as number) : undefined,
      reviewsCount: typeof it.reviewsCount === "number" ? (it.reviewsCount as number) : undefined,
      lat: typeof (it.location as { lat?: number })?.lat === "number" ? (it.location as { lat: number }).lat : 19.06,
      lng: typeof (it.location as { lng?: number })?.lng === "number" ? (it.location as { lng: number }).lng : 72.83,
      photosCount: typeof it.imagesCount === "number" ? (it.imagesCount as number) : undefined,
    }));

    // Deduplication logic against DB via Prisma
    const existingLeads = await prisma.lead.findMany({
      where: { city: input.city },
      select: { name: true }
    });
    const existingNames = new Set(existingLeads.map((l) => l.name.toLowerCase()));

    // Filter out duplicates
    const newLeads = scrapedLeads.filter(l => !existingNames.has(l.name.toLowerCase()));

    // Shuffle the remaining fresh leads
    const shuffled = newLeads.sort(() => Math.random() - 0.5);

    // Slice to the requested count
    const leadsToProcess = shuffled.slice(0, input.count);

    // Enrich with emails before saving to DB
    const enriched = await enrichWithEmails(leadsToProcess);

    // Save the new leads to PostgreSQL permanently
    if (enriched.length > 0) {
      const docsToInsert = enriched.map(l => ({
        name: l.name,
        category: l.category,
        city: l.city,
        address: l.address,
        phone: l.phone,
        whatsapp: l.whatsapp,
        email: l.email,
        website: l.website,
        rating: l.rating,
        reviewsCount: l.reviewsCount,
        lat: l.lat,
        lng: l.lng,
        photosCount: l.photosCount,
        status: "scraped"
      }));
      
      // Use createManyAndReturn if available, otherwise just createMany
      // We will do individual creates or createMany and generate frontend IDs manually if needed.
      // Wait, let's just generate a UUID up front for each lead
      const crypto = require("crypto");
      for (const doc of docsToInsert) {
        const id = crypto.randomUUID();
        (doc as any).id = id;
      }
      
      await prisma.lead.createMany({ data: docsToInsert });
      
      // Map the real DB _ids back to the frontend payload
      for (let i = 0; i < enriched.length; i++) {
        enriched[i].id = (docsToInsert[i] as any).id;
      }
    }

    return NextResponse.json({ source: "apify", leads: enriched });
  } catch (e) {
    console.error("Scrape Route Error:", e);
    const { leads } = await loadSeed();
    const sliced = leads.slice(0, input.count);
    const enriched = await enrichWithEmails(sliced);
    return NextResponse.json({ source: "seed-fallback", error: (e as Error).message, leads: enriched });
  }
}
