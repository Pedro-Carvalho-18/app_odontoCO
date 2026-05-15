"use client";

import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  LogOut, 
  Camera,
  ChevronRight,
  Stethoscope,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerfilPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações de Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais e da clínica.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          {[
            { id: "perfil", label: "Meu Perfil", icon: User, active: true },
            { id: "clinica", label: "Dados da Clínica", icon: Building },
            { id: "seguranca", label: "Segurança", icon: Shield },
            { id: "notificacoes", label: "Notificações", icon: Bell },
            { id: "banco", label: "Banco de Dados", icon: Database },
          ].map(item => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                item.active 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
              <ChevronRight size={16} className={item.active ? "opacity-100" : "opacity-0"} />
            </button>
          ))}
          
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all mt-8">
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
                  <User size={40} />
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                  <Camera size={16} />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-900">Configuração do Profissional</h2>
                <p className="text-sm text-slate-500 mb-3">Cirurgião Dentista | Registro Ativo</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Ortodontia</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Implantes</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" placeholder="Digite seu nome..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CRO / Número Registro</label>
                <input type="text" defaultValue="123456" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Profissional</label>
                <input type="email" defaultValue="dr.ricardo@easyodonto.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <input type="text" defaultValue="(11) 98765-4321" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 border-b-4 border-blue-800 hover:translate-y-[1px] hover:border-b-2 transition-all active:scale-95">
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* Practice Info */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Stethoscope size={18} className="text-blue-600" />
              Especialidades e Atendimento
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {["Clínica Geral", "Ortodontia", "Endodontia", "Estética", "Implantes"].map(tag => (
                  <button key={tag} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                    {tag}
                  </button>
                ))}
                <button className="px-4 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all">
                  + Nova Especialidade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
