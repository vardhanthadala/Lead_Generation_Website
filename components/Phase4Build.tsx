"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Copy, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import type { RankedLead } from "@/lib/types";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "lovable", label: "Lovable", url: "https://lovable.dev" },
  { id: "claude-code", label: "Claude Code", url: "https://claude.com/claude-code" },
  { id: "bolt", label: "Bolt.new", url: "https://bolt.new" },
  { id: "codex", label: "Codex", url: "https://chat.openai.com" },
];

export function Phase4Build({
  selected,
  onNext,
  onPrev,
}: {
  selected: RankedLead | null;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [platform, setPlatform] = useState("lovable");
  const [prompt, setPrompt] = useState("");
  const [typed, setTyped] = useState("");
  const [building, setBuilding] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  useEffect(() => {
    if (!selected) return;
    async function fetchPrompt() {
      setIsGeneratingPrompt(true);
      setPrompt("");
      setTyped("");
      try {
        const res = await fetch("/api/generate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead: selected, platform }),
        });
        const data = await res.json();
        setPrompt(data.prompt);
      } catch (err) {
        console.error(err);
        setPrompt("Error generating prompt. Please try again.");
      } finally {
        setIsGeneratingPrompt(false);
      }
    }
    fetchPrompt();
  }, [selected, platform]);

  useEffect(() => {
    setTyped("");
    if (!prompt) return;
    let i = 0;
    const id = setInterval(() => {
      i += 8;
      setTyped(prompt.slice(0, i));
      if (i >= prompt.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [prompt]);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied. Paste into " + PLATFORMS.find((p) => p.id === platform)?.label);
  }

  function openPlatform() {
    const url = PLATFORMS.find((p) => p.id === platform)?.url;
    if (url) window.open(url, "_blank");
  }

  function simulateBuild() {
    setBuilding(true);
    setTimeout(() => {
      setBuilding(false);
      toast.success("Demo site ready. Preview loaded.");
    }, 1800);
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 4 — Generate website"
        subtitle="Pick a platform. We craft a battle-tested prompt with brand, structure, sections, and SEO baked in."
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled
        nextLabel="Draft outreach"
      >
        <IncompleteState
          title="No lead selected yet"
          description="Run scrape and audit, then pick the highest-scoring prospect in Phase 3. We'll generate a complete website prompt (Lovable / Bolt / Claude Code / Codex) plus a live preview here."
          prevPhaseLabel="Rank"
          onPrev={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 4 — Generate website"
      subtitle={`Pick a platform. We craft a battle-tested prompt with brand, structure, sections, and SEO baked in.`}
      onPrev={onPrev}
      onNext={onNext}
      nextLabel="Draft outreach"
    >
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Selected lead</div>
          <div className="text-2xl mt-1 font-[900] tracking-tight">{selected.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{selected.address}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={openPlatform}><ExternalLink className="h-4 w-4 mr-2" /> Open</Button>
          <Button onClick={copyPrompt}><Copy className="h-4 w-4 mr-2" /> Copy prompt</Button>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Generated prompt</CardTitle>
          </CardHeader>
          <CardContent>
            {isGeneratingPrompt ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground space-y-4 border border-border bg-muted/30 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                <div className="text-sm">AI is writing a highly custom prompt...</div>
              </div>
            ) : (
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 rounded-md p-4 max-h-[520px] overflow-y-auto border border-border">
                {typed}<span className="animate-pulse">▌</span>
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </PhaseShell>
  );
}


