"use client";

import { useEffect, useState, useRef } from "react";
import { PhaseShell } from "./PhaseShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type PipelineStage = "audited" | "contacted" | "demo_built" | "closed_won" | "closed_lost";

const STAGES: { id: PipelineStage; label: string; color: string; cardClass: string; textClass: string }[] = [
  { id: "audited", label: "Audited", color: "bg-zinc-100 border-zinc-200", cardClass: "bg-white border-l-[4px] border-l-zinc-300", textClass: "text-zinc-700" },
  { id: "contacted", label: "Contacted", color: "bg-blue-50 border-blue-200", cardClass: "bg-blue-50/40 border-l-[4px] border-l-blue-400", textClass: "text-blue-700" },
  { id: "demo_built", label: "Demo Sent", color: "bg-amber-50 border-amber-200", cardClass: "bg-amber-50/40 border-l-[4px] border-l-amber-400", textClass: "text-amber-700" },
  { id: "closed_won", label: "Closed - Won", color: "bg-emerald-50 border-emerald-200", cardClass: "bg-emerald-50/40 border-l-[4px] border-l-emerald-500", textClass: "text-emerald-700" },
  { id: "closed_lost", label: "Closed - Lost", color: "bg-red-50 border-red-200", cardClass: "bg-red-50/40 border-l-[4px] border-l-red-400", textClass: "text-red-700" },
];

export function Phase6Pipeline({ onPrev }: { onPrev: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [leads]);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    const scrollAmount = clientWidth * 0.8; 
    scrollRef.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  }

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      toast.error("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  }

  async function moveStage(id: string, newStage: PipelineStage) {
    setLeads((prev) => prev.map(l => l.id === id ? { ...l, pipelineStage: newStage } : l));
    try {
      await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pipelineStage: newStage })
      });
      toast.success("Stage updated");
    } catch (e) {
      toast.error("Failed to update stage");
      fetchLeads();
    }
  }

  if (loading) {
    return (
      <PhaseShell title="Pipeline — CRM" subtitle="Manage your leads and track revenue." onPrev={onPrev}>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PhaseShell>
    );
  }

  return (
    <PhaseShell title="Pipeline — CRM" subtitle="Manage your leads and track revenue." onPrev={onPrev}>
      <div className="relative group">
        
        <div className={`absolute left-0 top-0 bottom-6 w-32 bg-gradient-to-r from-[#f7f5f2] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? "opacity-100" : "opacity-0"}`} />
        <button 
          onClick={() => scroll("left")}
          className={`absolute left-0 top-[200px] -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/80 backdrop-blur border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-white transition-all scale-90 hover:scale-100 ${canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className={`absolute right-0 top-0 bottom-6 w-40 bg-gradient-to-l from-[#f7f5f2] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? "opacity-100" : "opacity-0"}`} />
        <button 
          onClick={() => scroll("right")}
          className={`absolute right-0 top-[200px] -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/80 backdrop-blur border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-white transition-all scale-90 hover:scale-100 ${canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide scroll-smooth relative"
        >
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.pipelineStage === stage.id);
            const stageValue = stageLeads.reduce((acc, l) => acc + (l.auditData?.estLostRevenuePerMonth || 0), 0);

            return (
              <div key={stage.id} className="min-w-[300px] flex-1 flex flex-col gap-3">
                <div className={`p-3 rounded-t-xl border-b-2 flex justify-between items-center ${stage.color}`}>
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${stage.textClass}`}>{stage.label}</h3>
                  <Badge variant="secondary" className="bg-white/60 text-foreground">{stageLeads.length}</Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono px-1">
                  Pipeline Value: ${stageValue.toLocaleString()}
                </div>
                
                <div className="flex flex-col gap-3 min-h-[200px] p-2 bg-muted/20 rounded-xl border border-dashed border-border">
                  {stageLeads.length === 0 && <div className="text-center text-xs text-muted-foreground py-10 opacity-50">No leads in this stage</div>}
                  
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className={`shadow-sm hover:shadow-md transition-shadow ${stage.cardClass}`}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold truncate">{lead.name}</CardTitle>
                        <div className="text-[10px] uppercase text-muted-foreground">{lead.category}</div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="text-xs font-mono font-medium text-primary flex items-center bg-primary/10 w-fit px-2 py-0.5 rounded-sm">
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          {lead.auditData?.estLostRevenuePerMonth?.toLocaleString() || 0}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
                          {STAGES.map(s => {
                            if (s.id === stage.id) return null;
                            return (
                              <button
                                key={s.id}
                                onClick={() => moveStage(lead.id, s.id)}
                                className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground bg-white/50 hover:bg-white border border-border/50 px-2 py-1 rounded transition-colors flex items-center shadow-sm"
                              >
                                Move to {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PhaseShell>
  );
}
