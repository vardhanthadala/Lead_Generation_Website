"use client";

import React, { forwardRef } from "react";
import type { RankedLead } from "@/lib/types";
import { AlertTriangle, TrendingDown, Rocket, CheckCircle2, MonitorX, Globe, Code, Zap, BarChart, ChevronRight, Lock } from "lucide-react";
import Image from "next/image";

interface PdfReportProps {
  lead: RankedLead;
}

// A4 proportions: 794px by 1123px at 96 PPI per page
export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportProps>(({ lead }, ref) => {
  const audit = lead.audit;
  if (!audit) return null;

  const formattedRevenue = "$" + audit.estLostRevenuePerMonth.toLocaleString("en-US");

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div ref={ref} className="flex flex-col bg-zinc-100" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* PAGE 1: DEXZE INTRODUCTION */}
        <div className="w-[794px] h-[1123px] bg-zinc-950 text-white p-16 flex flex-col justify-between relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-rose-600 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-4 mb-16 border-b border-zinc-800 pb-8">
              <img src="/logo.png" alt="Dexze Logo" className="h-16 object-contain" />
              <div>
                <h1 className="text-3xl font-black tracking-tighter">DEXZE</h1>
                <p className="text-sm font-medium text-rose-500 uppercase tracking-widest">Digital Excellence</p>
              </div>
            </div>

            <h2 className="text-5xl font-black leading-[1.1] mb-6">
              Digital Transformation &<br />
              <span className="text-rose-500">Custom Web Solutions</span>
            </h2>
            
            <p className="text-xl text-zinc-400 mb-16 leading-relaxed max-w-xl">
              We specialize in engineering high-performance, conversion-optimized digital infrastructure for elite B2B and B2C brands across the United States.
            </p>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Our Core Capabilities</h3>
              
              <div className="flex items-start gap-4">
                <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <Code className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">Custom Next.js & React Development</h4>
                  <p className="text-zinc-400 text-sm">We abandon slow, bloated templates (WordPress/Wix) for lightning-fast, custom-coded applications.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <Globe className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">Technical SEO Architecture</h4>
                  <p className="text-zinc-400 text-sm">Deep semantic structuring, schema markup, and Core Web Vitals optimization to dominate search rankings.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <Zap className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">Conversion Rate Optimization (CRO)</h4>
                  <p className="text-zinc-400 text-sm">Strategic UI/UX design scientifically proven to convert casual traffic into high-ticket clients.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex justify-between items-center text-sm font-medium text-zinc-500">
            <div>PREPARED EXCLUSIVELY FOR: <span className="text-white font-bold">{lead.name.toUpperCase()}</span></div>
            <div>dexze.com</div>
          </div>
        </div>


        {/* PAGE 2: EXECUTIVE SUMMARY */}
        <div className="w-[794px] h-[1123px] bg-white text-zinc-900 p-12 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-4 mb-6">
              <div>
                <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-1">Digital Presence & Revenue Impact Report</h4>
                <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">{lead.name}</h1>
                <p className="text-sm text-zinc-500 mt-2 font-medium">{lead.category} • {lead.city}</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 font-bold text-[10px] tracking-widest mb-2">
                  <AlertTriangle className="h-3 w-3" /> URGENT: ACTION REQUIRED
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Executive Summary</h2>
              <p className="text-base text-zinc-700 leading-relaxed">
                Our proprietary AI infrastructure has conducted a deep technical audit of your current digital presence. While your business maintains a strong operational reputation ({lead.rating} stars across {lead.reviewsCount} reviews), your underlying web technology is actively causing immense friction in your conversion funnel. 
                <br/><br/>
                This report outlines the specific technical vulnerabilities causing you to lose high-value clients to your competitors.
              </p>
            </div>

            {/* CRITICAL METRICS ROW */}
            <h2 className="text-xl font-bold mb-4">Financial Impact Analysis</h2>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-2xl p-6 text-white shadow-2xl border border-red-400">
                <div className="flex items-center gap-3 opacity-90 mb-3">
                  <TrendingDown className="h-6 w-6" />
                  <h3 className="text-base font-bold uppercase tracking-wider">Estimated Revenue Leakage</h3>
                </div>
                <div className="text-6xl font-black tracking-tighter mb-3">{formattedRevenue}</div>
                <p className="text-sm opacity-90 font-medium max-w-lg">
                  Estimated monthly capital lost due to slow load times, poor SEO architecture, and outdated UI/UX driving traffic away.
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-6 border-2 border-zinc-200 shadow-sm flex flex-col justify-center">
                <h3 className="text-base font-bold text-zinc-500 uppercase tracking-wider mb-3">Overall Digital Competitiveness Score</h3>
                <div className="flex items-end gap-2">
                  <div className="text-5xl font-black text-zinc-900">{audit.conversionScore}</div>
                  <div className="text-xl font-bold text-zinc-400 mb-1">/ 100</div>
                </div>
                <div className="w-full bg-zinc-200 h-3 rounded-full mt-4 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${audit.conversionScore}%` }}></div>
                </div>
                <p className="mt-3 text-sm text-zinc-500 font-medium">Scores below 80 indicate severe structural disadvantages against local competitors.</p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t-2 border-zinc-200 pt-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-400">
              <Lock className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Proprietary Diagnostic Report</span>
            </div>
            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">PAGE 2 OF 4</div>
          </div>
        </div>


        {/* PAGE 3: DEEP AUDIT */}
        <div className="w-[794px] h-[1123px] bg-white text-zinc-900 p-16 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="mb-12 border-b-2 border-zinc-200 pb-8">
              <h4 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-2">Diagnostic Data</h4>
              <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Core Infrastructure Vulnerabilities</h1>
            </div>

            <div className="space-y-12">
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8">
                <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                  <MonitorX className="h-5 w-5" /> Detected Technology Stack
                </h4>
                <div className="bg-white border border-zinc-200 rounded-xl p-6 font-mono text-xl text-rose-600 font-bold mb-4">
                  {audit.techStack}
                </div>
                <p className="text-zinc-600">
                  Your current platform relies on consumer-grade templates or outdated infrastructure. This results in bloated code, slow rendering speeds, and rigid design limitations that harm both user experience and Google search rankings.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8">
                <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4">Search Engine Optimization (SEO) Flaws</h4>
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-amber-900 mb-4">
                  <p className="text-lg font-medium leading-relaxed">
                    {audit.seoHealth}
                  </p>
                </div>
                <p className="text-zinc-600">
                  A lack of proper semantic HTML and modern Schema markup means Google struggles to index your services properly, rendering you invisible for highly-profitable search keywords.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase mb-6">UI/UX Modernity Rating</h4>
                  <div className="flex gap-2">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-16 flex-1 rounded-sm ${i < (audit.uiModernity || 5) ? ((audit.uiModernity || 5) < 5 ? "bg-red-500" : "bg-amber-500") : "bg-zinc-200"}`}
                      />
                    ))}
                  </div>
                  <div className="text-right mt-3 text-zinc-500 font-black text-xl">{audit.uiModernity || 5} / 10</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-rose-700 uppercase mb-3">Primary Revenue Bottleneck</h4>
                  <p className="text-xl font-bold text-rose-900 leading-snug">
                    "{audit.biggestGap}"
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="border-t-2 border-zinc-200 pt-6 flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="font-bold tracking-widest uppercase text-sm">Dexze Consulting</span>
            </div>
            <div className="text-sm font-bold text-zinc-400">PAGE 3 OF 4</div>
          </div>
        </div>

        {/* PAGE 4: REMEDIATION PLAN */}
        <div className="w-[794px] h-[1123px] bg-white text-zinc-900 p-16 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="mb-12 border-b-2 border-zinc-200 pb-8">
              <h4 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-2">The Solution</h4>
              <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Strategic Remediation Plan</h1>
            </div>

            <p className="text-xl text-zinc-700 leading-relaxed mb-10">
              To capture the {formattedRevenue} currently leaking from your digital funnel every month, we must abandon template-based builders and migrate to a custom-engineered software infrastructure.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-10 mb-12">
              <h2 className="text-2xl font-bold text-blue-950 mb-8">AI-Recommended Upgrades</h2>
              <ul className="space-y-6">
                {(audit.suggestedUpgrades || []).map((upgrade, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="bg-blue-600 rounded-full p-1.5 mt-1 shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl text-blue-900 font-medium leading-relaxed">{upgrade}</p>
                  </li>
                ))}
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Why Dexze?</h2>
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h4 className="font-bold text-lg mb-2">Unmatched Speed (Next.js)</h4>
                <p className="text-zinc-600">We build with the exact same technology stack used by Netflix, TikTok, and Nike, ensuring sub-second load times that drastically reduce bounce rates.</p>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">Conversion Architecture</h4>
                <p className="text-zinc-600">Every pixel is designed to drive the user toward your primary call-to-action, turning your website from an online brochure into an automated sales machine.</p>
              </div>
            </div>

            <div className="bg-zinc-950 text-white rounded-3xl p-10 text-center">
              <h2 className="text-2xl font-bold mb-4">Stop Losing Clients to Inferior Competitors</h2>
              <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
                Let's schedule a 15-minute discovery call to review these findings and discuss the exact timeline and ROI of rebuilding your digital infrastructure.
              </p>
              <div className="bg-rose-500 text-white font-bold py-4 px-8 rounded-full inline-flex items-center gap-2">
                Schedule Discovery Call <ChevronRight className="h-5 w-5" />
              </div>
            </div>

          </div>

          <div className="border-t-2 border-zinc-200 pt-6 flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="font-bold tracking-widest uppercase text-sm">Dexze Consulting</span>
            </div>
            <div className="text-sm font-bold text-zinc-400">PAGE 4 OF 4</div>
          </div>
        </div>


      </div>
    </div>
  );
});

PdfReportTemplate.displayName = "PdfReportTemplate";
