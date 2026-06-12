import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead, AuditResult } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const PSI_KEY = process.env.GOOGLE_PAGESPEED_KEY;

async function loadSeedAudits(): Promise<Record<string, AuditResult>> {
  const p = path.join(process.cwd(), "data", "leads-seed.json");
  const raw = await fs.readFile(p, "utf-8");
  const json = JSON.parse(raw);
  return json.audits as Record<string, AuditResult>;
}

async function pagespeed(url: string): Promise<{ score: number; loadTimeMs: number }> {
  if (!PSI_KEY) return { score: 0, loadTimeMs: 0 };
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE&key=${PSI_KEY}`;
  const res = await fetch(endpoint);
  if (!res.ok) return { score: 0, loadTimeMs: 0 };
  const j = await res.json();
  const score = Math.round((j.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
  const lcp = j.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue ?? 0;
  return { score, loadTimeMs: Math.round(lcp) };
}

export async function POST(req: Request) {
  const { lead } = (await req.json()) as { lead: Lead };

  // Fallback: real PageSpeed call or empty result
  const hasWebsite = !!lead.website;
  let score = 0;
  let loadTimeMs = 0;
  if (hasWebsite) {
    const r = await pagespeed(lead.website!);
    score = r.score;
    loadTimeMs = r.loadTimeMs;
  }

  const gaps: string[] = [];
  if (!hasWebsite) gaps.push("No website at all");
  if (hasWebsite && PSI_KEY && score < 50) gaps.push(`${score} PageSpeed (mobile)`);
  if (hasWebsite && loadTimeMs > 4000) gaps.push(`${(loadTimeMs / 1000).toFixed(1)}s load time`);
  if (!lead.whatsapp) gaps.push("No WhatsApp click-to-chat");
  gaps.push("No online booking", "No schema markup", "Weak local SEO");

  let htmlSnippet = "";
  if (hasWebsite) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const siteRes = await fetch(lead.website!.startsWith("http") ? lead.website! : `https://${lead.website}`, { 
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      clearTimeout(timeoutId);
      const html = await siteRes.text();
      htmlSnippet = html.substring(0, 3000); // Send first 3000 chars to AI to find tech stack and meta tags
    } catch (e) {
      console.log("Failed to fetch website HTML for audit:", e);
    }
  }

  let currency: "USD" | "INR" = "USD";
  let estLostRevenuePerMonth = 0;
  let biggestGap = "";
  let conversionScore = 0;
  let techStack = "Unknown";
  let seoHealth = "Unknown";
  let uiModernity = 5;
  let suggestedUpgrades: string[] = [];
  let aiSuccess = false;

  const aiPrompt = `You are an expert technical auditor and business consultant. 
      Analyze this business:
      Name: ${lead.name}
      Category/Niche: ${lead.category}
      Location: ${lead.address}
      Google Reviews: ${lead.reviewsCount ?? 0}
      Website: ${hasWebsite ? lead.website : "No"}
      Mobile PageSpeed Score: ${score}/100

      Website HTML Snippet (for tech stack & SEO analysis):
      \`\`\`html
      ${htmlSnippet}
      \`\`\`

      Perform a deep technical and business audit.
      1. Calculate 'estLostRevenuePerMonth' based on the niche's average lifetime value. (India = INR, USA/Global = USD). High-ticket (tech/medical/agency) = huge revenue loss. Do NOT output 12500 every time, actually calculate a realistic dynamic integer based on their specific niche and review count.
      2. Calculate an 'Overall Digital Competitiveness Score' (0-100) indicating the quality of their current digital presence. Generate a LOW score (15-45) if they have NO website, slow PageSpeed, or a bad template. Generate a HIGH score (80+) only if they have a fast, modern site.
      3. Identify their 'techStack' from the HTML (e.g. "Basic HTML Template", "WordPress", "Wix", "React", "Next.js"). If no website, output "None".
      4. Evaluate 'seoHealth' from the HTML (e.g. "Missing meta description, generic title tag", "Good basic SEO").
      5. Rate 'uiModernity' from 1 to 10 (guess based on tech stack and pagespeed).
      6. Provide 2-3 'suggestedUpgrades' (e.g. "Migrate from static HTML to Next.js for instant loading", "Add semantic SEO markup").

      Return ONLY a raw JSON object. Do not use markdown blocks or backticks. Follow this exact JSON structure but YOU MUST CALCULATE YOUR OWN DYNAMIC VALUES based on the business data. DO NOT copy these example values:
      {
        "currency": "USD",
        "estLostRevenuePerMonth": 12450,
        "conversionScore": 72,
        "biggestGap": "A 1-sentence punchy pitch explaining their biggest missed opportunity.",
        "techStack": "WordPress",
        "seoHealth": "Missing meta description and H1 tags",
        "uiModernity": 3,
        "suggestedUpgrades": ["Replace simple HTML with Next.js for faster load speeds", "Implement proper schema markup"]
      }`;

  const geminiKeys = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2].filter(Boolean) as string[];
  
  for (const key of geminiKeys) {
    if (aiSuccess) break;
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(aiPrompt);
      let text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      const aiData = JSON.parse(text);
      currency = aiData.currency === "INR" ? "INR" : "USD";
      estLostRevenuePerMonth = aiData.estLostRevenuePerMonth;
      conversionScore = Math.min(100, Math.max(0, aiData.conversionScore || 50));
      biggestGap = aiData.biggestGap;
      techStack = aiData.techStack || "Unknown";
      seoHealth = aiData.seoHealth || "Unknown";
      uiModernity = aiData.uiModernity || 5;
      suggestedUpgrades = aiData.suggestedUpgrades || [];
      aiSuccess = true;
    } catch (e) {
      console.log("Gemini fallback on key:", e);
    }
  }

  if (!aiSuccess && process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: aiPrompt }],
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        temperature: 0.5,
      });
      let text = completion.choices[0]?.message?.content?.trim() || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      const aiData = JSON.parse(text);
      currency = aiData.currency === "INR" ? "INR" : "USD";
      estLostRevenuePerMonth = aiData.estLostRevenuePerMonth;
      conversionScore = Math.min(100, Math.max(0, aiData.conversionScore || 50));
      biggestGap = aiData.biggestGap;
      techStack = aiData.techStack || "Unknown";
      seoHealth = aiData.seoHealth || "Unknown";
      uiModernity = aiData.uiModernity || 5;
      suggestedUpgrades = aiData.suggestedUpgrades || [];
      aiSuccess = true;
    } catch (e) {
      console.error("Groq fallback failed:", e);
    }
  }

  if (!aiSuccess) {
    // Fallback heuristics
    const isIndia = lead.address.toLowerCase().includes("india") || (lead.phone && lead.phone.includes("+91"));
    const isHighTicket = lead.category.toLowerCase().match(/software|tech|it|computer|medical|dentist|agency|marketing|consultant|wedding|event|b2b/);
    
    currency = isIndia ? "INR" : "USD";
    
    const reviews = lead.reviewsCount ?? 30;
    if (isIndia) {
      const base = isHighTicket ? 50000 : 15000;
      const multiplier = isHighTicket ? 1500 : 300;
      estLostRevenuePerMonth = base + (reviews * multiplier) + (hasWebsite ? 0 : (isHighTicket ? 50000 : 15000));
    } else {
      const base = isHighTicket ? 8000 : 2500;
      const multiplier = isHighTicket ? 150 : 30;
      estLostRevenuePerMonth = base + (reviews * multiplier) + (hasWebsite ? 0 : (isHighTicket ? 5000 : 1500));
    }
    
    let fbScore = 50;
    if (!hasWebsite) fbScore += 30;
    else if (score < 50) fbScore += 15;
    if (reviews > 50) fbScore += 20;
    else if (reviews > 10) fbScore += 10;
    else fbScore -= 20;
    conversionScore = Math.min(100, Math.max(0, fbScore));

    biggestGap = hasWebsite
      ? loadTimeMs > 0
        ? `Site loads in ${(loadTimeMs / 1000).toFixed(1)}s. Modern build fixes this overnight.`
        : "Missing page speed data. A lightning-fast site will instantly boost conversions."
      : "No website found. You are losing significant business to competitors with a web presence.";
  }

  const audit: AuditResult = {
    leadId: lead.id,
    pageSpeedScore: score,
    hasWebsite,
    mobileFriendly: PSI_KEY ? score > 60 : true,
    https: hasWebsite ? lead.website!.startsWith("https") : false,
    hasSchema: false,
    loadTimeMs,
    gaps,
    biggestGap,
    estLostRevenuePerMonth,
    currency,
    conversionScore,
    techStack,
    seoHealth,
    uiModernity,
    suggestedUpgrades,
  };
  return NextResponse.json({ audit });
}
