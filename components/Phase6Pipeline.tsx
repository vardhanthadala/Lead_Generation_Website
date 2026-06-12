"use client";

import { useEffect, useState } from "react";
import { PhaseShell } from "./PhaseShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type PipelineStage = "audited" | "contacted" | "demo_built" | "closed_won" | "closed_lost";

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "audited", label: "Audited", color: "bg-zinc-100 border-zinc-200" },
  { id: "contacted", label: "Contacted", color: "bg-blue-50 border-blue-200" },
  { id: "demo_built", label: "Demo Sent", color: "bg-amber-50 border-amber-200" },
  { id: "closed_won", label: "Closed - Won", color: "bg-emerald-50 border-emerald-200" },
  { id: "closed_lost", label: "Closed - Lost", color: "bg-red-50 border-red-200" },
];

export function Phase6Pipeline({ onPrev }: { onPrev: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

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
    // Optimistic update
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
      fetchLeads(); // Revert on failure
    }
  }

  if (loading) {
    return (
      <PhaseShell title="Pipeline CRM" subtitle="Manage your leads and track revenue." onPrev={onPrev}>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PhaseShell>
    );
  }

  return (
    <PhaseShell title="Pipeline CRM" subtitle="Manage your leads and track revenue." onPrev={onPrev}>
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter(l => l.pipelineStage === stage.id);
          const stageValue = stageLeads.reduce((acc, l) => acc + (l.auditData?.estLostRevenuePerMonth || 0), 0);

          return (
            <div key={stage.id} className="min-w-[300px] flex-1 flex flex-col gap-3">
              <div className={`p-3 rounded-t-xl border-b-2 flex justify-between items-center ${stage.color}`}>
                <h3 className="font-bold text-sm uppercase tracking-wider">{stage.label}</h3>
                <Badge variant="secondary">{stageLeads.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground font-mono px-1">
                Pipeline Value: ${stageValue.toLocaleString()}
              </div>
              
              <div className="flex flex-col gap-3 min-h-[200px] p-2 bg-muted/20 rounded-xl border border-dashed border-border">
                {stageLeads.length === 0 && <div className="text-center text-xs text-muted-foreground py-10 opacity-50">No leads in this stage</div>}
                
                {stageLeads.map((lead) => (
                  <Card key={lead.id} className="bg-background shadow-sm hover:shadow-md transition-shadow">
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
                              className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-zinc-200 px-2 py-1 rounded transition-colors flex items-center"
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
    </PhaseShell>
  );
}
