import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Ensure protocol
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;

    // 1. Fetch raw HTML
    const htmlRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000), // 8 sec timeout
    });

    if (!htmlRes.ok) throw new Error(`Failed to fetch website: ${htmlRes.statusText}`);
    
    const html = await htmlRes.text();

    // 2. Parse with Cheerio to strip junk
    const $ = cheerio.load(html);
    $("script, style, noscript, iframe, img, svg, video").remove();
    let textContent = $("body").text().replace(/\s+/g, " ").trim();
    
    // Also grab explicit mailto/tel links just in case
    const links: string[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && (href.startsWith("mailto:") || href.startsWith("tel:"))) {
        links.push(href);
      }
    });

    textContent = textContent.slice(0, 15000); // Limit tokens for Groq

    const prompt = `
Extract business information from this website text.

Website Text:
${textContent}

Explicit contact links found:
${links.join(", ")}

Extract the following details as accurately as possible. If a piece of information is absolutely missing, return an empty string or 0.

You must return ONLY a raw JSON object with this exact structure:
{
  "name": "The name of the business",
  "email": "The primary email address if found",
  "phone": "The primary phone number if found",
  "address": "The physical address or city/location",
  "category": "The niche, industry, or category of this business (e.g., Plumber, Dental Clinic)"
}
    `;

    // 3. Ask Groq (Llama 3 8B) to extract structured details using native groq-sdk
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const object = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // 4. Format into a Lead object
    const leadId = "url_" + Date.now().toString();
    const newLead = {
      id: leadId,
      name: object.name || "Unknown Business",
      website: targetUrl,
      phone: object.phone || null,
      whatsapp: null,
      email: object.email || null,
      address: object.address || "Unknown Location",
      city: object.address || "Unknown",
      lat: 0,
      lng: 0,
      rating: 4.5, // Default mockup rating for manual leads
      reviewsCount: 1, // Default mockup for manual leads
      category: object.category || "General Business",
      placeId: leadId,
      url: targetUrl,
    };

    return NextResponse.json({ lead: newLead });

  } catch (error: any) {
    console.error("Manual URL Scrape Error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse website" }, { status: 500 });
  }
}
