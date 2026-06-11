import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import type { RankedLead } from "@/lib/types";

export async function POST(req: Request) {
  const { lead, platform } = (await req.json()) as { lead: RankedLead; platform: string };

  const systemPrompt = `You are a world-class prompt engineer and expert UI/UX developer. 
Your goal is to write a highly detailed, extremely professional system prompt that will be fed into an AI Website Builder (${platform}).

# CONTEXT
Business Name: ${lead.name}
Niche/Industry: ${lead.category}
Location: ${lead.address}
Phone: ${lead.phone ?? "+91 XXXXX XXXXX"}
Rating: ${lead.rating ?? 4.5}★ (${lead.reviewsCount ?? 0} reviews)
Biggest Missed Opportunity: ${lead.audit.biggestGap}

# INSTRUCTIONS FOR YOUR OUTPUT
Write the actual prompt that the user will copy-paste into the AI builder. The prompt MUST include:
1. **Premium Aesthetic & Theme:** Suggest a high-end color palette perfectly suited for this specific niche (e.g., trust-blue for IT, sleek-dark for tech, organic-earth for spas).
2. **Modern UI/UX Elements:** Explicitly demand premium UI elements (glassmorphism, subtle parallax, soft shadows, bento grids, etc.).
3. **Animations:** Dictate specific niche-appropriate animations (e.g., "smooth stagger fade-ins on scroll", "hover lift effects on service cards").
4. **Platform Specifics:** 
   - If platform is 'lovable' or 'bolt', demand a single React + Tailwind page.
   - If platform is 'claude-code', demand a Next.js App Router + Tailwind + shadcn UI structure.
   - If platform is 'codex', demand a static HTML + Tailwind CDN setup.
5. **Business Sections:** Demand a Hero section, Trust signals (rating/reviews), Services grid, About/Location, and a WhatsApp CTA.

Return ONLY the raw prompt text. Do not wrap it in quotes or markdown formatting. The prompt must be written directly to the AI builder (e.g., "Build a high-converting landing page...").`;

  let aiSuccess = false;
  let promptText = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(systemPrompt);
      promptText = result.response.text().trim();
      aiSuccess = !!promptText;
    } catch (e) {
      console.error("Gemini failed to generate prompt:", e);
    }
  }

  if (!aiSuccess && process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: systemPrompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
      });
      promptText = completion.choices[0]?.message?.content?.trim() || "";
      aiSuccess = !!promptText;
    } catch (e) {
      console.error("Groq failed to generate prompt:", e);
    }
  }

  if (!aiSuccess) {
    // Fallback if AI fails completely
    promptText = `Build a high-converting premium landing page for ${lead.name}, a local ${lead.category} business. Use modern Tailwind CSS with subtle fade-in animations and a professional color scheme appropriate for the industry. Include a Hero section with a clear WhatsApp CTA, a services grid, a reviews section, and a footer with their address: ${lead.address}.`;
  }

  return NextResponse.json({ prompt: promptText });
}
