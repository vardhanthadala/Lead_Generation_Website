# Lead to Launch 🚀

Lead to Launch is an end-to-end AI-powered Agency CRM and Lead Generation platform. It automates the entire process of finding local businesses, deeply auditing their digital presence, generating professional AI outreach messages, creating PDF reports, and tracking them through a built-in Kanban pipeline.

---

## ⚙️ The 6-Phase Pipeline

**Phase 1: Scrape & Source**
- **Bulk Scrape:** Enter a niche (e.g., "Plumber") and a city. The app connects to the Apify Google Maps crawler to extract hundreds of local businesses, their phone numbers, emails, and ratings instantly.
- **Manual URL Entry:** Instantly add a single lead by pasting their website URL. The app uses Cheerio and Groq's Llama 3 to scrape the website and extract their Business Name, Email, and Phone Number in seconds.

**Phase 2: AI Business Audit**
- Select the leads you want to target.
- The app pings the **Google PageSpeed API** to calculate their website loading speed.
- **Gemini / Llama 3** analyzes their website HTML to identify their Tech Stack (e.g., WordPress, Next.js), SEO health, and calculates a dynamic **Estimated Lost Revenue** based on their niche and review count.
- *Note: Audits are batched and run in parallel (5 at a time) for extreme speed.*

**Phase 3: Rank & Prioritize**
- Uses a proprietary algorithm to score leads out of 100 based on their audit results.
- Prioritizes businesses that have bad websites (or no website), poor SEO, but high Google Maps reviews (indicating they have money but a bad digital presence).

**Phase 4: PDF Report Generation**
- Generates a gorgeous, client-ready PDF report detailing their audit failures.
- Perfect for attaching to cold emails or handing to them in person.

**Phase 5: AI Outreach & Pitching**
- Select an outreach channel (WhatsApp, Email, or Instagram) and a language tone (English or Hinglish).
- The AI instantly generates a highly personalized, context-aware pitch explaining exactly how much money they are losing due to their slow website or poor SEO.
- One-click buttons to instantly open WhatsApp Web or your Email client with the message pre-filled.

**Phase 6: CRM Pipeline (Neon Postgres)**
- A persistent, drag-and-drop Kanban board to track your sales pipeline.
- Stages: `Audited` ➡️ `Contacted` ➡️ `Demo Built` ➡️ `Closed Won` ➡️ `Closed Lost`.
- As you copy emails or send WhatsApp messages in Phase 5, leads are automatically moved to the "Contacted" stage in the CRM.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** Next.js Route Handlers
- **Database:** Neon Serverless Postgres, Drizzle ORM
- **AI & Processing:** 
  - Vercel AI SDK
  - Gemini Flash (Deep Audits & Outreach Generation)
  - Groq Llama 3.1 8B (Instant HTML extraction)
- **Scraping:** Apify, Cheerio

---

## 🚀 Getting Started

### 1. Environment Variables
Create a `.env.local` file in the root of the project (`app/`) and add the following keys:

```bash
# Apify (Bulk Google Maps Scraping)
APIFY_TOKEN=your_apify_token_here
APIFY_ACTOR=compass~crawler-google-places

# Google PageSpeed (Website Auditing)
GOOGLE_PAGESPEED_KEY=your_google_pagespeed_api_key_here
SCRAPER_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Groq (Ultra-fast LLM extraction for manual URLs)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Gemini (AI Auditing & Outreach Drafts)
GEMINI_API_KEY_1=your_primary_gemini_key
GEMINI_API_KEY_2=your_fallback_gemini_key

# Neon Postgres (CRM Database)
DATABASE_URL="postgresql://neondb_owner:.../neondb?sslmode=require"
```

### 2. Database Setup (Drizzle + Neon)
This project uses Drizzle ORM. Ensure your `DATABASE_URL` is set, then push the schema to your Neon Postgres database:

```bash
npx drizzle-kit push
```

### 3. Run the Development Server
Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 Deployment

The easiest way to deploy this app is on [Vercel](https://vercel.com). Simply push your code to GitHub, connect the repository to Vercel, and paste your environment variables into the Vercel project settings. Serverless Postgres via Neon ensures the database scales seamlessly with Vercel's edge network.
