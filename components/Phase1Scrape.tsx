"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PhaseShell } from "./PhaseShell";
import { Loader2, MapPin, Phone, Star, Globe, MessageCircle, Mail } from "lucide-react";
import type { Lead, ScrapeInput } from "@/lib/types";
import { toast } from "sonner";

const LeadMap = dynamic(() => import("./LeadMap"), { ssr: false });

export function Phase1Scrape({
  leads,
  setLeads,
  onNext,
  onPrev,
}: {
  leads: Lead[];
  setLeads: (l: Lead[]) => void;
  onNext: () => void;
  onPrev?: () => void;
}) {
  const [input, setInput] = useState<ScrapeInput>({ niche: "", city: "", count: "" as unknown as number });
  const [loading, setLoading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  async function addManualUrl() {
    if (!manualUrl) return;
    setManualLoading(true);
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: manualUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to extract website");
      
      setLeads([data.lead, ...leads]);
      setManualUrl("");
      toast.success(`Added ${data.lead.name} to leads!`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setManualLoading(false);
    }
  }

  async function runScrape() {
    setLoading(true);
    setLeads([]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      // Stagger in for visual drama
      for (let i = 0; i < data.leads.length; i++) {
        await new Promise((r) => setTimeout(r, 80));
        setLeads(data.leads.slice(0, i + 1));
      }
      if (data.source === "seed-fallback" && data.error) {
        toast.warning(`Apify API Error: ${data.error}. Showing sample data instead.`);
      } else {
        toast.success(`${data.leads.length} leads scraped from ${input.city}`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhaseShell
      title="Phase 1 — Scrape leads"
      subtitle="Pull local businesses from Google Maps. We capture contact, reviews, photos, and location to score conversion potential."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={leads.length === 0}
      nextLabel="Audit these leads"
    >
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Niche</Label>
              <Input id="niche" autoComplete="off" value={input.niche} onChange={(e) => setInput({ ...input, niche: e.target.value })} placeholder="Enter a niche" className="h-10 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Location</Label>
              <Input id="city" autoComplete="off" value={input.city} onChange={(e) => setInput({ ...input, city: e.target.value })} placeholder="Enter the location" className="h-10 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Count</Label>
              <Input id="count" type="number" inputMode="numeric" min={1} max={50} value={input.count} onChange={(e) => setInput({ ...input, count: e.target.value ? Number(e.target.value) : ("" as unknown as number) })} placeholder="Enter count of businesses" className="h-10 text-base font-mono tabular-nums" />
              <p className="text-[11px] text-muted-foreground">Max 25 for free Apify tier.</p>
            </div>
            <Button onClick={runScrape} disabled={loading || !input.niche || !input.city || !input.count} className="w-full h-11 transition-transform duration-150 active:scale-[0.98]">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scraping...</> : "Bulk Scrape leads"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-card px-2 text-muted-foreground">Or quick add by URL</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="https://example.com" 
                value={manualUrl} 
                onChange={e => setManualUrl(e.target.value)} 
                className="flex-1 text-xs h-9"
              />
              <Button onClick={addManualUrl} disabled={manualLoading || !manualUrl} size="sm" variant="secondary" className="h-9">
                {manualLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Extract"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Stat label="Found" value={leads.length} />
              <Stat label="With phone" value={leads.filter((l) => l.phone).length} />
              <Stat label="No site" value={leads.filter((l) => !l.website).length} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Live map</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadMap leads={leads} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {leads.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-border"
                    >
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {l.address}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</span>}
                          {l.whatsapp && <span className="flex items-center gap-1 text-[color:var(--accent-foreground)]"><MessageCircle className="h-3 w-3" /> WhatsApp</span>}
                          {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_6px_rgba(255,184,0,0.6)]" />
                          <span className="font-medium">{l.rating?.toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs">({l.reviewsCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {l.website ? (
                          <Badge variant="outline" className="text-xs font-normal text-emerald-600 border-emerald-600/30 bg-emerald-600/10"><Globe className="h-3 w-3 mr-1" /> Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-normal text-red-600 border-red-600/30 bg-red-600/10">No</Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            {leads.length === 0 && !loading && (
              <div className="text-center py-12 text-sm text-muted-foreground">Run a scrape to populate leads</div>
            )}
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2 shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--accent-red)] font-semibold">{label}</div>
      <div className="text-xl tabular-nums mt-0.5 font-bold" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{value}</div>
    </div>
  );
}
