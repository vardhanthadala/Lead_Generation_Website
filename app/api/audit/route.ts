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

  let currency: "USD" | "INR" = "USD";
  let estLostRevenuePerMonth = 0;
  let biggestGap = "";
  let conversionScore = 0;
  let aiSuccess = false;

  const aiPrompt = `You are a top-tier business consultant. 
      Analyze this business:
      Name: ${lead.name}
      Category/Niche: ${lead.category}
      Location: ${lead.address}
      Google Reviews: ${lead.reviewsCount ?? 0}
      Website: ${hasWebsite ? "Yes" : "No"}
      Mobile PageSpeed: ${score}/100

      Calculate the estimated lost monthly revenue based on this exact niche's average customer lifetime value and the location. If the location is in India, return currency as "INR". If it's in the USA, return "USD". If it's an agency, tech, medical, or event planner, make the amount much higher.
      Also, calculate a strict mathematical 'conversionScore' from 0-100 indicating how likely they are to buy a new website. High score (80-100) ONLY if they have lots of reviews but NO website or a terrible Pagespeed. Low score (0-30) if they have zero reviews or a perfect website. Do not hallucinate, use strict logic.
      Return ONLY a raw JSON object. Do not use markdown blocks, backticks, or any other text.
      {
        "currency": "USD",
        "estLostRevenuePerMonth": 12500,
        "conversionScore": 85,
        "biggestGap": "A 1-sentence punchy, personalized pitch explaining their biggest missed opportunity."
      }`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(aiPrompt);
      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      const aiData = JSON.parse(text);
      currency = aiData.currency === "INR" ? "INR" : "USD";
      estLostRevenuePerMonth = aiData.estLostRevenuePerMonth;
      conversionScore = Math.min(100, Math.max(0, aiData.conversionScore || 50));
      biggestGap = aiData.biggestGap;
      aiSuccess = true;
    } catch (e) {
      console.error("Gemini fallback:", e);
    }
  }

  if (!aiSuccess && process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: aiPrompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
      });
      let text = completion.choices[0]?.message?.content?.trim() || "{}";
      if (text.startsWith("```")) {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      const aiData = JSON.parse(text);
      currency = aiData.currency === "INR" ? "INR" : "USD";
      estLostRevenuePerMonth = aiData.estLostRevenuePerMonth;
      conversionScore = Math.min(100, Math.max(0, aiData.conversionScore || 50));
      biggestGap = aiData.biggestGap;
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
  };
  return NextResponse.json({ audit });
}
