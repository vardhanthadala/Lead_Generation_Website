"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Stepper } from "@/components/Stepper";
import { Phase1Scrape } from "@/components/Phase1Scrape";
import { Phase2Audit } from "@/components/Phase2Audit";
import { Phase3Rank } from "@/components/Phase3Rank";
import { Phase4Build } from "@/components/Phase4Build";
import { Phase5Outreach } from "@/components/Phase5Outreach";
import { Phase6Pipeline } from "@/components/Phase6Pipeline";
import { scoreLead } from "@/lib/scoring";
import type { Lead, AuditResult } from "@/lib/types";

export default function Page() {
  const [phase, setPhase] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [audits, setAudits] = useState<Record<string, AuditResult>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const completed = useMemo(() => {
    const s = new Set<number>();
    if (leads.length > 0) s.add(1);
    if (Object.keys(audits).length > 0) s.add(2);
    if (selectedId) {
      s.add(3);
    }
    return s;
  }, [leads, audits, selectedId]);

  const selectedRanked = useMemo(() => {
    if (!selectedId) return null;
    const lead = leads.find((l) => l.id === selectedId);
    const audit = audits[selectedId];
    if (!lead || !audit) return null;
    return scoreLead(lead, audit);
  }, [selectedId, leads, audits]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-foreground focus:text-background focus:px-3 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Skip to content
      </a>
      <div className="px-4 sm:px-6 w-full mt-6 mb-8">
        <header className="border border-border bg-white shadow-sm rounded-[2.5rem] max-w-5xl mx-auto overflow-hidden pt-3 pb-1.5">
          <div className="px-8">
            <div className="w-full">
              <Stepper current={phase} completed={completed} onJump={(n) => setPhase(n)} />
            </div>
          </div>
        </header>
      </div>
      <main id="main" className="pt-6" tabIndex={-1}>
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <Phase1Scrape
              key="p1"
              leads={leads}
              setLeads={setLeads}
              onNext={() => setPhase(2)}
            />
          )}
          {phase === 2 && (
            <Phase2Audit
              key="p2"
              leads={leads}
              audits={audits}
              setAudits={setAudits}
              onNext={() => setPhase(3)}
              onPrev={() => setPhase(1)}
            />
          )}
          {phase === 3 && (
            <Phase3Rank
              key="p3"
              leads={leads}
              audits={audits}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onNext={() => setPhase(5)}
              onPrev={() => setPhase(2)}
            />
          )}
          {phase === 5 && (
            <Phase5Outreach
              key="p5"
              selected={selectedRanked}
              onPrev={() => setPhase(3)}
              onNext={() => setPhase(6)}
            />
          )}
          {phase === 6 && (
            <Phase6Pipeline
              key="p6"
              onPrev={() => setPhase(5)}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
