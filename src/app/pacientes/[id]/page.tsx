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
  FileBadge,
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
  prescriptions?: string;
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
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<"gestao" | "extrato">("gestao");
  const [selectedItem, setSelectedItem] = useState<TreatmentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TreatmentItem>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [initialFilesIntervention, setInitialFilesIntervention] = useState<string | undefined>(undefined);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientEditForm, setPatientEditForm] = useState<any>({});

  const maritalStatuses = [
    { id: "1", name: "Casado(a)" },
    { id: "2", name: "Desquitado(a)" },
    { id: "3", name: "Divorciado(a)" },
    { id: "4", name: "Outro" },
    { id: "5", name: "Separado(a)" },
    { id: "6", name: "Solteiro(a)" },
    { id: "7", name: "Viúvo(a)" }
  ];

  const referralTypes = [
    { id: "1", name: "Paciente" },
    { id: "2", name: "Contato" },
    { id: "3", name: "Mídia" }
  ];

  const genders = [
    { id: "1", name: "Masculino" },
    { id: "2", name: "Feminino" }
  ];

  const patientStatuses = [
    { id: "2", name: "Ativo" },
    { id: "3", name: "Em tratamento" },
    { id: "1", name: "Inativo" }
  ];

  const initialAnamnesisQuestions = [
    { id: "1", question: "Usa Medicamentos? Quais?" },
    { id: "2", question: "Apresenta alergia a medicamentos? Quais?" },
    { id: "3", question: "Pressão alta?" },
    { id: "4", question: "Está sob cuidados médicos? Por quê?" },
    { id: "5", question: "Quando fez seu último tratamento dentário?" },
    { id: "6", question: "Range os dentes à noite?" },
    { id: "7", question: "Complicações em tratamentos anteriores?" },
    { id: "8", question: "Tem sinusite?" },
    { id: "9", question: "Sua pressão sanguínea é alta?" },
    { id: "10", question: "Toma ASS?" },
    { id: "11", question: "Tem asma?" },
    { id: "12", question: "Tem alguma alergia?" },
    { id: "13", question: "Já teve alguma reação com anestésicos?" },
    { id: "14", question: "Tem algum diabético em sua família?" },
    { id: "15", question: "Costuma desmaiar com frequência?" },
    { id: "16", question: "Considera-se nervoso(a)?" },
    { id: "17", question: "A senhora está grávida?" }
  ];

  const [catalogOptions, setCatalogOptions] = useState<{
    professionals: any[];
    convenios: any[];
  }>({ professionals: [], convenios: [] });

  async function loadData() {
    try {
      const [pRes, hRes, cRes] = await Promise.all([
        fetch(`/api/pacientes/${id}`),
        fetch(`/api/pacientes/${id}/historico`),
        fetch('/api/catalogo')
      ]);
      const pData = await pRes.json();
      const hData = await hRes.json();
      const cData = await cRes.json();

      setCatalogOptions({
        professionals: cData.professionals || [],
        convenios: cData.convenios || []
      });
      
      const defaultAnamnesis = initialAnamnesisQuestions.map(q => ({
        ...q,
        id_qst_item: q.id,
        alert: null,
        complement: "",
        responseId: "0"
      }));

      // Merge existing anamnesis from DB with our default list to ensure all questions are shown
      const mergedAnamnesis = defaultAnamnesis.map(dq => {
        const existing = pData.anamnesis?.find((ea: any) => ea.question === dq.question);
        return existing ? { ...dq, ...existing } : dq;
      });

      const patientWithAnamnesis = {
        ...pData,
        anamnesis: mergedAnamnesis
      };

      setPatient(patientWithAnamnesis);
      setPatientEditForm(patientWithAnamnesis);
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

  const hasChanges = JSON.stringify(patient) !== JSON.stringify(patientEditForm);

  const handleSavePatient = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${id}/atualizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientEditForm)
      });
      if (res.ok) {
        const updatedData = await res.json();
        setPatient(updatedData);
        setPatientEditForm(updatedData);
        // We don't need to call loadData() here if the API returns the updated patient
        // but loadData also loads history, so let's keep it simple
        await loadData();
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

  const allItems = [...(history?.interventions || []), ...(history?.history || [])]
    .filter(item => !item.procedure?.includes("Alteração Odontograma"))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
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
                        {catalogOptions.professionals.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
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
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {selectedItem.procedure.includes("Receitado:") ? "Receituário" : 
                       selectedItem.procedure.includes("Atestado:") ? "Atestado" :
                       selectedItem.procedure.includes("DIAGNÓSTICO:") ? "Diagnóstico" : "Procedimento"}
                    </p>
                    <h4 className="text-xl font-bold text-slate-900 leading-tight italic">
                      {selectedItem.procedure.includes("Receitado:") 
                        ? selectedItem.procedure.replace(/PROCEDIMENTO:\s*/i, "").replace(/Receitado:\s*/i, "").trim()
                        : selectedItem.procedure.includes("Atestado:")
                          ? selectedItem.procedure.replace(/PROCEDIMENTO:\s*/i, "").trim()
                          : selectedItem.procedure.includes("DIAGNÓSTICO:")
                            ? selectedItem.procedure.replace(/DIAGNÓSTICO:\s*/i, "").trim()
                            : selectedItem.procedure || "Procedimento sem descrição"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Profissional</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <User size={16} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">{selectedItem.professional}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Procedimento</p>
                      <span className={cn(
                        "px-3 py-1 rounded text-[10px] font-black uppercase",
                        selectedItem.status === "Em Aberto" ? "bg-amber-100 text-amber-700" : 
                        selectedItem.status === "Cancelado" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>

                  {selectedItem.type === 'intervention' && !selectedItem.procedure.includes("Receitado:") && !selectedItem.procedure.includes("Atestado:") && !selectedItem.procedure.includes("DIAGNÓSTICO:") && (
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

                  {!selectedItem.procedure.includes("Receitado:") && !selectedItem.procedure.includes("Atestado:") && !selectedItem.procedure.includes("DIAGNÓSTICO:") && (
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
                  )}

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
                    {!selectedItem.procedure.includes("Receitado:") && !selectedItem.procedure.includes("Atestado:") && (
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Dente: {selectedItem.tooth || "Geral"}
                      </div>
                    )}
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
          <h1 className="text-2xl font-bold text-slate-900">{patientEditForm?.name}</h1>
          <p className="text-sm text-slate-500">Prontuário Digital #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Essential Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl shadow-blue-100">
              {patientEditForm?.name?.[0]}
            </div>
            <textarea 
              rows={2}
              className="font-bold text-slate-900 text-center bg-transparent border-none focus:ring-0 w-full resize-none h-auto py-0 leading-tight"
              value={patientEditForm?.name || ""}
              onChange={(e) => setPatientEditForm({ ...patientEditForm, name: e.target.value })}
            />

            <div className="w-full mt-8 space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Telefone</p>
                  <input 
                    type="text"
                    className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 w-full"
                    value={patientEditForm?.phone || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">E-mail</p>
                  <input 
                    type="text"
                    className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 w-full truncate"
                    value={patientEditForm?.email || ""}
                    onChange={(e) => setPatientEditForm({ ...patientEditForm, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={!hasChanges || saving}
              onClick={handleSavePatient}
              className={cn(
                "w-full mt-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                hasChanges 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Salvar Alterações"}
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => router.push(`/agenda?patientId=${id}`)}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-blue-600"
              >
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
              <button 
                onClick={() => router.push(`/?patientId=${id}&action=new_budget`)}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-emerald-600 col-span-2"
              >
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
                            <span className="text-[11px] font-black text-slate-400 uppercase">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                            <div className="flex items-center gap-2">
                              {item.filesCount !== undefined && item.filesCount > 0 && (
                                <div className="p-1.5 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  <Paperclip size={14} />
                                </div>
                              )}
                              <span className={cn(
                                "px-2.5 py-1 rounded text-[10px] font-black uppercase",
                                item.status === "Em Aberto" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                              )}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          {item.procedure.includes("Receitado:") ? (
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 group-hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <FileText size={18} className="shrink-0" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Receituário Emitido</span>
                              </div>
                              <p className="text-[15px] font-bold text-slate-700 leading-relaxed italic">
                                {item.procedure.replace(/PROCEDIMENTO:\s*/i, "").replace(/Receitado:\s*/i, "").trim()}
                              </p>
                            </div>
                          ) : item.procedure.includes("Atestado:") ? (
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 group-hover:border-emerald-200 transition-all">
                              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <FileBadge size={18} className="shrink-0" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Atestado Gerado</span>
                              </div>
                              <p className="text-[15px] font-bold text-slate-700 leading-relaxed italic">
                                {item.procedure.replace(/PROCEDIMENTO:\s*/i, "").trim()}
                              </p>
                            </div>
                          ) : item.procedure.includes("DIAGNÓSTICO:") ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span className="text-[11px] font-black uppercase tracking-wider">Diagnóstico Clínico</span>
                                </div>
                                <h4 className="text-[16px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                                  {item.procedure.replace(/DIAGNÓSTICO:\s*/i, "").trim()}
                                  {item.tooth && (
                                    <span className="ml-2 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                                      Dente {item.tooth}
                                    </span>
                                  )}
                                </h4>
                            </div>
                          ) : (
                            <h4 className="text-[16px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                              {item.procedure.replace(/PROCEDIMENTO:\s*/i, "").trim()}
                              {item.tooth && (
                                <span className="ml-2 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                                  Dente {item.tooth}
                                </span>
                              )}
                            </h4>
                          )}
                          {!item.procedure.includes("Receitado:") && !item.procedure.includes("Atestado:") && !item.procedure.includes("DIAGNÓSTICO:") && (
                            <div className="flex items-center gap-4 mt-1.5">
                              <p className="text-[11px] font-bold text-slate-500">Valor: R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              {item.paymentMethod && (
                                <p className="text-[11px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                  {item.paymentMethod}
                                </p>
                              )}
                            </div>
                          )}
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

          {/* Tab Content: Financeiro */}
          {activeTab === "financeiro" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total em Tratamentos</p>
                  <h4 className="text-2xl font-black text-slate-900">
                    R$ {(history as any)?.financialSummary?.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0,00"}
                  </h4>
                </div>
                <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pago</p>
                  <h4 className="text-2xl font-black text-emerald-600">
                    R$ {(history as any)?.financialSummary?.totalPaid?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0,00"}
                  </h4>
                </div>
                <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Devedor</p>
                  <h4 className="text-2xl font-black text-rose-600">
                    R$ {(history as any)?.financialSummary?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0,00"}
                  </h4>
                </div>
              </div>

              {/* Navegação de Sub-abas Financeiras */}
              <div className="flex items-center gap-4 border-b border-slate-200">
                <button
                  onClick={() => setActiveFinanceSubTab("gestao")}
                  className={cn(
                    "pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
                    activeFinanceSubTab === "gestao" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Gestão de Orçamentos
                  {activeFinanceSubTab === "gestao" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveFinanceSubTab("extrato")}
                  className={cn(
                    "pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
                    activeFinanceSubTab === "extrato" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Extrato de Pagamentos
                  {activeFinanceSubTab === "extrato" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
              </div>

              {activeFinanceSubTab === "gestao" ? (
                /* Lista Detalhada de Orçamentos e Pagamentos */
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-600" />
                      Gestão de Orçamentos e Pagamentos
                    </h3>
                    <button 
                      onClick={loadData}
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                      title="Recarregar"
                    >
                      <Plus size={20} className="rotate-45" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Procedimento</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest text-center">Parcelas Pagas</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Valor Unitário</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Status do Tratamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history?.interventions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs">
                              Nenhum registro financeiro encontrado
                            </td>
                          </tr>
                        ) : (
                          history?.interventions.map((inter) => {
                            const totalInst = Number(inter.totalInstallments || inter.installments || 1);
                            const paidInst = Number(inter.paidInstallments || 0);
                            const valPerInst = (inter.value || 0) / totalInst;
                            
                            return (
                              <tr key={inter.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-sm font-black text-slate-900">{inter.procedure}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(inter.date).toLocaleDateString('pt-BR')} • {inter.professional}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <input 
                                      type="number"
                                      min="0"
                                      max={totalInst || 1}
                                      className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-black text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                      defaultValue={paidInst}
                                      onBlur={async (e) => {
                                        const newVal = parseInt(e.target.value);
                                        if (newVal === paidInst) return;
                                        
                                        const newStatus = newVal >= totalInst ? "Concluído" : inter.status;
                                        
                                        setSaving(true);
                                        try {
                                          await fetch(`/api/pacientes/${id}/historico/atualizar`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ 
                                              ...inter, 
                                              paidInstallments: newVal, 
                                              status: newStatus,
                                              totalInstallments: totalInst
                                            })
                                          });
                                          await loadData();
                                        } catch (err) { console.error(err); } finally { setSaving(false); }
                                      }}
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">de {totalInst}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-xs font-black text-slate-900">R$ {valPerInst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Total: R$ {inter.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                    {["Em Aberto", "Concluído"].map(s => (
                                      <button
                                        key={s}
                                        onClick={async () => {
                                          if (inter.status === s) return;
                                          const newPaidInst = s === "Concluído" ? totalInst : paidInst;
                                          
                                          setSaving(true);
                                          try {
                                            await fetch(`/api/pacientes/${id}/historico/atualizar`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ ...inter, status: s, paidInstallments: newPaidInst })
                                            });
                                            await loadData();
                                          } catch (err) { console.error(err); } finally { setSaving(false); }
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
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Extrato de Parcelas Pagas */
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="p-6 border-b border-slate-100 bg-emerald-50/30">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      <History size={18} className="text-emerald-600" />
                      Extrato de Pagamentos Recebidos
                    </h3>
                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Detalhamento individual de parcelas quitadas</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Data do Lançamento</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Descrição do Procedimento</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Parcela</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Valor da Parcela</th>
                          <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history?.interventions.filter(i => (i.paidInstallments || 0) > 0).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-sm">
                              Nenhuma parcela paga registrada
                            </td>
                          </tr>
                        ) : (
                          history?.interventions.flatMap((inter) => {
                            const totalInst = Number(inter.totalInstallments || inter.installments || 1);
                            const paidInst = Number(inter.paidInstallments || 0);
                            const valPerInst = (inter.value || 0) / totalInst;
                            
                            const rows = [];
                            for (let i = 1; i <= paidInst; i++) {
                              rows.push(
                                <tr key={`${inter.id}-paid-${i}`} className="hover:bg-emerald-50/30 transition-colors">
                                  <td className="px-6 py-4 text-sm font-bold text-slate-500">
                                    {new Date(inter.date).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-900">{inter.procedure}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{inter.professional}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase">
                                      Parcela {i}/{totalInst}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-black text-emerald-600">
                                    R$ {valPerInst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-[10px] font-black uppercase">Recebido</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return rows;
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Dados Pessoais */}
          {activeTab === "dados" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apelido / Como prefere ser chamado</p>
                        <input 
                        type="text"
                        className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                        value={patientEditForm?.nickname || ""}
                        onChange={(e) => setPatientEditForm({ ...patientEditForm, nickname: e.target.value })}
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sexo</p>
                        <select 
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.sex || "2"}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, sex: e.target.value })}
                        >
                            {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Civil</p>
                        <select 
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.maritalStatus || "6"}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, maritalStatus: e.target.value })}
                        >
                            {maritalStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                        <input 
                        type="text"
                        className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                        value={patientEditForm?.cpf || ""}
                        onChange={(e) => setPatientEditForm({ ...patientEditForm, cpf: maskCPF(e.target.value) })}
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RG</p>
                        <input 
                        type="text"
                        className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                        value={patientEditForm?.rg || ""}
                        onChange={(e) => setPatientEditForm({ ...patientEditForm, rg: maskRG(e.target.value) })}
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nascimento</p>
                        <input 
                        type="date"
                        className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                        value={patientEditForm?.birthDate ? new Date(patientEditForm.birthDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => setPatientEditForm({ ...patientEditForm, birthDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profissão</p>
                        <input 
                        type="text"
                        className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                        value={patientEditForm?.profession || ""}
                        onChange={(e) => setPatientEditForm({ ...patientEditForm, profession: e.target.value })}
                        />
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço</p>
                        <div className="flex items-center gap-2 bg-slate-50/50 rounded-xl px-3 py-2 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                            <MapPin size={16} className="text-blue-500" />
                            <input 
                            type="text"
                            placeholder="Rua, Número, Complemento"
                            className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-700 focus:ring-0"
                            value={patientEditForm?.address || ""}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bairro</p>
                        <input 
                            type="text"
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.neighborhood || ""}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, neighborhood: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CEP</p>
                        <input 
                            type="text"
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.zipCode || ""}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, zipCode: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cidade</p>
                        <input 
                            type="text"
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.city || ""}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, city: e.target.value })}
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UF</p>
                        <input 
                            type="text"
                            maxLength={2}
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none text-center"
                            value={patientEditForm?.state || ""}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, state: e.target.value.toUpperCase() })}
                        />
                    </div>
                  </div>
                </div>

                {/* Atendimento */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atendimento</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Convênio</p>
                        <select 
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.convenioId || "1"}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, convenioId: e.target.value })}
                        >
                            {catalogOptions.convenios.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Matrícula</p>
                        <input 
                            type="text"
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.registrationNumber || ""}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, registrationNumber: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dentista Preferencial</p>
                        <select 
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.preferredProfessionalId || "1"}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, preferredProfessionalId: e.target.value })}
                        >
                            {catalogOptions.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Indicação</p>
                        <select 
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.referralTypeId || "3"}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, referralTypeId: e.target.value })}
                        >
                            {referralTypes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Paciente</p>
                        <select 
                            className="w-full bg-slate-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all outline-none"
                            value={patientEditForm?.status || "2"}
                            onChange={(e) => setPatientEditForm({ ...patientEditForm, status: e.target.value })}
                        >
                            {patientStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
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
                    <h3 className="font-bold text-slate-900">Ficha de Saúde (Anamnese Completa)</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Respostas integradas ao banco de dados</p>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {patientEditForm?.anamnesis?.length > 0 ? (
                    patientEditForm.anamnesis.map((item: any, idx: number) => (
                      <div key={idx} className={cn(
                        "p-4 rounded-2xl border flex gap-4 transition-all focus-within:border-blue-500 focus-within:bg-white",
                        item.responseId === '2' ? "bg-rose-50/30 border-rose-100" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          item.responseId === '2' ? "bg-rose-100 text-rose-600" : "bg-white text-slate-400"
                        )}>
                          {item.responseId === '2' ? <AlertTriangle size={20} /> : <Stethoscope size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                {item.question}
                            </p>
                            <input 
                                type="checkbox" 
                                checked={item.responseId === '2'} 
                                onChange={(e) => {
                                    const newAnamnesis = [...patientEditForm.anamnesis];
                                    newAnamnesis[idx].responseId = e.target.checked ? '2' : '0';
                                    setPatientEditForm({ ...patientEditForm, anamnesis: newAnamnesis });
                                }}
                                className="w-3 h-3 accent-blue-600 shrink-0 mt-0.5"
                            />
                          </div>
                          <textarea 
                            rows={4}
                            className={cn(
                              "w-full bg-white/50 border border-slate-100 rounded-lg p-2 mt-2 text-xs font-bold leading-relaxed focus:ring-2 focus:ring-blue-500/10 resize-none outline-none transition-all",
                              item.responseId === '2' ? "text-rose-700 placeholder:text-rose-300 border-rose-100" : "text-slate-700 placeholder:text-slate-300"
                            )}
                            value={item.alert || item.complement || ""}
                            onChange={(e) => {
                                const newAnamnesis = [...patientEditForm.anamnesis];
                                newAnamnesis[idx].complement = e.target.value;
                                newAnamnesis[idx].alert = e.target.value; 
                                setPatientEditForm({ ...patientEditForm, anamnesis: newAnamnesis });
                            }}
                            placeholder="Descreva aqui..."
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <p className="text-sm font-bold uppercase">Carregando anamnese...</p>
                    </div>
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
      </div>
    </div>
  );
}
