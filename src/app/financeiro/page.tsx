"use client";

import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Loader2,
  TrendingUp,
  CreditCard,
  History,
  Plus,
  X
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    value: "",
    type: "expense", // income | expense
    professionalId: "1",
    paymentMethodId: "4" // Dinheiro padrão
  });

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financeiro?startDate=${startDate}&endDate=${endDate}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  useEffect(() => {
    async function loadCatalog() {
      const res = await fetch('/api/catalogo');
      const result = await res.json();
      setCatalog(result);
    }
    loadCatalog();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSave = async () => {
    if (!formData.description || !formData.value) return;
    setSaving(true);
    try {
      const res = await fetch('/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value.replace(/\D/g, '')) / 100
        })
      });
      if (res.ok) {
        setShowNewModal(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: "",
          value: "",
          type: "expense",
          professionalId: "1",
          paymentMethodId: "4"
        });
        fetchFinance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrencyInput = (val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) return "";
    const floatVal = parseFloat(numericVal) / 100;
    return floatVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Financeiro</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de caixa e faturamento</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
             <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 px-3 py-2 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
             />
             <div className="w-px h-4 bg-slate-300 self-center"></div>
             <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 px-3 py-2 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Plus size={16} />
            Lançar Movimentação
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                 <ArrowUpCircle size={24} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">Entradas</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Bruto</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{loading ? "---" : formatCurrency(data?.summary?.income || 0)}</h2>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                 <ArrowDownCircle size={24} />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">Saídas</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custos / Despesas</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{loading ? "---" : formatCurrency(data?.summary?.expenses || 0)}</h2>
           </div>
        </div>

        <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl shadow-blue-100 space-y-4">
           <div className="flex items-center justify-between">
              <div className="p-3 bg-white/20 text-white rounded-2xl">
                 <Wallet size={24} />
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">Saldo</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Lucro Líquido</p>
              <h2 className="text-2xl font-black text-white mt-1">{loading ? "---" : formatCurrency(data?.summary?.balance || 0)}</h2>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <History size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-900 uppercase text-[12px] tracking-widest">Movimentações Recentes</h3>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Filtrar descrição..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none w-64 focus:bg-white transition-all"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : data?.transactions?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <TrendingUp size={64} className="text-slate-300 mb-4" />
               <p className="font-black uppercase text-xs tracking-widest">Sem movimentações no período</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-slate-50">
                 <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4 text-left">Data</th>
                    <th className="px-8 py-4 text-left">Descrição</th>
                    <th className="px-8 py-4 text-left">Origem / Destino</th>
                    <th className="px-8 py-4 text-left">Tipo de Pagto</th>
                    <th className="px-8 py-4 text-right">Valor</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {data?.transactions?.map((t: any) => (
                   <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                           {new Date(t.date).toLocaleDateString('pt-BR')}
                         </span>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-xs font-bold text-slate-800 uppercase leading-snug">{t.description || "Pagamento de Procedimento"}</p>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-white transition-all uppercase">
                               {(t.patientName || t.professionalName || t.source === 'income' ? 'P' : 'C')[0]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[150px]">
                               {t.patientName || t.professionalName || "Clínica"}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-1.5 text-slate-500">
                            <CreditCard size={12} />
                            <span className="text-[10px] font-black uppercase tracking-tight">{t.paymentMethod || "---"}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <span className={cn(
                           "text-xs font-black",
                           t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                         )}>
                            {t.type === 'income' ? "+" : "-"} {formatCurrency(parseFloat(t.value))}
                         </span>
                      </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg"><Plus size={20} /></div>
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-900">Novo Lançamento</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registre uma nova entrada ou saída</p>
                    </div>
                 </div>
                 <button onClick={() => setShowNewModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setFormData({...formData, type: 'expense'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
                      )}
                    >
                      <ArrowDownCircle size={14} className="inline mr-2" /> Despesa
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, type: 'income'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
                      )}
                    >
                      <ArrowUpCircle size={14} className="inline mr-2" /> Entrada
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                       <input 
                        type="date" 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label>
                       <input 
                        type="text" 
                        placeholder="R$ 0,00"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                        value={formData.value}
                        onChange={e => setFormData({...formData, value: formatCurrencyInput(e.target.value)})}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Pagamento Aluguel, Compra de Material..."
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de Pagto</label>
                       <select 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                        value={formData.paymentMethodId}
                        onChange={e => setFormData({...formData, paymentMethodId: e.target.value})}
                       >
                          {catalog?.payments?.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
                       <select 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                        value={formData.professionalId}
                        onChange={e => setFormData({...formData, professionalId: e.target.value})}
                       >
                          {catalog?.professionals?.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                 <button 
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                 >
                   Cancelar
                 </button>
                 <button 
                  onClick={handleSave}
                  disabled={saving || !formData.description || !formData.value}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {saving ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Lançamento"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
