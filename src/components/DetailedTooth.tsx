"use client";

import { cn } from "@/lib/utils";

export type ToothStatus = "healthy" | "caries" | "restoration" | "absent" | "prosthesis";

interface ToothProps {
  number: number;
  status?: ToothStatus;
  isSelected?: boolean;
  surfaces?: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    center: boolean;
  };
  className?: string;
  onSelect?: (number: number) => void;
  onChange?: (number: number, status: ToothStatus, surfaces: any) => void;
}

const getIconPath = (number: number) => {
  if ([11, 12, 21, 22, 31, 32, 41, 42].includes(number)) return `/icones/incisors ${number}.png`;
  if ([13, 23, 33, 43].includes(number)) {
     if (number === 13 || number === 23) return `/icones/canino ${number}.png`;
     return `/icones/canine ${number}.png`;
  }
  if ([14, 15, 24, 25, 34, 35, 44, 45].includes(number)) return `/icones/premolar ${number}.png`;
  if ([16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48].includes(number)) return `/icones/molar ${number}.png`;
  return "/icones/Dente-TOTO.png";
};

export function DetailedTooth({ 
  number, 
  status = "healthy", 
  isSelected = false, 
  surfaces, 
  className, 
  onSelect, 
  onChange 
}: ToothProps) {
  
  const safeStatus = status || "healthy";
  const safeSurfaces = {
    top: surfaces?.top ?? false,
    bottom: surfaces?.bottom ?? false,
    left: surfaces?.left ?? false,
    right: surfaces?.right ?? false,
    center: surfaces?.center ?? false
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses: ToothStatus[] = ["healthy", "caries", "restoration", "absent", "prosthesis"];
    const nextIndex = (statuses.indexOf(safeStatus) + 1) % statuses.length;
    if (onChange) onChange(number, statuses[nextIndex], safeSurfaces);
    if (onSelect) onSelect(number);
  };

  const toggleSurface = (e: React.MouseEvent, surface: keyof typeof safeSurfaces) => {
    e.stopPropagation();
    if (onChange) {
      onChange(number, safeStatus, { ...safeSurfaces, [surface]: !safeSurfaces[surface] });
    }
    if (onSelect) onSelect(number);
  };

  const iconPath = getIconPath(number);

  return (
    <div 
      className={cn("flex flex-col items-center select-none w-[44px] shrink-0", className)}
      onClick={() => onSelect?.(number)}
    >
      <span className={cn(
        "text-[10px] font-black mb-0.5 transition-colors",
        isSelected ? "text-blue-600" : "text-slate-400"
      )}>{number}</span>
      
      <div 
        className={cn(
          "relative w-[38px] h-[48px] flex items-center justify-center border transition-all p-1 cursor-pointer rounded-[10px] shadow-sm",
          isSelected ? "ring-2 ring-blue-500 ring-offset-1 z-20 scale-105" : "",
          safeStatus === "healthy" ? "bg-white border-slate-200" :
          safeStatus === "caries" ? "bg-rose-50 border-rose-200" :
          safeStatus === "restoration" ? "bg-blue-50 border-blue-200" :
          safeStatus === "prosthesis" ? "bg-amber-50 border-amber-200" :
          "bg-slate-100 border-slate-300"
        )}
        onClick={cycleStatus}
      >
        {safeStatus === "absent" ? (
          <div className="text-rose-500 font-black text-xl">X</div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={iconPath} 
              alt={`Dente ${number}`} 
              className={cn(
                "max-w-full max-h-full object-contain transition-all duration-300",
                safeStatus === "caries" && "sepia brightness-50 hue-rotate-[320deg] saturate-[5]",
                safeStatus === "restoration" && "sepia brightness-75 hue-rotate-[180deg] saturate-[3]",
                safeStatus === "prosthesis" && "sepia brightness-90 hue-rotate-[40deg] saturate-[2]"
              )}
            />
          </div>
        )}
      </div>

      {/* Professional Surface Selector (Odontogram Envelope) */}
      <div className="mt-1.5 relative w-[34px] h-[34px] rounded-md overflow-hidden bg-white border border-slate-300 shadow-sm shrink-0">
        <div 
          className={cn("absolute inset-0 transition-colors cursor-pointer", safeSurfaces.top ? "bg-blue-500" : "bg-slate-100 hover:bg-slate-200")}
          style={{ clipPath: "polygon(0 0, 100% 0, 70% 30%, 30% 30%)" }}
          onClick={(e) => toggleSurface(e, 'top')}
        />
        <div 
          className={cn("absolute inset-0 transition-colors cursor-pointer", safeSurfaces.right ? "bg-blue-500" : "bg-slate-100 hover:bg-slate-200")}
          style={{ clipPath: "polygon(100% 0, 100% 100%, 70% 70%, 70% 30%)" }}
          onClick={(e) => toggleSurface(e, 'right')}
        />
        <div 
          className={cn("absolute inset-0 transition-colors cursor-pointer", safeSurfaces.bottom ? "bg-blue-500" : "bg-slate-100 hover:bg-slate-200")}
          style={{ clipPath: "polygon(30% 70%, 70% 70%, 100% 100%, 0 100%)" }}
          onClick={(e) => toggleSurface(e, 'bottom')}
        />
        <div 
          className={cn("absolute inset-0 transition-colors cursor-pointer", safeSurfaces.left ? "bg-blue-500" : "bg-slate-100 hover:bg-slate-200")}
          style={{ clipPath: "polygon(0 0, 30% 30%, 30% 70%, 0 100%)" }}
          onClick={(e) => toggleSurface(e, 'left')}
        />
        <div 
          className={cn("absolute inset-0 transition-colors cursor-pointer", safeSurfaces.center ? "bg-blue-500" : "bg-slate-100 hover:bg-slate-200")}
          style={{ clipPath: "polygon(30% 30%, 70% 30%, 70% 70%, 30% 70%)" }}
          onClick={(e) => toggleSurface(e, 'center')}
        />
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <line x1="0" y1="0" x2="30" y2="30" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
             <line x1="100" y1="0" x2="70" y2="30" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
             <line x1="100" y1="100" x2="70" y2="70" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
             <line x1="0" y1="100" x2="30" y2="70" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
             <rect x="30" y="30" width="40" height="40" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className={cn(
        "text-[10px] font-black uppercase mt-1 px-1.5 rounded-full leading-none tracking-tighter",
        safeStatus === "healthy" && "opacity-0",
        safeStatus === "absent" && "bg-rose-100 text-rose-700",
        safeStatus === "caries" && "bg-rose-600 text-white",
        safeStatus === "restoration" && "bg-blue-600 text-white",
        safeStatus === "prosthesis" && "bg-amber-600 text-white"
      )}>
        {safeStatus.slice(0, 3)}
      </div>
    </div>
  );
}
