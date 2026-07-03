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
  Ban,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useEffect, useCallback, Fragment } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function FinanceiroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);

  // Global Patient Filter States
  const [globalPatientFilter, setGlobalPatientFilter] = useState<any>(null);
  const [globalPatientSearch, setGlobalPatientSearch] = useState("");
  const [globalPatientResults, setGlobalPatientResults] = useState<any[]>([]);
  const [showGlobalPatientResults, setShowGlobalPatientResults] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [patientInterventions, setPatientInterventions] = useState<any[]>([]);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingValueText, setEditingValueText] = useState("");
  const [payFormValue, setPayFormValue] = useState("");
  const [payFormMethodId, setPayFormMethodId] = useState("1");
  const [payFormObs, setPayFormObs] = useState("");
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
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
    type: "income", // income | expense
    professionalId: "1",
    paymentMethodId: "4", // Dinheiro padrão
    patientId: null as string | null,
    patientName: ""
  });
  const [patientActiveInterventions, setPatientActiveInterventions] = useState<any[]>([]);
  const [selectedInterventionId, setSelectedInterventionId] = useState<string>("");
  const [newProcedureName, setNewProcedureName] = useState<string>("");
  const [newProcedureValue, setNewProcedureValue] = useState<string>("");
  const [loadingPatientTra, setLoadingPatientTra] = useState<boolean>(false);
  const [showProceduresGrid, setShowProceduresGrid] = useState<boolean>(false);

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

  const fetchGlobalPatientResults = async (query = "") => {
    try {
      const res = await fetch(`/api/pacientes?q=${query}&limit=5`);
      const data = await res.json();
      setGlobalPatientResults(data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (globalPatientSearch.length >= 2 && !globalPatientFilter) {
      const delayDebounceFn = setTimeout(() => {
        fetchGlobalPatientResults(globalPatientSearch);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else if (globalPatientSearch.length === 0) {
      setGlobalPatientResults([]);
    }
  }, [globalPatientSearch, globalPatientFilter]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowGlobalPatientResults(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const loadPatientData = useCallback(async () => {
    if (!globalPatientFilter) return;
    setLoadingPatientData(true);
    try {
      const hRes = await fetch(`/api/pacientes/${globalPatientFilter.id}/historico`);
      const hData = await hRes.json();
      setPatientHistory(hData.history);
      setPatientInterventions(hData.interventions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatientData(false);
    }
  }, [globalPatientFilter]);

  useEffect(() => {
    if (globalPatientFilter) {
      loadPatientData();
    } else {
      setPatientHistory(null);
      setPatientInterventions([]);
    }
    setSelectedIntervention(null);
  }, [globalPatientFilter, loadPatientData]);

  const reloadData = useCallback(async () => {
    let freshList: any[] = [];
    if (globalPatientFilter) {
      setLoadingPatientData(true);
      try {
        const hRes = await fetch(`/api/pacientes/${globalPatientFilter.id}/historico`);
        const hData = await hRes.json();
        setPatientHistory(hData.history);
        setPatientInterventions(hData.interventions || []);
        freshList = hData.interventions || [];
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPatientData(false);
      }
    }
    
    try {
      const res = await fetch(`/api/financeiro?startDate=${startDate}&endDate=${endDate}`);
      const result = await res.json();
      setData(result);
      if (!globalPatientFilter) {
        freshList = result.interventions || [];
      }
    } catch (err) {
      console.error(err);
    }

    if (selectedIntervention) {
      const freshItem = freshList.find((item: any) => item.id === selectedIntervention.id);
      if (freshItem) {
        setSelectedIntervention(freshItem);
      } else {
        setSelectedIntervention(null);
      }
    }
  }, [globalPatientFilter, startDate, endDate, selectedIntervention]);

  const handleSaveValue = async (inter: any) => {
    const parsedVal = parseFloat(editingValueText.replace(",", "."));
    if (isNaN(parsedVal)) return;

    setSaving(true);
    try {
      const totalInst = Number(inter.totalInstallments || inter.installments || 1);
      const nroPac = inter.nroPac || globalPatientFilter?.id;
      
      await fetch(`/api/pacientes/${nroPac}/historico/atualizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inter,
          value: parsedVal,
          totalInstallments: totalInst,
        }),
      });
      setEditingValueId(null);
      await reloadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (inter: any, newStatus: string) => {
    const totalInst = Number(inter.totalInstallments || inter.installments || 1);
    const paidInst = Number(inter.paidInstallments || 0);
    const newPaidInst = newStatus === "Concluído" ? totalInst : paidInst;
    const nroPac = inter.nroPac || globalPatientFilter?.id;

    setSaving(true);
    try {
      await fetch(`/api/pacientes/${nroPac}/historico/atualizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inter, status: newStatus, paidInstallments: newPaidInst })
      });
      await reloadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: "",
      value: "",
      type: "income",
      professionalId: "1",
      paymentMethodId: "4",
      patientId: null,
      patientName: ""
    });
    setPatientSearch("");
    setPatientActiveInterventions([]);
    setSelectedInterventionId("");
    setNewProcedureName("");
    setNewProcedureValue("");
  };

  const handleSave = async () => {
    if (!formData.description || !formData.value) return;
    setSaving(true);
    try {
      const paymentVal = parseFloat(formData.value.replace(/\D/g, '')) / 100;
      
      if (formData.type === 'income' && formData.patientId) {
        if (selectedInterventionId !== 'new') {
          const selectedInter = patientActiveInterventions.find(i => String(i.id) === String(selectedInterventionId));
          if (!selectedInter) {
            alert("Tratamento selecionado inválido.");
            setSaving(false);
            return;
          }
          
          const res = await fetch("/api/financeiro/pagar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nroTra: selectedInter.nroTra,
              nroPac: formData.patientId,
              value: paymentVal,
              description: formData.description,
              paymentMethodId: formData.paymentMethodId,
              nroPar: "1"
            })
          });
          
          if (res.ok) {
            setShowNewModal(false);
            resetForm();
            await reloadData();
          }
        } else {
          if (!newProcedureName || !newProcedureValue) {
            alert("Por favor, preencha o nome do procedimento e o valor do orçamento.");
            setSaving(false);
            return;
          }
          
          const budgetVal = parseFloat(newProcedureValue.replace(/\D/g, '')) / 100;
          
          const saveRes = await fetch(`/api/pacientes/${formData.patientId}/salvar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interventions: [{
                procedure: newProcedureName,
                numericValue: budgetVal,
                installments: "1",
                isPaid: false,
                paymentMethodId: "none",
                notes: `PROCEDIMENTO: ${newProcedureName}`,
                date: formData.date || new Date().toISOString().split('T')[0],
                tooth: "",
                status: "Em Aberto",
                professionalId: formData.professionalId
              }],
              odontogram: null
            })
          });
          
          if (saveRes.ok) {
            const saveResult = await saveRes.json();
            const generatedNroTra = saveResult.nroTra;
            
            if (paymentVal > 0 && generatedNroTra) {
              await fetch("/api/financeiro/pagar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nroTra: generatedNroTra,
                  nroPac: formData.patientId,
                  value: paymentVal,
                  description: formData.description || `Pg ${newProcedureName}`,
                  paymentMethodId: formData.paymentMethodId,
                  nroPar: "1"
                })
              });
            }
            
            setShowNewModal(false);
            resetForm();
            await reloadData();
          }
        }
      } else {
        const res = await fetch('/api/financeiro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            value: paymentVal
          })
        });
        if (res.ok) {
          setShowNewModal(false);
          resetForm();
          await reloadData();
        }
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

  // 1. Intervenções base (Tratamentos)
  const baseInterventions = globalPatientFilter ? patientInterventions : (data?.interventions || []);
  
  // 2. Lançamentos avulsos (apenas saídas/despesas e movimentações da clínica, nunca recebimentos de pacientes)
  const looseSurgeonMoves = data?.transactions?.filter((t: any) => 
    t.id.startsWith('c-')
  ) || [];

  let baseLooseEntries = [];
  if (!globalPatientFilter) {
    baseLooseEntries = looseSurgeonMoves;
  }

  // 3. Aplicar filtro de descrição a ambos
  const q = descriptionFilter ? descriptionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  
  const filteredInterventions = q
    ? baseInterventions.filter((inter: any) => 
        inter.procedure?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        inter.patientName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        inter.professional?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
      )
    : baseInterventions;

  const filteredLooseEntries = q
    ? baseLooseEntries.filter((t: any) => 
        t.description?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        t.patientName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        t.professionalName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
      )
    : baseLooseEntries;

  // 4. Mesclar cronologicamente
  const displayItems = [
    ...filteredInterventions.map((inter: any) => ({ ...inter, isIntervention: true })),
    ...filteredLooseEntries.map((entry: any) => ({ ...entry, isIntervention: false }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownloadReport = () => {
    if (!displayItems || displayItems.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }
    const headers = ["Data", "Tipo", "Paciente / Procedimento", "Profissional", "Condições", "Valor Pago / Total", "Status / Forma Pagto"];
    const rows = displayItems.map((item: any) => {
      if (item.isIntervention) {
        return [
          new Date(item.date).toLocaleDateString('pt-BR'),
          "Tratamento",
          `${item.patientName ? item.patientName + ' - ' : ''}${item.procedure}`,
          item.professional,
          `${item.paymentMethod || 'Particular'} (${item.totalInstallments || 1}x)`,
          `Pago: ${formatCurrency(item.totalPaid)} / Total: ${formatCurrency(item.value)}`,
          item.status
        ];
      } else {
        return [
          new Date(item.date).toLocaleDateString('pt-BR'),
          item.type === 'expense' ? "Saída (Despesa)" : "Entrada Avulsa",
          item.description,
          item.patientName || item.professionalName || "Clínica Geral",
          "Lançamento Avulso",
          formatCurrency(parseFloat(item.value)),
          item.paymentMethod || "Não informado"
        ];
      }
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

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

  const renderDropdownOptions = () => {
    return (
      <>
        <option value="new">+ Criar Novo Tratamento...</option>
        {patientActiveInterventions.map((inter: any) => (
          <option key={inter.id} value={inter.id}>
            {inter.procedure} (Orçamento: R$ {inter.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Pago: R$ {(inter.totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </option>
        ))}
      </>
    );
  };

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
          {/* Filtro de Paciente Global */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-80 items-center">
              <Search size={14} className="text-slate-400 ml-2" />
              <input 
                type="text"
                placeholder="Pesquisar Paciente..."
                className="bg-transparent border-none text-xs font-black uppercase text-slate-600 px-2.5 py-1 outline-none w-full"
                value={globalPatientSearch}
                onChange={(e) => {
                  setGlobalPatientSearch(e.target.value);
                  setShowGlobalPatientResults(true);
                }}
                onFocus={() => setShowGlobalPatientResults(true)}
              />
              {globalPatientFilter && (
                <button 
                  onClick={() => {
                    setGlobalPatientFilter(null);
                    setGlobalPatientSearch("");
                  }}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            
            {showGlobalPatientResults && globalPatientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                {globalPatientResults.map((p: any) => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setGlobalPatientFilter(p);
                      setGlobalPatientSearch(p.name);
                      setShowGlobalPatientResults(false);
                    }}
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                  >
                    <span className="text-[10px] font-black text-slate-800 uppercase truncate">{p.name}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase truncate">CPF: {p.cpf || "---"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
        {globalPatientFilter ? (
          <>
            {/* Card 1: Paciente Selecionado */}
            <div className="bg-white px-4 py-3 rounded-[24px] border border-slate-200 text-left flex flex-col justify-between min-h-[96px]">
               <div className="flex items-center justify-between">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                     <Search size={16} />
                  </div>
                  <button 
                    onClick={() => {
                      setGlobalPatientFilter(null);
                      setGlobalPatientSearch("");
                    }}
                    className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100 transition-colors"
                  >
                    Limpar Filtro
                  </button>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paciente Selecionado</p>
                  <h2 className="text-xs font-black text-slate-900 mt-0.5 truncate uppercase">{globalPatientFilter.name}</h2>
               </div>
            </div>

            {/* Card 2: Valor Orçado */}
            <div className="bg-white px-4 py-3 rounded-[24px] border border-slate-200 text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
                     <DollarSign size={16} />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">Total Orçado</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Procedimentos Cadastrados</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">
                    {loadingPatientData ? "---" : formatCurrency(patientInterventions.reduce((sum, inter) => sum + (Number(inter.value) || 0), 0))}
                  </h2>
               </div>
            </div>

            {/* Card 3: Total Pago */}
            <div className="bg-white px-4 py-3 rounded-[24px] border border-slate-200 text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                     <ArrowUpCircle size={16} />
                  </div>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Total Pago</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valores Recebidos</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">
                    {loadingPatientData ? "---" : formatCurrency(patientInterventions.reduce((sum, inter) => sum + (Number(inter.totalPaid) || 0), 0))}
                  </h2>
               </div>
            </div>

            {/* Card 4: Saldo Devedor */}
            <div className="bg-amber-50 border border-amber-100 px-4 py-3 rounded-[24px] text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white shadow-sm text-amber-600 rounded-lg">
                     <TrendingUp size={16} />
                  </div>
                  <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-md">Saldo Devedor</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-amber-600/70 uppercase tracking-widest">Restante a Pagar</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">
                    {loadingPatientData ? "---" : formatCurrency(
                      Math.max(0, 
                        patientInterventions.reduce((sum, inter) => sum + (Number(inter.value) || 0), 0) -
                        patientInterventions.reduce((sum, inter) => sum + (Number(inter.totalPaid) || 0), 0)
                      )
                    )}
                  </h2>
               </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white px-4 py-3 rounded-[24px] border border-slate-200 text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                     <ArrowUpCircle size={16} />
                  </div>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Entradas</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faturamento Bruto</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.income || 0)}</h2>
               </div>
            </div>

            <div className="bg-white px-4 py-3 rounded-[24px] border border-slate-200 text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                     <ArrowDownCircle size={16} />
                  </div>
                  <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md">Saídas</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Custos / Despesas</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.expenses || 0)}</h2>
               </div>
            </div>

            <div className="bg-white px-4 py-3 rounded-[24px] border border-slate-200 text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                     <Wallet size={16} />
                  </div>
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Saldo</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lucro Líquido</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.balance || 0)}</h2>
               </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 px-4 py-3 rounded-[24px] text-left">
               <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-white shadow-sm text-amber-600 rounded-lg">
                     <TrendingUp size={16} />
                  </div>
                  <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-md">A Receber</span>
               </div>
               <div>
                  <p className="text-[8px] font-black text-amber-600/70 uppercase tracking-widest">Saldo Pendente</p>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">{loading ? "---" : formatCurrency(data?.summary?.pending || 0)}</h2>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <History size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-900 uppercase text-[12px] tracking-widest">
                {globalPatientFilter ? `Lançamentos de ${globalPatientFilter.name}` : "Todas as Movimentações"}
              </h3>
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

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {(loading || loadingPatientData) ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <TrendingUp size={64} className="text-slate-300 mb-4" />
               <p className="font-black uppercase text-xs tracking-widest">Nenhum registro financeiro encontrado</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Procedimento / Paciente / Lançamento</th>
                  <th className="px-6 py-4 text-center">Condições</th>
                  <th className="px-6 py-4">Valor Pago / Total</th>
                  <th className="px-6 py-4">Status / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map((item) => {
                  if (item.isIntervention) {
                    const inter = item;
                    const totalInst = Number(inter.totalInstallments || inter.installments || 1);
                    return (
                      <tr
                        key={inter.id}
                        data-nrotra={inter.nroTra}
                        className="transition-all duration-300 cursor-pointer select-none hover:bg-slate-50/50"
                        onClick={() => setSelectedIntervention(inter)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900">{inter.procedure}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">
                            {inter.patientName && <span className="text-blue-600 font-extrabold mr-1.5">{inter.patientName}</span>}
                            {new Date(inter.date).toLocaleDateString('pt-BR')} • {inter.professional}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-sm font-black text-slate-900">
                            {inter.paymentMethod || "Não informado"}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                            {totalInst} {totalInst === 1 ? "parcela" : "parcelas"}
                          </p>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                           <div className="flex flex-col gap-1">
                             <div className="p-1 -ml-1">
                               <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                                 <span className="text-[9px] text-slate-400 font-bold uppercase">Pago:</span>
                                 R$ {Number(inter.totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                               </p>
                             </div>

                             {editingValueId === inter.id ? (
                               <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200 mt-1">
                                 <div className="relative flex items-center">
                                   <span className="absolute left-2 text-[10px] font-black text-slate-400">R$</span>
                                   <input 
                                     type="text"
                                     className="w-20 bg-white border border-slate-200 rounded-lg pl-6 pr-1.5 py-1 text-[11px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                     value={editingValueText}
                                     onChange={(e) => {
                                       const val = e.target.value.replace(/[^0-9.,]/g, '');
                                       setEditingValueText(val);
                                     }}
                                     autoFocus
                                     onKeyDown={async (e) => {
                                       if (e.key === 'Enter') {
                                         await handleSaveValue(inter);
                                       } else if (e.key === 'Escape') {
                                         setEditingValueId(null);
                                       }
                                     }}
                                   />
                                 </div>
                                 <button 
                                   onClick={async () => await handleSaveValue(inter)}
                                   className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center shadow-sm"
                                   title="Salvar"
                                 >
                                   <Check size={12} className="stroke-[3]" />
                                 </button>
                                 <button 
                                   onClick={() => setEditingValueId(null)}
                                   className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors flex items-center justify-center"
                                   title="Cancelar"
                                 >
                                   <X size={12} className="stroke-[3]" />
                                 </button>
                               </div>
                             ) : (
                               <div 
                                 className="group relative cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors -ml-1"
                                 title="Clique para editar o valor total"
                                 onClick={() => {
                                   setEditingValueId(inter.id);
                                   setEditingValueText(inter.value.toString());
                                 }}
                               >
                                 <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                   <span className="text-[9px] text-slate-400 font-bold uppercase">Total:</span>
                                   R$ {inter.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                   <Edit2 size={8} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                 </p>
                               </div>
                             )}
                           </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            {["Em Aberto", "Concluído"].map(s => (
                              <button
                                key={s}
                                onClick={async () => {
                                  if (inter.status === s) return;
                                  await handleStatusToggle(inter, s);
                                }}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                                  inter.status === s 
                                    ? (s === "Concluído" ? "bg-emerald-500 text-white shadow-sm" : "bg-amber-500 text-white shadow-sm")
                                    : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                {s.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  } else {
                    const entry = item;
                    return (
                      <tr
                        key={entry.id}
                        className="transition-all duration-300 cursor-pointer select-none hover:bg-slate-50/50"
                        onClick={() => setSelectedTransaction(entry)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900">{entry.description}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">
                            {new Date(entry.date).toLocaleDateString('pt-BR')} • {entry.patientName || entry.professionalName || "Clínica Geral"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Lançamento Avulso
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className={cn(
                            "text-xs font-black",
                            entry.type === 'expense' ? "text-rose-600" : "text-emerald-600"
                          )}>
                            {entry.type === 'expense' ? "-" : "+"} R$ {parseFloat(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 w-fit">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                              entry.type === 'expense' 
                                ? "bg-rose-50 text-rose-600 border-rose-100" 
                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {entry.type === 'expense' ? 'Saída' : 'Entrada'}
                            </span>
                            <button
                              onClick={async () => {
                                await handleDelete(entry.id, entry.type);
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-2"
                              title="Excluir Lançamento"
                            >
                              <Trash2 size={13} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-3xl rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <div className="px-8 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-900 text-white rounded-lg shadow-lg"><Plus size={16} /></div>
                    <div>
                       <h3 className="text-[9px] font-black uppercase text-slate-900">Novo Lançamento</h3>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Registre uma nova entrada ou saída</p>
                    </div>                 </div>
                 <button onClick={() => setShowNewModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                 <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setFormData({...formData, type: 'income'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
                      )}
                    >
                      <ArrowUpCircle size={14} className="inline mr-2" /> Entrada
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, type: 'expense'})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
                      )}
                    >
                      <ArrowDownCircle size={14} className="inline mr-2" /> Despesa
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
                                   onClick={async () => {
                                       setFormData({...formData, patientId: p.id, patientName: p.name});
                                       setPatientSearch(p.name);
                                       setShowPatientResults(false);
                                       
                                       setLoadingPatientTra(true);
                                       try {
                                         const res = await fetch(`/api/pacientes/${p.id}/historico`);
                                         const hist = await res.json();
                                         setPatientActiveInterventions(hist.interventions || []);
                                         setSelectedInterventionId("new");
                                         setFormData(prev => ({
                                           ...prev,
                                           patientId: p.id,
                                           patientName: p.name,
                                           description: ""
                                         }));
                                       } catch (err) {
                                         console.error(err);
                                       } finally {
                                         setLoadingPatientTra(false);
                                       }
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

                       {formData.patientId && (
                          <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Vincular ao Tratamento</label>
                             {loadingPatientTra ? (
                               <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-500">
                                 <Loader2 className="animate-spin text-blue-600" size={14} />
                                 Carregando tratamentos...
                               </div>
                             ) : (
                               <select 
                                 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                                 value={selectedInterventionId}
                                 onChange={(e) => {
                                   setSelectedInterventionId(e.target.value);
                                   if (e.target.value !== 'new') {
                                     const inter = patientActiveInterventions.find(i => String(i.id) === String(e.target.value));
                                     if (inter) {
                                       setFormData(prev => ({
                                         ...prev,
                                         description: `Pg ${inter.procedure.split('|')[0].replace('PROCEDIMENTO:', '').trim()}`
                                       }));
                                     }
                                   } else {
                                     setFormData(prev => ({
                                       ...prev,
                                       description: ""
                                     }));
                                   }
                                 }}
                               >
                                 {renderDropdownOptions()}
                               </select>
                             )}
                          </div>
                       )}

                       {formData.patientId && selectedInterventionId === 'new' && (
                          <div className="grid grid-cols-2 gap-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200 mt-4">
                             <div className="space-y-2 col-span-2">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Informações do Novo Tratamento</p>
                             </div>
                             <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Procedimento</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Restauração, Limpeza, Canal..."
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                                  value={newProcedureName}
                                  onChange={e => {
                                    setNewProcedureName(e.target.value);
                                    setFormData(prev => ({ ...prev, description: `Pg ${e.target.value}` }));
                                  }}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Orçamento</label>
                                <input 
                                  type="text" 
                                  placeholder="R$ 0,00"
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                                  value={newProcedureValue}
                                  onChange={e => setNewProcedureValue(formatCurrencyInput(e.target.value))}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                                <select 
                                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                                  value={formData.paymentMethodId}
                                  onChange={e => setFormData({...formData, paymentMethodId: e.target.value})}
                                >
                                   {catalog?.payments?.map((p: any) => (
                                     <option key={p.id} value={p.id}>{p.name}</option>
                                   ))}
                                </select>
                             </div>
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

                 {/* Procedure Multi-Selector (Collapsible) */}
                 <div className="space-y-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setShowProceduresGrid(!showProceduresGrid)}
                      className="w-full flex items-center justify-between text-left focus:outline-none"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Procedimentos (Soma automática)</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          {selectedProcedures.length === 0 
                            ? "Nenhum selecionado (clique para expandir e somar)" 
                            : `${selectedProcedures.length} selecionado(s) - clique para ver/editar`}
                        </span>
                      </div>
                      <div className="p-1 bg-white hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-colors">
                        {showProceduresGrid ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {showProceduresGrid && (
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 mt-3 pt-3 border-t border-slate-200/60">
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
                    )}
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
                    {selectedTransaction.type === 'income' ? "+" : selectedTransaction.type === 'expense' ? "-" : ""} 
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

      {/* Modal de Detalhes do Pagamento & Linha do Tempo */}
      {selectedIntervention && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedIntervention(null)}
        >
          <div 
            className="bg-white w-full max-w-6xl rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 leading-tight">
                    {selectedIntervention.procedure}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedIntervention.patientName && <span className="text-blue-600 font-extrabold mr-1.5">{selectedIntervention.patientName}</span>}
                    Cadastro: {new Date(selectedIntervention.date).toLocaleDateString('pt-BR')} • Dr(a). {selectedIntervention.professional}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIntervention(null)}
                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                
                {/* Coluna Esquerda: Resumos e Lançamento de Pagamento */}
                <div className="md:col-span-7 space-y-6">
                  {/* Progress Summary Cards & Bar */}
                  <div className="bg-slate-50/70 border border-slate-200/60 rounded-3xl p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="relative group flex flex-col justify-center items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orçamento</span>
                        {editingValueId === selectedIntervention.id ? (
                          <div className="flex items-center justify-center gap-1 mt-1 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-[10px] font-black text-slate-400">R$</span>
                              <input 
                                type="text"
                                className="w-20 bg-white border border-slate-200 rounded-lg pl-6 pr-1.5 py-1 text-[11px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={editingValueText}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                                  setEditingValueText(val);
                                }}
                                autoFocus
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    await handleSaveValue(selectedIntervention);
                                  } else if (e.key === 'Escape') {
                                    setEditingValueId(null);
                                  }
                                }}
                              />
                            </div>
                            <button 
                              onClick={async () => await handleSaveValue(selectedIntervention)}
                              className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center shadow-sm"
                              title="Salvar"
                            >
                              <Check size={10} className="stroke-[3]" />
                            </button>
                            <button 
                              onClick={() => setEditingValueId(null)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors flex items-center justify-center"
                              title="Cancelar"
                            >
                              <X size={10} className="stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-slate-200/50 px-2 py-0.5 rounded-lg transition-colors mt-0.5 flex items-center justify-center gap-1 group-hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingValueId(selectedIntervention.id);
                              setEditingValueText(selectedIntervention.value.toString());
                            }}
                            title="Clique para editar o valor total do orçamento"
                          >
                            <p className="text-sm font-black text-slate-900">
                              R$ {selectedIntervention.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Edit2 size={9} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Valor Pago</span>
                        <p className="text-sm font-black text-emerald-600 mt-0.5">
                          R$ {Number(selectedIntervention.totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest font-extrabold">Saldo Devedor</span>
                        <p className="text-sm font-black text-slate-900 mt-0.5">
                          R$ {Math.max(0, selectedIntervention.value - (selectedIntervention.totalPaid || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                        <span>Progresso de Pagamento</span>
                        <span>{Math.min(100, Math.round(((selectedIntervention.totalPaid || 0) / selectedIntervention.value) * 100))}%</span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, ((selectedIntervention.totalPaid || 0) / selectedIntervention.value) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Lançar Novo Pagamento */}
                  <div className="bg-slate-50/70 rounded-3xl border border-slate-200/60 p-5 space-y-4">
                    <h6 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Plus size={12} className="stroke-[3]" />
                      Lançar Novo Recebimento / Pagamento
                    </h6>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Valor</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-black text-slate-400">R$</span>
                          <input 
                            type="text"
                            placeholder="0,00"
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-3.5 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={payFormValue}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.,]/g, '');
                              setPayFormValue(val);
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Forma de Pagamento</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={payFormMethodId}
                          onChange={(e) => setPayFormMethodId(e.target.value)}
                        >
                          {catalog?.payments?.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Observação</label>
                        <input 
                          type="text"
                          placeholder="Ex: Pix, Cartão, Dinheiro..."
                          className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={payFormObs}
                          onChange={(e) => setPayFormObs(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={async () => {
                          const parsedVal = parseFloat(payFormValue.replace(",", "."));
                          if (isNaN(parsedVal) || parsedVal <= 0) return;

                          setSaving(true);
                          try {
                            const nPac = selectedIntervention.nroPac || globalPatientFilter?.id;
                            const res = await fetch("/api/financeiro/pagar", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                nroTra: selectedIntervention.nroTra,
                                nroPac: nPac,
                                value: parsedVal,
                                description: payFormObs || `Pg ${selectedIntervention.procedure.split('|')[0].replace('PROCEDIMENTO:', '').trim()}`,
                                paymentMethodId: payFormMethodId,
                                nroPar: "1"
                              })
                            });
                            if (res.ok) {
                              setPayFormValue("");
                              setPayFormObs("");
                              await reloadData();
                            }
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        Lançar Pagamento
                      </button>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Histórico Timeline */}
                <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 max-h-[65vh] md:max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
                  <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 sticky top-0 bg-white pb-2 z-10">
                    Histórico de Lançamentos
                  </h6>
                  {selectedIntervention.payments && selectedIntervention.payments.length > 0 ? (
                    <div className="relative border-l-2 border-blue-100 pl-6 ml-4 space-y-6 py-2">
                      {selectedIntervention.payments.map((p: any) => (
                        <div key={p.id} className="relative flex justify-between items-start text-xs font-black">
                          <div className="absolute -left-[32px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-blue-500 bg-white shadow-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          </div>
                          <div className="flex-1 pr-2">
                            <p className="font-black text-slate-800">
                              {p.paymentMethod || "Não informado"}
                            </p>
                            {p.description && (
                              <p className="text-[11px] font-bold text-slate-600 italic mt-0.5 break-words">
                                {"\"" + p.description + "\""}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                              {new Date(p.date).toLocaleDateString('pt-BR')} {p.installment ? `• Parcela ${p.installment}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-black text-emerald-600 text-[13px]">
                                R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm("Tem certeza que deseja excluir este lançamento de pagamento?")) return;
                                setSaving(true);
                                try {
                                  const res = await fetch("/api/financeiro/pagar/excluir", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      registroId: p.id,
                                      nroTra: selectedIntervention.nroTra
                                    })
                                  });
                                  if (res.ok) {
                                    await reloadData();
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              disabled={saving}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              title="Excluir lançamento"
                            >
                              <Trash2 size={13} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold uppercase py-2 pl-1">
                      Nenhum lançamento de pagamento encontrado.
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
