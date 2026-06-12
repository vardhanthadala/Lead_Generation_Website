import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import type { RankedLead } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { lead, channel, language } = await req.json() as { lead: RankedLead; channel: string; language: string };
    
    let aiSuccess = false;
    let first = "";
    let followUp = "";

    const ownerName = lead.name.includes("Dr.") ? lead.name.split(",")[0].replace(/['s].*/, "").trim() : "there";
    const demoUrl = "[your-demo-link]";
    const platform = channel === "email" ? "an email" : channel === "whatsapp" ? "a WhatsApp message" : "an Instagram DM";
    const langInstructions = language === "hinglish" 
      ? "Write in a highly professional 'Hinglish' tone (Hindi written in English alphabet, mixed with English corporate terminology). It must sound like a top-tier Mumbai/Delhi tech consultant."
      : "Write in highly professional, polished, and persuasive English.";

    const aiPrompt = `You are a top-tier, highly professional tech consultant and sales executive.
Write a highly professional outreach message and a day-3 follow-up message to a business owner.
Platform: ${platform}
Language/Tone: ${langInstructions}

Business Data:
Name: ${lead.name}
Category: ${lead.category}
City: ${lead.city}
Reviews: ${lead.reviewsCount} (Rating: ${lead.rating})

Deep Tech Audit Results:
Biggest Gap: ${lead.audit.biggestGap}
Tech Stack: ${lead.audit.techStack}
SEO Health: ${lead.audit.seoHealth}
Est. Lost Monthly Revenue: ${lead.audit.currency === "USD" ? "$" : "₹"}${lead.audit.estLostRevenuePerMonth}

Goal:
Draft two messages ("first" and "followUp").
1. First Message: 
   - Acknowledge their great reviews and standing in their city.
   - Professionally state the specific technical flaws (mention the Tech Stack and SEO issues discovered).
   - Pitch the solution: building them a much faster, modern website (e.g., using Next.js/React) to fix the SEO and speed, which will directly lead to more client reach and solve their biggest gap.
   - Mention that you already built a FREE live demo website for them: ${demoUrl}
   - Strong, low-friction Call to Action (e.g. "Reply YES if you'd like to see it").
2. Follow-Up Message:
   - Quick check-in on the demo.
   - Remind them of the estimated lost revenue (${lead.audit.currency === "USD" ? "$" : "₹"}${lead.audit.estLostRevenuePerMonth}/month) caused by these technical gaps.
   - Ask for a 5-minute call.

CRITICAL: Return ONLY a raw JSON object with the keys "first" and "followUp". Do NOT include markdown blocks (\`\`\`) or any other text.
{
  "first": "Message content here...",
  "followUp": "Follow up content here..."
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
        if (aiData.first && aiData.followUp) {
          first = aiData.first;
          followUp = aiData.followUp;
          aiSuccess = true;
        }
      } catch (e) {
        console.log("Gemini outreach fallback on key:", e);
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
        if (aiData.first && aiData.followUp) {
          first = aiData.first;
          followUp = aiData.followUp;
          aiSuccess = true;
        }
      } catch (e) {
        console.error("Groq outreach fallback failed:", e);
      }
    }

    if (!aiSuccess) {
      first = `Fallback: Could not connect to AI to draft message.`;
      followUp = `Fallback: Could not connect to AI.`;
    }

    return NextResponse.json({ first, followUp });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate outreach" }, { status: 500 });
  }
}
