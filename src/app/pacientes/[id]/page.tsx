"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  History,
  FileText, 
  ShieldCheck,
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Paperclip,
  FolderOpen,
  Upload,
  Stethoscope,
  HeartPulse,
  AlertTriangle
} from "lucide-react";import { cn } from "@/lib/utils";
import { useCallback, Suspense } from "react";
import { FilesModal } from "@/components/FilesModal";

interface TreatmentItem {
  id: string;
  type: 'intervention' | 'history';
  date: string;
  procedure: string;
  status: string;
  professional: string;
  professionalId?: string;
  procedureId?: string;
  value: number;
  tooth: string;
  paymentMethod?: string;
  totalInstallments?: number;
  installments?: number;
  paidInstallments?: number;
  treatmentStatus?: string;
  notes?: string;
  convenio?: string;
  nroTra?: string;
  filesCount?: number;
}

export default function PatientProfilePage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <PatientProfileContent />
    </Suspense>
  );
}

function PatientProfileContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "dados";

  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<{ history: TreatmentItem[], interventions: TreatmentItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedItem, setSelectedItem] = useState<TreatmentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TreatmentItem>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [initialFilesIntervention, setInitialFilesIntervention] = useState<string | undefined>(undefined);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientEditForm, setPatientEditForm] = useState<any>({});

  const prestadores = [
    { id: "1", nome: "Dr. Carlos Cesar de Carvalho" },
    { id: "2", nome: "Drª Esmeralda Dos Santos Offredi" },
    { id: "255", nome: "Clínica" }
  ];

  async function loadData() {
    try {
      const [pRes, hRes] = await Promise.all([
        fetch(`/api/pacientes/${id}`),
        fetch(`/api/pacientes/${id}/historico`)
      ]);
      const pData = await pRes.json();
      const hData = await hRes.json();
      setPatient(pData);
      setPatientEditForm(pData);
      setHistory(hData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskRG = (value: string) => {
    // Basic mask for RG (common format: XX.XXX.XXX-X or variants)
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{1,2})\d+?$/, "$1");
  };

  const handleEditPatient = () => {
    const defaultAnamnesis = [
      { id: "2", question: "Alergia a medicamentos? Quais?", alert: null, complement: "" },
      { id: "1", question: "Usa Medicamentos? Quais?", alert: null, complement: "" },
      { id: "3", question: "Pressão alta?", alert: null, complement: "" },
      { id: "11", question: "Tem asma?", alert: null, complement: "" },
      { id: "13", question: "Reação com anestésicos?", alert: null, complement: "" },
      { id: "6", question: "Bruxismo (ranger dentes)?", alert: null, complement: "" },
      { id: "17", question: "Está grávida?", alert: null, complement: "" },
      { id: "8", question: "Tem sinusite?", alert: null, complement: "" }
    ];

    setPatientEditForm({ 
      ...patient, 
      anamnesis: (patient.anamnesis && patient.anamnesis.length > 0) ? patient.anamnesis : defaultAnamnesis
    });
    setIsEditingPatient(true);
  };

  const handleSavePatient = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${id}/atualizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientEditForm)
      });
      if (res.ok) {
        await loadData();
        setIsEditingPatient(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({ ...selectedItem });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${id}/historico/atualizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          id: selectedItem?.id,
          type: selectedItem?.type
        })
      });
      if (res.ok) {
        await loadData();
        setSelectedItem(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${id}/historico/excluir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem?.id,
          type: selectedItem?.type
        })
      });
      if (res.ok) {
        await loadData();
        setSelectedItem(null);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  const allItems = [...(history?.interventions || []), ...(history?.history || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Detalhes do Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">
                  {isEditing ? "Editar Atendimento" : "Detalhes do Atendimento"}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(selectedItem.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedItem(null);
                  setIsEditing(false);
                }}
                className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
              >
                <Plus size={20} className="rotate-45 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Procedimento</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px]"
                      value={editForm.procedure || ""}
                      onChange={(e) => setEditForm({ ...editForm, procedure: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Profissional</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={editForm.professionalId || ""}
                        onChange={(e) => setEditForm({ ...editForm, professionalId: e.target.value })}
                      >
                        {prestadores.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor (R$)</label>
                      <input 
                        type="number"
                        disabled={selectedItem.type === 'history'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        value={editForm.value || 0}
                        onChange={(e) => setEditForm({ ...editForm, value: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {selectedItem.type === 'intervention' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Procedimento Status</label>
                        <div className="flex gap-2">
                          {["Em Aberto", "Concluído", "Cancelado"].map(s => (
                            <button
                              key={s}
                              onClick={() => setEditForm({ ...editForm, status: s })}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                editForm.status === s 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                                  : "bg-white border-slate-200 text-slate-500 hover:border-blue-200"
                              )}
                            >
                              {s.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedItem.type === 'intervention' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Controle de Pagamento</p>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Parcelas Pagas</p>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={editForm.paidInstallments || 0}
                              onChange={(e) => setEditForm({ ...editForm, paidInstallments: parseInt(e.target.value) })}
                            />
                            <span className="text-xs font-bold text-slate-400">de {selectedItem.totalInstallments || selectedItem.installments || 1}</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Status Financeiro</p>
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase w-fit",
                            (editForm.paidInstallments || 0) >= (Number(selectedItem.totalInstallments || selectedItem.installments) || 1) 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-rose-100 text-rose-700"
                          )}>
                            {(editForm.paidInstallments || 0) >= (Number(selectedItem.totalInstallments || selectedItem.installments) || 1) ? "Totalmente Pago" : "Pagamento Pendente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedItem.type === 'intervention' && (
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Observações Internas</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={editForm.notes || ""}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Adicione anotações técnicas..."
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Procedimento</p>
                    <h4 className="text-lg font-bold text-slate-900 leading-tight">
                      {selectedItem.procedure || "Procedimento sem descrição"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Profissional</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <User size={12} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">{selectedItem.professional}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Procedimento</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                        selectedItem.status === "Em Aberto" ? "bg-amber-100 text-amber-700" : 
                        selectedItem.status === "Cancelado" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>

                  {selectedItem.type === 'intervention' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Situação Financeira</p>
                        <p className={cn(
                          "text-[10px] font-black uppercase",
                          (selectedItem.paidInstallments || 0) >= (Number(selectedItem.totalInstallments || selectedItem.installments) || 1) ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {(selectedItem.paidInstallments || 0) >= (Number(selectedItem.totalInstallments || selectedItem.installments) || 1) ? "Pago Total" : `Pendente (${selectedItem.paidInstallments || 0}/${Number(selectedItem.totalInstallments || selectedItem.installments) || 1})`}
                        </p>                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Pagamento</span>
                      </div>
                      <p className="text-sm font-black text-slate-900">R$ {selectedItem.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Forma</p>
                        <p className="text-[10px] font-bold text-slate-700">{selectedItem.paymentMethod || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Parcelas</p>
                        <p className="text-[10px] font-bold text-slate-700">{selectedItem.totalInstallments ? `${selectedItem.totalInstallments}x` : (selectedItem.installments ? `${selectedItem.installments}x` : "À vista / N/A")}</p>
                      </div>
                    </div>
                  </div>

                  {selectedItem.prescriptions && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Receitas / Prescrições</span>
                      </div>
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <p className="text-xs text-blue-700 font-medium whitespace-pre-wrap">{selectedItem.prescriptions}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.notes && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações Internas</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                        &quot;{selectedItem.notes}&quot;
                      </p>
                    </div>
                  )}

                  {selectedItem.filesCount !== undefined && selectedItem.filesCount > 0 && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Paperclip size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase">Arquivos Vinculados</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedItem.filesCount} anexo(s) encontrado(s)</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedItem(null);
                          setInitialFilesIntervention(selectedItem.id);
                          setShowFilesModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                      >
                        Ver Arquivos
                      </button>
                    </div>
                  )}

                  {!selectedItem.filesCount || selectedItem.filesCount === 0 && (
                     <button 
                      onClick={() => {
                        setSelectedItem(null);
                        setInitialFilesIntervention(selectedItem.id);
                        setShowFilesModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-[9px] font-black text-slate-400 uppercase hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
                    >
                      <Upload size={14} />
                      Anexar Documento ou Radiografia
                    </button>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={12} />
                      Dente: {selectedItem.tooth || "Geral"}
                    </div>
                    {selectedItem.convenio && (
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Convênio: {selectedItem.convenio}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              {showDeleteConfirm ? (
                <div className="flex-1 flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    disabled={saving}
                    onClick={handleDelete}
                    className="flex-[2] py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Confirmar Exclusão"}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              ) : isEditing ? (
                <>
                  <button 
                    disabled={saving}
                    onClick={handleSaveEdit}
                    className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Salvar Alterações"}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Voltar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleEditClick}
                    className="flex-[2] py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Editar Registro
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all group"
                    title="Excluir Registro"
                  >
                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Imprimir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"
        >
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{patient?.name}</h1>
          <p className="text-sm text-slate-500">Prontuário Digital #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Essential Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl shadow-blue-100">
              {patient?.name?.[0]}
            </div>
            <h2 className="font-bold text-slate-900">{patient?.name}</h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase mt-2">
              Ativo
            </span>

            <div className="w-full mt-8 space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Telefone</p>
                  <p className="text-xs font-bold text-slate-700">{patient?.phone || "Não informado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">E-mail</p>
                  <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{patient?.email || "Não informado"}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleEditPatient}
              className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Editar Cadastro
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-blue-600">
                <Calendar size={18} />
                <span className="text-[9px] font-black uppercase">Agendar</span>
              </button>
              <button 
                onClick={() => setShowFilesModal(true)}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-blue-600"
              >
                <FolderOpen size={18} />
                <span className="text-[9px] font-black uppercase">Arquivos</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-emerald-600 col-span-2">
                <CreditCard size={18} />
                <span className="text-[9px] font-black uppercase">Orçamento</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
            {[
              { id: "dados", label: "Dados Pessoais", icon: User },
              { id: "historico", label: "Histórico Clínico", icon: History },
              { id: "financeiro", label: "Financeiro", icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:bg-white/50"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Historico */}
          {activeTab === "historico" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Timeline real do banco */}
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    Intervenções e Evolução
                  </h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">
                    <Plus size={14} /> Adicionar Evolução
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {allItems.length > 0 ? (
                    allItems.map((item: any, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedItem(item)}
                        className="p-6 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                            item.status === "Em Aberto" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            {item.status === "Em Aberto" ? <Clock size={20} /> : <ShieldCheck size={20} />}
                          </div>
                          <div className="w-px flex-1 bg-slate-100 my-2" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                            <div className="flex items-center gap-2">
                              {item.filesCount !== undefined && item.filesCount > 0 && (
                                <div className="p-1 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  <Paperclip size={12} />
                                </div>
                              )}
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                item.status === "Em Aberto" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                              )}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {(() => {
                              if (!item.notes) return item.procedure;
                              const parts = item.notes.split('|');
                              // Assuming index 0 or similar is the descriptive part, excluding timing/payment metadata
                              return parts[parts.length - 1].trim();
                            })()}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] font-bold text-slate-500">Valor: R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            {item.paymentMethod && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.paymentMethod}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <AlertCircle className="mx-auto text-slate-200 mb-2" size={40} />
                      <p className="text-sm font-bold text-slate-400 uppercase">Nenhum histórico encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Dados Pessoais */}
          {activeTab === "dados" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                    <p className="text-sm font-bold text-slate-700">{patient?.cpf || "---"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RG</p>
                    <p className="text-sm font-bold text-slate-700">{patient?.rg || "---"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nascimento</p>
                    <p className="text-sm font-bold text-slate-700">{patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "---"}</p>
                  </div>
                  <div className="col-span-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço Residencial</p>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-blue-500 mt-0.5" />
                      <p className="text-sm font-bold text-slate-700">
                        {patient?.address || "---"}, {patient?.neighborhood}<br />
                        {patient?.city} - {patient?.state} | {patient?.zipCode}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profissão</p>
                    <p className="text-sm font-bold text-slate-700">{patient?.profession || "---"}</p>
                  </div>
                </div>
              </div>

              {/* Seção de Anamnese / Saúde */}
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Ficha de Saúde</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertas e Informações Clínicas</p>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(patient?.anamnesis && patient.anamnesis.length > 0) ? (
                    patient.anamnesis.map((item: any, idx: number) => (
                      <div key={idx} className={cn(
                        "p-4 rounded-2xl border flex gap-4 transition-all",
                        item.responseId === '2' ? "bg-rose-50/30 border-rose-100" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          item.responseId === '2' ? "bg-rose-100 text-rose-600" : "bg-white text-slate-400"
                        )}>
                          {item.responseId === '2' ? <AlertTriangle size={20} /> : <Stethoscope size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {item.question}
                          </p>
                          <p className={cn(
                            "text-sm font-bold leading-snug",
                            item.responseId === '2' ? "text-rose-700" : "text-slate-700"
                          )}>
                            {item.alert || item.complement || "Sim"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Caso o paciente não tenha anamnese no banco, mostrar os campos padrão em branco
                    [
                      "Alergia a medicamentos? Quais?",
                      "Usa Medicamentos? Quais?",
                      "Pressão alta?",
                      "Tem asma?",
                      "Reação com anestésicos?",
                      "Bruxismo (ranger dentes)?",
                      "Está grávida?",
                      "Tem sinusite?"
                    ].map((q, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex gap-4 opacity-60">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white text-slate-300 border border-slate-50">
                          <Stethoscope size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{q}</p>
                          <p className="text-sm font-bold text-slate-300 italic">Não informado</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {patient && (
        <FilesModal 
          isOpen={showFilesModal} 
          onClose={() => {
            setShowFilesModal(false);
            setInitialFilesIntervention(undefined);
          }} 
          patientId={patient.id} 
          patientName={patient.name} 
          interventions={history?.interventions || []} 
          initialSelectedIntervention={initialFilesIntervention}
        />
      )}

      {/* Modal Editar Cadastro do Paciente */}
      {isEditingPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Editar Cadastro</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Pessoais</p>
              </div>
              <button onClick={() => setIsEditingPatient(false)} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                <Plus size={20} className="rotate-45 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome Completo</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.name || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Telefone</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.phone || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">E-mail</label>
                  <input 
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.email || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CPF</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.cpf || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, cpf: maskCPF(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">RG</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.rg || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, rg: maskRG(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Endereço</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.address || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Bairro</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.neighborhood || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, neighborhood: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cidade</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.city || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Estado (UF)</label>
                  <input 
                    type="text"
                    maxLength={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.state || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CEP</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={patientEditForm.zipCode || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, zipCode: e.target.value })}
                  />
                </div>
              </div>

              {/* Seção de Anamnese no Edit */}
              {patientEditForm.anamnesis && patientEditForm.anamnesis.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <HeartPulse size={18} className="text-rose-500" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações de Saúde (Anamnese)</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {patientEditForm.anamnesis.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase">{item.question}</p>
                        <textarea 
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-h-[60px] resize-none"
                          value={item.alert || item.complement || ""}
                          onChange={(e) => {
                            const newAnamnesis = [...patientEditForm.anamnesis];
                            if (item.alert !== null) newAnamnesis[idx].alert = e.target.value;
                            else newAnamnesis[idx].complement = e.target.value;
                            setPatientEditForm({ ...patientEditForm, anamnesis: newAnamnesis });
                          }}
                          placeholder="Detalhes ou observações..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                disabled={saving}
                onClick={handleSavePatient}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Salvar Alterações"}
              </button>
              <button 
                onClick={() => setIsEditingPatient(false)}
                className="flex-1 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
