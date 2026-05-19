"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ToothProps {
  number: number;
  className?: string;
}

export function Tooth({ number, className }: ToothProps) {
  const [status, setStatus] = useState<"none" | "carie" | "restauracao" | "extraido">("none");

  const handleClick = () => {
    const statuses: Array<typeof status> = ["none", "carie", "restauracao", "extraido"];
    const nextIndex = (statuses.indexOf(status) + 1) % statuses.length;
    setStatus(statuses[nextIndex]);
  };

  const getStatusColor = () => {
    switch (status) {
      case "carie": return "fill-red-500 stroke-red-700";
      case "restauracao": return "fill-blue-500 stroke-blue-700";
      case "extraido": return "fill-slate-800 stroke-slate-900 opacity-20";
      default: return "fill-white stroke-slate-300 hover:fill-slate-50";
    }
  };

  return (
    <div 
      className={cn("flex flex-col items-center gap-1 cursor-pointer transition-all", className)}
      onClick={handleClick}
    >
      <span className="text-[12px] font-bold text-slate-400">{number}</span>
      <svg width="48" height="58" viewBox="0 0 36 44" className="transition-colors">
        {/* Simplified Tooth Shape */}
        <path 
          d="M18 2C10 2 4 6 4 14C4 22 8 28 10 38C10.5 41 12 42 14 42C16 42 17 40 18 38C19 40 20 42 22 42C24 42 25.5 41 26 38C28 28 32 22 32 14C32 6 26 2 18 2Z" 
          className={cn("stroke-2", getStatusColor())}
        />
        {/* Occlusal Surface */}
        <rect x="12" y="10" width="12" height="12" rx="2" className="fill-slate-100/50 stroke-slate-300" />
      </svg>
      {status !== "none" && (
        <span className={cn(
          "text-[8px] font-bold uppercase px-1 rounded",
          status === 'carie' ? "bg-red-100 text-red-700" :
          status === 'restauracao' ? "bg-blue-100 text-blue-700" :
          "bg-slate-800 text-white"
        )}>
          {status}
        </span>
      )}
    </div>
  );
}
