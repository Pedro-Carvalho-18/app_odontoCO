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
  X,
  Download,
  Check,
  Ban
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
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    value: "",
    type: "expense", // income | expense
    professionalId: "1",
    paymentMethodId: "4", // Dinheiro padrão
    patientId: null as string | null,
    patientName: ""
  });

  const [selectedProcedures, setSelectedProcedures] = useState<any[]>([]);

  const formatCurrencyInput = useCallback((val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) return "";
    const floatVal = parseFloat(numericVal) / 100;
    return floatVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, []);

  useEffect(() => {
    if (selectedProcedures.length > 0) {
      const description = selectedProcedures.map(p => p.name).join(" + ");
      const totalValue = selectedProcedures.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
      
      setFormData(prev => ({
        ...prev,
        description,
        value: totalValue > 0 ? formatCurrencyInput((totalValue * 100).toString()) : prev.value
      }));
    }
  }, [selectedProcedures, formatCurrencyInput]);

  const handleProcedureToggle = (e: React.MouseEvent, proc: any) => {
    e.preventDefault();
    setSelectedProcedures(prev => {
      const isSelected = prev.find(p => p.id === proc.id);
      if (isSelected) {
        return prev.filter(p => p.id !== proc.id);
      }
      return [...prev, proc];
    });
  };

  // Filter State
  const [filterMode, setFilterMode] = useState<"all" | "income" | "expense" | "pending">("all");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

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

  const fetchPatients = async (query = "") => {
    setLoadingPatients(true);
    try {
      const res = await fetch(`/api/pacientes?q=${query}&limit=5`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (patientSearch.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchPatients(patientSearch);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else if (patientSearch.length === 0) {
      setPatients([]);
    }
  }, [patientSearch]);

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
          paymentMethodId: "4",
          patientId: null,
          patientName: ""
        });
        setPatientSearch("");
        fetchFinance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const res = await fetch(`/api/financeiro?id=${id}&type=${type}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchFinance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPaid = async (item: any) => {
    if (!confirm(`Confirmar recebimento de ${formatCurrency(item.value)}? Isso gerará uma entrada no caixa.`)) return;
    // O ID de pendência é formatado como 'pending-item-counter-nroTra-nroPac' ou agora inclui nroPar
    // Precisamos de uma forma robusta de pegar os dados
    const parts = item.id.split('-');
    // O formato atual é 'pending-item-counter-nroTra-nroPac'
    // Mas item tem nroTra, nroPac e nroPar se vier da API atualizada
    const nroTra = item.nroTra || parts[parts.length - 2];
    const nroPac = item.nroPac || parts[parts.length - 1];
    const nroPar = item.nroPar || "1";

    try {
      const res = await fetch('/api/financeiro/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nroTra, 
          nroPac,
          nroPar,
          value: item.value,
          description: item.description.replace('A RECEBER: LANÇAMENTO: ', 'Pg ').replace('A RECEBER: ', 'Pg ')
        })
      });
      if (res.ok) fetchFinance();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelPending = async (item: any) => {
    if (!confirm("Deseja realmente remover esta pendência? Isso anulará o débito original.")) return;
    const parts = item.id.split('-');
    const nroTra = parts[parts.length - 2];
    const nroPac = parts[parts.length - 1];

    try {
      const res = await fetch('/api/financeiro/cancelar-pendencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nroTra, nroPac })
      });
      if (res.ok) fetchFinance();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    // Header
    const headers = ["Data", "Descricao", "Paciente/Profissional", "Tipo", "Forma Pagto", "Valor"];
    
    // Rows
    const rows = filteredTransactions.map((t: any) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description || "Pagamento",
      t.patientName || t.professionalName || "Clinica",
      t.type === 'income' ? "Entrada" : t.type === 'expense' ? "Saida" : "Pendente",
      t.paymentMethod || "---",
      parseFloat(t.value).toFixed(2).replace('.', ',')
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_financeiro_${startDate}_a_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = (() => {
    let list = filterMode === 'pending' ? (data?.pendingTransactions || []) : (data?.transactions || []);
    
    if (filterMode !== 'all' && filterMode !== 'pending') {
      list = list.filter((t: any) => t.type === filterMode);
    }
    
    if (descriptionFilter) {
      list = list.filter((t: any) => 
        t.description?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(descriptionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
        t.patientName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(descriptionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
      );
    }
    
    return list;
  })();

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-4 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-100">
            <DollarSign size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Financeiro</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Controle de caixa e faturamento</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
             <input 
              type="date" 
              className="bg-transparent border-none text-[9px] font-black uppercase text-slate-600 px-2 py-1.5 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
             />
             <div className="w-px h-3 bg-slate-300 self-center"></div>
             <input 
              type="date" 
              className="bg-transparent border-none text-[9px] font-black uppercase text-slate-600 px-2 py-1.5 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
             />
          </div>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={14} />
            Relatório
          </button>
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Plus size={14} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setFilterMode('income')}
          className={cn(
            "bg-white px-4 py-3 rounded-[24px] border transition-all text-left group",
            filterMode === 'income' ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-200 hover:border-emerald-200"
          )}
        >
           <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                 <ArrowUpCircle size={16} />
              </div>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Entradas</span>
           </div>
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faturamento Bruto</p>
              <h2 className="text-base font-black text-slate-900 mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.income || 0)}</h2>
           </div>
        </button>

        <button 
          onClick={() => setFilterMode('expense')}
          className={cn(
            "bg-white px-4 py-3 rounded-[24px] border transition-all text-left group",
            filterMode === 'expense' ? "border-rose-500 ring-4 ring-rose-50" : "border-slate-200 hover:border-rose-200"
          )}
        >
           <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
                 <ArrowDownCircle size={16} />
              </div>
              <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md">Saídas</span>
           </div>
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Custos / Despesas</p>
              <h2 className="text-base font-black text-slate-900 mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.expenses || 0)}</h2>
           </div>
        </button>

        <button 
          onClick={() => setFilterMode('all')}
          className={cn(
            "px-4 py-3 rounded-[24px] shadow-lg transition-all text-left group",
            filterMode === 'all' ? "bg-blue-600 text-white shadow-blue-200 ring-4 ring-blue-50" : "bg-white border border-slate-200 text-slate-900 hover:border-blue-200"
          )}
        >
           <div className="flex items-center justify-between mb-2">
              <div className={cn("p-1.5 rounded-lg group-hover:scale-110 transition-transform", filterMode === 'all' ? "bg-white/20" : "bg-blue-50 text-blue-600")}>
                 <Wallet size={16} />
              </div>
              <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", filterMode === 'all' ? "bg-white/10" : "bg-blue-50 text-blue-600")}>Saldo</span>
           </div>
           <div>
              <p className={cn("text-[8px] font-black uppercase tracking-widest", filterMode === 'all' ? "text-blue-100" : "text-slate-400")}>Lucro Líquido</p>
              <h2 className="text-base font-black mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.balance || 0)}</h2>
           </div>
        </button>

        <button 
          onClick={() => setFilterMode('pending')}
          className={cn(
            "px-4 py-3 rounded-[24px] border transition-all text-left group",
            filterMode === 'pending' ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100 ring-4 ring-amber-50" : "bg-amber-50 border-amber-100 text-slate-900 hover:border-amber-300"
          )}
        >
           <div className="flex items-center justify-between mb-2">
              <div className={cn("p-1.5 rounded-lg group-hover:scale-110 transition-transform", filterMode === 'pending' ? "bg-white/20" : "bg-white shadow-sm text-amber-600")}>
                 <TrendingUp size={16} />
              </div>
              <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", filterMode === 'pending' ? "bg-white/10 text-white" : "bg-amber-100 text-amber-700")}>A Receber</span>
           </div>
           <div>
              <p className={cn("text-[8px] font-black uppercase tracking-widest", filterMode === 'pending' ? "text-amber-100" : "text-amber-600/70")}>Saldo Pendente</p>
              <h2 className="text-base font-black mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.pending || 0)}</h2>
           </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <History size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-900 uppercase text-[12px] tracking-widest">
                {filterMode === 'all' && "Todas as Movimentações"}
                {filterMode === 'income' && "Apenas Entradas"}
                {filterMode === 'expense' && "Apenas Saídas"}
                {filterMode === 'pending' && "Previsão de Recebimentos"}
              </h3>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setFilterMode('all')} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", filterMode === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Tudo</button>
                 <button onClick={() => setFilterMode('income')} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", filterMode === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Entradas</button>
                 <button onClick={() => setFilterMode('expense')} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", filterMode === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Saídas</button>
                 <button onClick={() => setFilterMode('pending')} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", filterMode === 'pending' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>A Receber</button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filtrar por nome ou desc..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none w-64 focus:bg-white transition-all"
                  value={descriptionFilter}
                  onChange={e => setDescriptionFilter(e.target.value)}
                />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <TrendingUp size={64} className="text-slate-300 mb-4" />
               <p className="font-black uppercase text-xs tracking-widest">Nenhum registro encontrado</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="sticky top-0 bg-white border-b border-slate-50">
                 <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="w-24 px-4 py-4 text-left">Data</th>
                    <th className="px-4 py-4 text-left">Descrição</th>
                    <th className="w-48 px-4 py-4 text-left">Origem / Destino</th>
                    <th className="w-32 px-4 py-4 text-left">Tipo Pagto</th>
                    <th className="w-32 px-4 py-4 text-right">Valor</th>
                    <th className="w-20 px-4 py-4 text-center">Ações</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredTransactions.map((t: any, idx: number) => (
                   <tr 
                    key={t.id || `row-${filterMode}-${idx}`} 
                    onClick={() => setSelectedTransaction(t)}
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                   >
                      <td className="px-4 py-4">
                         <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg whitespace-nowrap">
                           {new Date(t.date).toLocaleDateString('pt-BR')}
                         </span>
                      </td>
                      <td className="px-4 py-4">
                         <p className={cn(
                            "text-[11px] font-bold uppercase leading-snug truncate",
                            t.type === 'pending' ? "text-amber-700/70" : "text-slate-800"
                         )} title={t.description}>{t.description || "Pagamento de Procedimento"}</p>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-2 overflow-hidden">
                            <div className="flex-shrink-0 w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 group-hover:bg-white transition-all uppercase">
                               {(t.patientName || t.professionalName || t.source === 'income' ? 'P' : 'C')[0]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase truncate">
                               {t.patientName || t.professionalName || "Clínica"}
                            </span>
                         </div>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-1.5 text-slate-500 overflow-hidden">
                            <CreditCard size={11} className="flex-shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-tight truncate">{t.paymentMethod || (t.type === 'pending' ? "PENDENTE" : "---")}</span>
                         </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                         <span className={cn(
                           "text-[11px] font-black whitespace-nowrap",
                           t.type === 'income' ? "text-emerald-600" : 
                           t.type === 'expense' ? "text-rose-600" : "text-amber-500"
                         )}>
                            {t.type === 'income' ? "+" : t.type === 'expense' ? "-" : "≈"} {formatCurrency(parseFloat(t.value))}
                         </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {filterMode !== 'pending' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.type); }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Excluir Lançamento"
                          >
                            <X size={14} />
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkPaid(t); }}
                              className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Marcar como Pago"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCancelPending(t); }}
                              className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Remover Pendência"
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        )}
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
              <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg"><Plus size={20} /></div>
                    <div>
                       <h3 className="text-[10px] font-black uppercase text-slate-900">Novo Lançamento</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registre uma nova entrada ou saída</p>
                    </div>                 </div>
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

                 {formData.type === 'income' && (
                    <div className="space-y-2 relative">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente (Opcional)</label>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="Buscar paciente por nome..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all"
                            value={formData.patientName || patientSearch}
                            onChange={e => {
                               setPatientSearch(e.target.value);
                               setFormData({...formData, patientName: e.target.value, patientId: null});
                               setShowPatientResults(true);
                            }}
                            onFocus={() => setShowPatientResults(true)}
                          />
                          {formData.patientId && (
                             <button 
                                onClick={() => {
                                   setFormData({...formData, patientId: null, patientName: ""});
                                   setPatientSearch("");
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-700"
                             >
                                <X size={16} />
                             </button>
                          )}
                       </div>

                       {showPatientResults && patients.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-[210] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-2">
                             {patients.map(p => (
                                <button 
                                   key={p.id}
                                   onClick={() => {
                                      setFormData({...formData, patientId: p.id, patientName: p.name});
                                      setPatientSearch(p.name);
                                      setShowPatientResults(false);
                                   }}
                                   className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0"
                                >
                                   <p className="text-xs font-black uppercase text-slate-700">{p.name}</p>
                                   <p className="text-[9px] font-bold text-slate-400">{p.cpf || "Sem CPF"}</p>
                                </button>
                             ))}
                          </div>
                       )}
                       
                       {loadingPatients && (
                          <div className="absolute top-full left-0 right-0 z-[210] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex justify-center">
                             <Loader2 size={16} className="animate-spin text-blue-600" />
                          </div>
                       )}
                    </div>
                 )}

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

                 {/* Procedure Multi-Selector */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Procedimentos (Soma automática)</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                       {catalog?.procedures?.map((p: any) => {
                          const isSelected = selectedProcedures.find(proc => proc.id === p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={(e) => handleProcedureToggle(e, p)}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all flex flex-col gap-0.5",
                                isSelected 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                                  : "bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200"
                              )}
                            >
                               <span className="text-[9px] font-black uppercase leading-tight truncate w-full">{p.name}</span>
                               <span className={cn("text-[9px] font-bold", isSelected ? "text-blue-100" : "text-slate-400")}>
                                 {formatCurrency(Number(p.price) || 0)}
                               </span>
                            </button>
                          );
                       })}
                    </div>
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
      {/* Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-lg rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl text-white shadow-lg",
                  selectedTransaction.type === 'income' ? "bg-emerald-500" : 
                  selectedTransaction.type === 'expense' ? "bg-rose-500" : "bg-amber-500"
                )}>
                  {selectedTransaction.type === 'income' ? <ArrowUpCircle size={20} /> : 
                   selectedTransaction.type === 'expense' ? <ArrowDownCircle size={20} /> : <TrendingUp size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900">Detalhes do Lançamento</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Informações completas do registro</p>
                </div>
              </div>
              <button onClick={() => setSelectedTransaction(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Completa</p>
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {selectedTransaction.description || "Sem descrição"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</p>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(selectedTransaction.date).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Registro</p>
                  <p className={cn(
                    "text-xl font-black",
                    selectedTransaction.type === 'income' ? "text-emerald-600" : 
                    selectedTransaction.type === 'expense' ? "text-rose-600" : "text-amber-500"
                  )}>
                    {selectedTransaction.type === 'income' ? "+" : selectedTransaction.type === 'expense' ? "-" : "≈"} 
                    {formatCurrency(parseFloat(selectedTransaction.value))}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedTransaction.type === 'income' || selectedTransaction.type === 'pending' ? 'Paciente' : 'Profissional / Favorecido'}
                  </p>
                  <p className="text-sm font-bold text-slate-700 uppercase">
                    {selectedTransaction.patientName || selectedTransaction.professionalName || "Clínica Geral"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagto</p>
                  <div className="flex items-center gap-2 text-slate-700 font-bold uppercase text-xs">
                    <CreditCard size={14} className="text-slate-400" />
                    {selectedTransaction.paymentMethod || (selectedTransaction.type === 'pending' ? "Pendente" : "Não informado")}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
