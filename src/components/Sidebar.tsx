"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  DollarSign, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Stethoscope, label: "Odontograma", href: "/" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: Users, label: "Pacientes", href: "/pacientes" },
  { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState({ name: "Doutor(a)", cro: "---" });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/configuracoes/perfil");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || "Doutor(a)",
            cro: data.cro || "---"
          });
        }
      } catch (err) {
        console.error("Failed to load profile in sidebar:", err);
      }
    }
    loadProfile();
    
    // Escuta por mudanças no perfil (opcional, para atualizar em tempo real ao salvar nas configs)
    window.addEventListener('profile-updated', loadProfile);
    return () => window.removeEventListener('profile-updated', loadProfile);
  }, []);

  return (
    <aside 
      className={cn(
        "bg-slate-900 text-white h-screen transition-all duration-300 flex flex-col sticky top-0 left-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="rounded-md overflow-hidden bg-white/5">
              <Image 
                src="/AppIcone.png" 
                alt="OdontOC Logo" 
                width={32} 
                height={32} 
                className="object-contain scale-[1.1]"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-400">
              Odont<span className="text-white">OC</span>
            </span>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <div className="rounded-md overflow-hidden bg-white/5">
              <Image 
                src="/AppIcone.png" 
                alt="OdontOC Logo" 
                width={28} 
                height={28} 
                className="object-contain scale-[1.1]"
              />
            </div>
          </div>
        )}
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors ml-auto"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="px-3 mb-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={22} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400")} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-black text-white shrink-0 uppercase tracking-tighter text-xs">
            CC
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight uppercase text-slate-100 line-clamp-2">
                {profile.name}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                CRO: {profile.cro}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
