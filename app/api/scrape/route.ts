import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead, ScrapeInput } from "@/lib/types";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = process.env.APIFY_ACTOR ?? "compass~crawler-google-places";

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
          maxCrawledPlacesPerSearch: input.count,
          language: "en",
        }),
      },
    );
    if (!runRes.ok) throw new Error(`Apify ${runRes.status}`);
    const items = (await runRes.json()) as Array<Record<string, unknown>>;

    const leads: Lead[] = items.slice(0, input.count).map((it, i) => ({
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

    const enriched = await enrichWithEmails(leads);
    return NextResponse.json({ source: "apify", leads: enriched });
  } catch (e) {
    const { leads } = await loadSeed();
    const sliced = leads.slice(0, input.count);
    const enriched = await enrichWithEmails(sliced);
    return NextResponse.json({ source: "seed-fallback", error: (e as Error).message, leads: enriched });
  }
}
