"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function PhaseShell({
  title,
  subtitle,
  children,
  onPrev,
  onNext,
  nextLabel = "Next phase",
  nextDisabled = false,
  prevDisabled = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-4 sm:px-6 pb-32"
    >
      <header className="mb-10 overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="text-5xl sm:text-7xl text-foreground leading-[0.95] tracking-[-0.04em]"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 900 }}
        >
          {title.split('—').map((part, i, arr) => (
            <span key={i}>
              {i === 1 ? (
                <span className="text-[color:var(--accent-red)] italic font-[600] tracking-[-0.02em] pr-1">{part}</span>
              ) : (
                part
              )}
              {i < arr.length - 1 && "—"}
            </span>
          ))}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="text-muted-foreground mt-4 text-base max-w-2xl leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </header>
      <div>{children}</div>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <motion.div
          layout
          className="pointer-events-auto bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full p-1.5 flex items-center gap-1"
        >
          {onPrev && (
            <Button
              variant="ghost"
              onClick={onPrev}
              disabled={prevDisabled}
              className="rounded-full h-11 px-5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" strokeWidth={2.5} /> Back
            </Button>
          )}

          {onPrev && onNext && <div className="w-[1px] h-5 bg-zinc-200 mx-1" />}

          {onNext && (
            <Button
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-full h-11 px-8 font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              {nextLabel} <ChevronRight className="h-4 w-4 ml-1.5" strokeWidth={2.5} />
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
