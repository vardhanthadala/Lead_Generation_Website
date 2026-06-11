import type { Lead, AuditResult, RankedLead } from "./types";

const HIGH_FIT_NICHES = ["dentist", "salon", "clinic", "spa", "gym", "restaurant", "cafe", "lawyer", "doctor", "coaching"];

export function scoreLead(lead: Lead, audit: AuditResult): RankedLead {
  return {
    ...lead,
    audit,
    score: audit.conversionScore ?? 50,
    scoreBreakdown: {
      noOrBadSite: 0,
      reviewVolume: 0,
      rating: 0,
      recency: 0,
      reachable: 0,
      industryFit: 0,
    },
  };
}
