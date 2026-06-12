"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { MessageCircle, Mail, Camera, Copy, ExternalLink, Sparkles, Loader2, RefreshCw, FileText } from "lucide-react";
import type { RankedLead, OutreachChannel, OutreachLanguage } from "@/lib/types";
import { toast } from "sonner";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { PdfReportTemplate } from "./PdfReportTemplate";

export function Phase5Outreach({
  selected,
  onPrev,
}: {
  selected: RankedLead | null;
  onPrev: () => void;
}) {
  const [channel, setChannel] = useState<OutreachChannel>("whatsapp");
  const [lang, setLang] = useState<OutreachLanguage>("english");
  const [message, setMessage] = useState("");
  const [followUp, setFollowUp] = useState("");
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    generateDraft();
  }, [selected, channel, lang]);

  async function generateDraft() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: selected, channel, language: lang }),
      });
      const data = await res.json();
      if (data.first && data.followUp) {
        setMessage(data.first);
        setFollowUp(data.followUp);
      }
    } catch (e) {
      toast.error("Failed to generate AI outreach");
    } finally {
      setLoading(false);
    }
  }

  async function markAsContacted() {
    if (!selected) return;
    try {
      await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, pipelineStage: "contacted" })
      });
    } catch (e) {
      console.error("Failed to update CRM status", e);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
    markAsContacted();
  }

  function openChannel() {
    if (!selected) return;
    markAsContacted();
    if (channel === "whatsapp" && selected.whatsapp) {
      const num = selected.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "email" && selected.email) {
      const subject = lang === "hinglish" ? "Aapke business ke liye ek website demo banayi hai" : "Built a website demo for your business";
      window.open(`mailto:${selected.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "instagram") {
      window.open(`https://instagram.com/`, "_blank");
    } else {
      toast.error("No contact for this channel");
    }
  }

  async function downloadPdf() {
    if (!selected || !pdfRef.current) return;
    setIsGeneratingPdf(true);
    toast.info("Generating professional PDF report...");
    
    try {
      const element = pdfRef.current;
      
      const pages = Array.from(element.children) as HTMLElement[];
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        const imgData = await htmlToImage.toPng(pageEl, { 
          quality: 1.0, 
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pageHeight);
      }
      
      pdf.save(`${selected.name.replace(/\s+/g, "_")}_Audit_Report.pdf`);
      toast.success("PDF Downloaded! Attach it to your message.");
    } catch (e) {
      toast.error("Failed to generate PDF");
      console.error("PDF Error:", e);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 5 — Outreach"
        subtitle="Highly professional AI-drafted outreach. Built-in 3-day follow-up."
        onPrev={onPrev}
      >
        <IncompleteState
          title="No lead selected yet"
          description="Outreach drafts are tailored to a specific lead — picking up name, biggest gap, review count, and reachable channels. Run earlier phases and select a prospect to see WhatsApp, email, and Instagram drafts here."
          prevPhaseLabel="Rank"
          onPrev={onPrev}
        />
      </PhaseShell>
    );
  }

  const channels: { id: OutreachChannel; label: string; icon: typeof MessageCircle; enabled: boolean }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, enabled: !!selected.whatsapp },
    { id: "email", label: "Email", icon: Mail, enabled: !!selected.email },
    { id: "instagram", label: "Instagram", icon: Camera, enabled: true },
  ];

  return (
    <PhaseShell title="Phase 5 — Outreach" subtitle="Highly professional AI-drafted outreach. Built-in 3-day follow-up." onPrev={onPrev}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Sending to</div>
          <div className="font-display text-2xl mt-1">{selected.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {channels.map(({ id, label, icon: Icon, enabled }) => (
          <Button
            key={id}
            variant={channel === id ? "default" : "outline"}
            size="sm"
            disabled={!enabled}
            onClick={() => setChannel(id)}
          >
            <Icon className="h-4 w-4 mr-2" /> {label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>First message</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={downloadPdf} disabled={isGeneratingPdf} className="bg-rose-100 text-rose-700 hover:bg-rose-200">
                {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1.5" />} 
                Get PDF
              </Button>
              <Button size="sm" variant="secondary" onClick={generateDraft} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> New AI Draft
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(message)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</Button>
              <Button size="sm" onClick={openChannel}><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Send</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center bg-muted/20 border border-border rounded-md">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground animate-pulse">AI is writing a professional draft...</p>
              </div>
            ) : (
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
            )}
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Hook: personal · Pain: their biggest gap · Demo: live link · CTA: low-friction yes/no
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day-3 follow-up (auto-draft)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center bg-muted/20 border border-border rounded-md">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground animate-pulse">Drafting follow-up...</p>
              </div>
            ) : (
              <Textarea
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
            )}
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => copy(followUp)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy follow-up</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 bg-accent/40 border-accent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-base">✓</div>
            <div>
              <div className="font-medium tracking-tight">Pipeline complete</div>
              <div className="text-sm text-muted-foreground">Lead → audit → ranked → site → outreach. Repeat for next prospect in Phase 3.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden PDF Layout */}
      <PdfReportTemplate ref={pdfRef} lead={selected} />
    </PhaseShell>
  );
}

function buildOutreach(l: RankedLead, channel: OutreachChannel, lang: OutreachLanguage): { first: string; followUp: string } {
  const ownerName = l.name.includes("Dr.") ? l.name.split(",")[0].replace(/['s].*/, "").trim() : "there";
  const niche = l.category.toLowerCase();
  const reviews = l.reviewsCount ?? 0;
  const rating = l.rating ?? 4.5;
  const demoUrl = `[your-demo-link]`;

  if (lang === "hinglish") {
    if (channel === "whatsapp") {
      return {
        first: `Hi ${ownerName} 👋

${l.city} mein ${niche} options dekh raha tha aur aapki ${l.name} sabse top ratings mein aayi — ${rating}★ aur ${reviews}+ reviews 🔥

Ek baat noticed ki: ${l.audit.biggestGap}

Iska ek solution banaya hai — aapke business ke liye ek FREE website demo bana di hai. WhatsApp booking, Google reviews, services, sab ready.

Live demo dekhiye (30 seconds):
${demoUrl}

Pasand aaye toh launch karwa denge. Nahi toh no problem — demo aapke paas free hi rahega.

Reply karein "YES" agar interested?`,
        followUp: `Hi ${ownerName}, kal jo demo bheja tha — dekha aapne?

Quick recap: ${l.audit.biggestGap.split(".")[0]}.

Iska monthly impact roughly ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")} hai (Google search volume ke basis pe).

Demo abhi bhi live hai:
${demoUrl}

5 minute call kar sakte hain to walk through? Bas batao kab free ho.`,
      };
    }
    if (channel === "email") {
      return {
        first: `Subject: Aapki ${l.name} ke liye ek website demo (free, 30 sec dekhiye)

Hi ${ownerName},

${l.city} mein ${niche} services research kar raha tha. ${l.name} top results mein aayi — ${rating}★, ${reviews}+ reviews.

Lekin ek gap noticed kiya: ${l.audit.biggestGap}

Aapke business ke liye ek live website demo banayi hai. Saari information already filled in — services, location, WhatsApp booking, Google reviews integration.

Demo: ${demoUrl}

30 seconds lagega dekhne mein. Pasand aaye toh launch karwa denge — full price ₹15,000 (one-time), zero monthly fees.

Reply with "YES" agar interested ho, ya "NO" agar relevant nahi — dono works.

Best,
[Your Name]`,
        followUp: `Subject: Re: ${l.name} website demo

Hi ${ownerName},

Pichli email pe quick check-in. Demo abhi bhi live hai: ${demoUrl}

Conservative estimate: ${l.audit.biggestGap.split(".")[0].toLowerCase()} costs around ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month in missed bookings.

Worth a 5-min call?

Best,
[Your Name]`,
      };
    }
    return {
      first: `Hi! 🙏 ${l.name} ke liye ek website demo banayi hai — ${l.audit.biggestGap} solve karne ke liye. ${demoUrl} pe live preview. Pasand aaye toh DM!`,
      followUp: `Hey, kal jo website demo bheja tha — koi feedback? Demo: ${demoUrl} | 5 min call set kar sakte hain?`,
    };
  }

  // English
  if (channel === "whatsapp") {
    return {
      first: `Hi ${ownerName} 👋

Was researching ${niche} businesses in ${l.city} and ${l.name} stood out — ${rating}★ with ${reviews}+ Google reviews.

Spotted one gap though: ${l.audit.biggestGap}

So I built you a free website demo with WhatsApp booking, Google reviews integration, and services. All pre-filled with your info.

30-second preview: ${demoUrl}

If you like it, we launch it. If not, the demo is yours to keep — free.

Reply "YES" if interested?`,
      followUp: `Hi ${ownerName}, following up on the demo from a couple of days ago: ${demoUrl}

The biggest gap I shared (${l.audit.biggestGap.split(".")[0]}) is costing roughly ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month in missed bookings.

Worth a quick 5-min call to walk through?`,
    };
  }
  if (channel === "email") {
    return {
      first: `Subject: Built ${l.name} a website demo — 30 sec preview

Hi ${ownerName},

I was researching ${niche} businesses in ${l.city}. ${l.name} stood out (${rating}★, ${reviews}+ reviews).

But I noticed: ${l.audit.biggestGap}

So I built a free demo website for your business, pre-filled with services, location, WhatsApp booking, and Google reviews.

Demo: ${demoUrl}

If you like it, launch is ₹15,000 one-time, zero monthly. If not, demo is yours.

Reply "YES" or "NO" — both work.

Best,
[Your Name]`,
      followUp: `Subject: Re: ${l.name} website demo

Hi ${ownerName},

Quick check-in. Demo still live: ${demoUrl}

Conservative estimate: the gap above costs around ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month.

5-min call?

Best,
[Your Name]`,
    };
  }
  return {
    first: `Hey! Built a website demo for ${l.name} to fix one gap (${l.audit.biggestGap.split(".")[0]}). Preview: ${demoUrl}. DM if interested!`,
    followUp: `Hi! Following up on the demo: ${demoUrl}. 5-min call?`,
  };
}
