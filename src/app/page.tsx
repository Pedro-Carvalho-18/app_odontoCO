"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DetailedTooth } from "@/components/DetailedTooth";
import { 
  Search, 
  History, 
  Plus, 
  Save, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  ClipboardList, 
  CheckCircle2,
  FileText,
  Paperclip,
  Activity,
  Shield,
  Loader2,
  Wallet,
  MousePointer2,
  X,
  FileEdit,
  FolderOpen,
  Upload,
  Clock,
  User,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FilesModal } from "@/components/FilesModal";
import { DetailsModal } from "@/components/DetailsModal";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Procedure {
  id: string;
  nome: string;
  valor: number;
  price: number;
  specialtyId: string;
}

interface Catalog {
  [category: string]: Procedure[];
}

type ToothStatus = 'healthy' | 'caries' | 'restoration' | 'absent' | 'prosthesis';

interface ToothState {
  status: ToothStatus;
  surfaces: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    center: boolean;
  };
}

const initialOdontogram = () => {
  const arc: Record<number, ToothState> = {};
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 
   48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].forEach(n => {
    arc[n] = {
      status: 'healthy',
      surfaces: { top: false, bottom: false, left: false, right: false, center: false }
    };
  });
  return arc;
};

function getVisualToothNumber(internalId: number): number {
  if (internalId >= 1 && internalId <= 8) return 18 - (internalId - 1);
  if (internalId >= 9 && internalId <= 16) return 21 + (internalId - 9);
  if (internalId >= 17 && internalId <= 24) return 48 - (internalId - 17);
  if (internalId >= 25 && internalId <= 32) return 31 + (internalId - 25);
  return 0;
}

export default function PatientRecordPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('lastSelectedPatient');
    if (saved) {
      try {
        setSelectedPatient(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved patient", e);
      }
    }
    setInitialLoadDone(true);
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem('lastSelectedPatient', JSON.stringify(selectedPatient));
    }
  }, [selectedPatient]);

  const [catalogData, setCatalogData] = useState<{
    specialties: any[];
    procedures: any[];
    payments: any[];
    professionals: any[];
    convenios: any[];
  } | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // ... rest of state declarations ...
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("1");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("1");
  const [selectedConvenioId, setSelectedConvenioId] = useState<string>("1");

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isProfessionalExpanded, setIsProfessionalExpanded] = useState(false);
  const [isConvenioExpanded, setIsConvenioExpanded] = useState(false);
  const [procedureSearchTerm, setProcedureSearchTerm] = useState("");
  const [treatmentValue, setTreatmentValue] = useState("");
  const [observation, setObservation] = useState("");
  const [installments, setInstallments] = useState("1");
  const [manualTooth, setManualTooth] = useState("");
  const [procedureDate, setProcedureDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [procedureTime, setProcedureTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [procedureStatus, setProcedureStatus] = useState("A Fazer");
  const [procedureFaces, setProcedureFaces] = useState({ top: false, bottom: false, left: false, right: false, center: false });
  const [discountValue, setDiscountValue] = useState("");
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [initialFilesIntervention, setInitialFilesIntervention] = useState<string | undefined>(undefined);
  const [prescriptionText, setPrescriptionText] = useState("");
  
  // States for new Prescription Workflow
  const [prescriptionStep, setPrescriptionStep] = useState<'assistant' | 'editor'>('assistant');
  const [showMedicationSearch, setShowMedicationSearch] = useState(false);
  const [medicationSearch, setMedicationSearch] = useState("");
  const [prescriptionForm, setPrescriptionForm] = useState({
    professionalId: "1",
    model: "Receita.mod",
    medication: "",
    type: "Adulto",
    quantity: "",
    usage: "",
    observations: "",
  });
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
  const [finalPrescriptionText, setFinalPrescriptionText] = useState("");
  const [medicationsDB, setMedicationsDB] = useState<{ code: number; name: string }[]>([]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [catRes, medRes] = await Promise.all([
            fetch('/api/catalogo'),
            fetch('/api/medicamentos')
        ]);
        const catalogData = await catRes.json();
        const medsData = await medRes.json();
        setCatalogData(catalogData);
        setMedicationsDB(medsData);
      } catch (err) { console.error(err); } finally { setLoadingCatalog(false); }
    }
    loadCatalog();
  }, []);

  const [patientOdontograms, setPatientOdontograms] = useState<Record<string, Record<number, { status: ToothStatus; surfaces: any }>>>({});
  const [modifiedTeeth, setModifiedTeeth] = useState<Record<string, number[]>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollHistory = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchHistory = useCallback(async (patientId: string) => {
    setLoadingHistory(true);
    const pIdStr = String(patientId);
    try {
      const res = await fetch(`/api/pacientes/${pIdStr}/historico`);
      const data = await res.json();
      
      const combined = [
        ...(data.interventions || []), 
        ...(data.history || [])
      ].map((item: any) => {
        // Clean the date string: replace '.' with ' ' if it's in the format YYYY-MM-DD.000
        const cleanDate = item.date ? item.date.replace('.000', '') : new Date().toISOString();
        return {
          ...item,
          fullDate: cleanDate,
          date: cleanDate.split(' ')[0],
          tooth: item.tooth && item.tooth !== "null" ? item.tooth : "N/A"
        };
      });

      // Ordenar pelo timestamp completo (do mais novo para o mais antigo)
      combined.sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());

      const normalized = combined.map(item => {
        const numericValue = typeof item.value === 'number' ? item.value : parseFloat(String(item.value || 0));
        return {
          ...item,
          formattedValue: numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        };
      });

      const newOdontogram = initialOdontogram();
      // Processar do mais antigo para o mais novo para reconstruir o estado atual
      [...normalized].reverse().forEach(item => {
        let toothNum = parseInt(item.tooth);
        if (isNaN(toothNum) && item.internalToothId) toothNum = getVisualToothNumber(parseInt(item.internalToothId));
        if (isNaN(toothNum) || !newOdontogram[toothNum]) return;
        
        if (item.dentalStatus !== undefined && item.dentalStatus !== null) {
          const status = String(item.dentalStatus).toLowerCase();
          if (status.includes('extracao') || status.includes('ausente')) newOdontogram[toothNum].status = 'absent';
          else if (status.includes('canal') || status.includes('bloco') || status.includes('coroa') || status.includes('fixa')) newOdontogram[toothNum].status = 'restoration';
          else if (status.includes('implante') || status.includes('total') || status.includes('pontica')) newOdontogram[toothNum].status = 'prosthesis';
          else if (status.includes('carie')) newOdontogram[toothNum].status = 'caries';
          else if (status === '' || status === 'null') {
             newOdontogram[toothNum].status = 'healthy';
          }
        }
        
        if (item.FACE1 !== undefined && item.FACE1 !== null) {
          if (String(item.FACE1) === '-1') newOdontogram[toothNum].surfaces.top = true;
          else if (String(item.FACE1) === '0') newOdontogram[toothNum].surfaces.top = false;
          
          if (String(item.FACE2) === '-1') newOdontogram[toothNum].surfaces.left = true;
          else if (String(item.FACE2) === '0') newOdontogram[toothNum].surfaces.left = false;
          
          if (String(item.FACE3) === '-1') newOdontogram[toothNum].surfaces.bottom = true;
          else if (String(item.FACE3) === '0') newOdontogram[toothNum].surfaces.bottom = false;
          
          if (String(item.FACE4) === '-1') newOdontogram[toothNum].surfaces.right = true;
          else if (String(item.FACE4) === '0') newOdontogram[toothNum].surfaces.right = false;
          
          if (String(item.FACE5) === '-1') newOdontogram[toothNum].surfaces.center = true;
          else if (String(item.FACE5) === '0') newOdontogram[toothNum].surfaces.center = false;
        }
      });

      // Filtrar itens únicos para exibição na lista de histórico
      const unique = normalized.filter((item, index, self) =>
        index === self.findIndex((t) => (t.id === item.id && t.type === item.type))
      );

      setPatientOdontograms(prev => ({ ...prev, [pIdStr]: newOdontogram }));
      setHistory(unique);
    } catch (err) { 
      console.error("Erro ao buscar histórico:", err); 
    } finally { 
      setLoadingHistory(false); 
    }
  }, []);

  const handleSavePrescription = async () => {
    if (!selectedPatient || !prescriptionText) return;
    const newItem = { id: Date.now(), type: 'history', date: new Date().toISOString(), procedure: `Receitado: ${prescriptionText}`, status: "Concluído", professional: "Sistema", value: "R$ 0,00", numericValue: 0, notes: "Prescrição gerada pelo sistema." };
    setHistory(prev => [newItem, ...prev]);
    setPrescriptionText("");
    setShowPrescriptionModal(false);
  };

  useEffect(() => {
    if (!initialLoadDone) return;
    async function loadPatients() {
      try {
        const res = await fetch(`/api/pacientes?page=${page}&q=${searchTerm}`);
        const data = await res.json();
        const patientsList = data?.patients || [];
        if (page === 1) {
          setPatients(patientsList);
          if (patientsList.length > 0 && !selectedPatient) setSelectedPatient(patientsList[0]);
        } else {
          setPatients(prev => [...prev, ...patientsList]);
        }
        setHasMore(data?.hasMore ?? false);
      } catch (err) { console.error(err); } finally { setLoadingPatients(false); }
    }
    loadPatients();
  }, [searchTerm, page, selectedPatient, initialLoadDone]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/catalogo');
        const data = await res.json();
        setCatalogData(data);
      } catch (err) { console.error(err); } finally { setLoadingCatalog(false); }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (selectedPatient) fetchHistory(selectedPatient.id);
  }, [selectedPatient, fetchHistory]);

  const handleSaveAll = async () => {
    if (!selectedPatient) {
      alert("Erro: Nenhum paciente selecionado para salvar.");
      return;
    }
    const pId = String(selectedPatient.id);
    const currentOdontogram = patientOdontograms[pId] || initialOdontogram();
    const patientMods = modifiedTeeth[pId] || [];
    
    // Novas intervenções lançadas pelo modal
    const newInterventions = history.filter(h => typeof h.id === 'number');
    
    // Alterações manuais no odontograma (clicando no dente)
    const manualMods = patientMods.map(toothNum => ({ 
      id: Date.now() + Math.random(), 
      date: new Date().toISOString(), 
      tooth: toothNum.toString(), 
      procedure: "Alteração Odontograma", 
      status: "Concluído", 
      professional: "Sistema", 
      value: "R$ 0,00", 
      numericValue: 0, 
      notes: "Alteração manual.", 
      toothData: currentOdontogram[toothNum] 
    }));
    
    // Garantir que novas intervenções também enviem toothData se tiverem um dente associado
    const updatedInterventions = newInterventions.map(inter => {
      const tNum = parseInt(inter.tooth);
      if (!isNaN(tNum) && currentOdontogram[tNum]) {
        return { ...inter, toothData: currentOdontogram[tNum] };
      }
      return inter;
    });

    const allToSave = [...updatedInterventions, ...manualMods];
    
    if (allToSave.length === 0) {
      alert(`Nenhuma alteração detectada.\n- Novas intervenções pendentes: ${newInterventions.length}\n- Dentes modificados: ${patientMods.length} (${patientMods.join(', ')})\n- ID do Paciente: ${pId}`);
      return;
    }

    setLoadingHistory(true);
    try {
      console.log(`[FRONTEND] Sending ${allToSave.length} items to save for patient ${pId}`);
      const res = await fetch(`/api/pacientes/${pId}/salvar`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ interventions: allToSave, odontogram: currentOdontogram }) 
      });
      
      if (res.ok) {
        setModifiedTeeth(prev => ({ ...prev, [pId]: [] }));
        await fetchHistory(pId);
        alert("Alterações salvas com sucesso!");
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar no servidor: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) { 
      console.error(err); 
      alert("Erro crítico: Falha ao conectar com a API de salvamento.");
    } finally { 
      setLoadingHistory(false); 
    }
  };

  const updateTooth = (number: number, status: ToothStatus, surfaces: any) => {
    if (!selectedPatient) return;
    const pId = String(selectedPatient.id);
    
    setModifiedTeeth(prev => { 
      const current = prev[pId] || []; 
      if (current.includes(number)) return prev;
      return { ...prev, [pId]: [...current, number] }; 
    });
    
    setPatientOdontograms(prev => ({ 
      ...prev, 
      [pId]: { 
        ...(prev[pId] || initialOdontogram()), 
        [number]: { status, surfaces: { ...surfaces } } 
      } 
    }));
  };

  const handleToothClick = (number: number) => { 
    setSelectedTooth(number); 
    setManualTooth(number.toString()); 
  };

  const formatCurrencyInput = (val: string) => {
    // Keep only numbers
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) return "";
    // Treat as value in cents, divide by 100
    const floatVal = parseFloat(numericVal) / 100;
    return floatVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleLaunchTreatment = async () => {
    if (!selectedTreatment || !selectedPatient) return;
    
    setLoadingHistory(true);
    
    const prof = catalogData?.professionals?.find(p => p.id === selectedProfessionalId)?.name || "Clínica";
    const pay = catalogData?.payments?.find(p => p.id === selectedPaymentId)?.name || "PIX";
    const conv = catalogData?.convenios?.find(p => p.id === selectedConvenioId)?.name || "Particular";
    
    const baseValStr = treatmentValue.replace(/\D/g, '');
    const baseVal = parseFloat(baseValStr) / 100 || 0;
    
    const discStr = discountValue.replace(/\D/g, '');
    const disc = parseFloat(discStr) / 100 || 0;
    
    const finalVal = Math.max(0, baseVal - disc);
    
    console.log("DEBUG LAUNCH:", { baseVal, disc, finalVal, installments });
    
    const toothNum = manualTooth || selectedTooth?.toString() || "Geral";
    
    const newItem = { 
      id: Date.now(), 
      type: 'intervention', 
      date: procedureDate, 
      tooth: toothNum, 
      procedure: selectedTreatment || "Procedimento", 
      status: procedureStatus, 
      professional: prof, 
      value: finalVal, 
      numericValue: finalVal, 
      notes: `${procedureTime} | Convênio: ${conv} | Pagamento: ${pay} (${installments}x) | Desconto: R$ ${disc.toFixed(2)} | ${observation}`,
      installments: installments,
      toothData: toothNum !== "Geral" && toothNum.length <= 2 ? {
        status: 'restoration', 
        surfaces: procedureFaces
      } : undefined
    };
    
    console.log("DEBUG: Saving new item:", newItem);
    
    try {
      const pId = String(selectedPatient.id);
      const res = await fetch(`/api/pacientes/${pId}/salvar`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ interventions: [newItem], odontogram: patientOdontograms[pId] || initialOdontogram() }) 
      });
      
      if (res.ok) {
        await fetchHistory(pId);
        alert(`Procedimento "${selectedTreatment}" lançado e salvo com sucesso no prontuário!`);
        setShowLaunchModal(false);
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar no servidor: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) { 
      console.error(err); 
      alert("Erro crítico: Falha ao conectar com a API de salvamento.");
    } finally { 
      setLoadingHistory(false); 
    }
  };

  const upperJaw = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerJaw = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  if (!selectedPatient && !loadingPatients) return <div className="p-20 text-center font-black uppercase text-slate-400">Carregando...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="w-full px-6 py-2 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-50 shadow-sm gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
          {(isSearchFocused || searchTerm) && patients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
              {patients.map(p => (
                <button key={p.id} onClick={() => {setSelectedPatient(p); setSearchTerm("");}} className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-black">{p.name[0]}</div>
                  <span className="font-black text-xs uppercase">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedPatient && (
            <>
              <button onClick={() => router.push(`/pacientes/${selectedPatient.id}?tab=dados`)} className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-black uppercase hover:bg-slate-200 transition-colors" title="Ver Perfil do Paciente">
                {selectedPatient.name}
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button onClick={() => setShowFilesModal(true)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all" title="Arquivos"><FolderOpen size={18} /></button>
              <button onClick={() => setShowPrescriptionModal(true)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all" title="Receituário"><FileEdit size={18} /></button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
            </>
          )}
          <button onClick={() => setShowLaunchModal(true)} className="px-4 py-2 flex items-center gap-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-black text-[10px] uppercase"><Plus size={16} /> Novo Lançamento</button>
          <button onClick={handleSaveAll} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase">Salvar</button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col p-3 gap-3">
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm relative flex flex-col items-center justify-center p-4 overflow-auto custom-scrollbar">
           <div className="absolute top-4 left-6 flex items-center gap-2 text-slate-300">
              <Shield size={16} /><span className="text-[9px] font-black uppercase tracking-[0.3em]">Odontograma</span>
           </div>
           <div className="flex flex-col gap-2 w-full items-center my-auto">
              <div className="flex justify-center items-end gap-1 flex-nowrap">
                 {upperJaw.map((n, i) => (
                   <div key={n} className="flex items-end gap-0.5 shrink-0">
                      <DetailedTooth number={n} status={patientOdontograms[selectedPatient?.id || ""]?.[n]?.status} surfaces={patientOdontograms[selectedPatient?.id || ""]?.[n]?.surfaces} onChange={updateTooth} onSelect={handleToothClick} isSelected={selectedTooth === n} />
                      {i === 7 && <div className="w-px h-12 bg-slate-100 mx-2" />}
                   </div>
                 ))}
              </div>
              <div className="flex justify-center items-start gap-1 flex-nowrap">
                 {lowerJaw.map((n, i) => (
                   <div key={n} className="flex items-start gap-0.5 shrink-0">
                      <DetailedTooth number={n} status={patientOdontograms[selectedPatient?.id || ""]?.[n]?.status} surfaces={patientOdontograms[selectedPatient?.id || ""]?.[n]?.surfaces} onChange={updateTooth} onSelect={handleToothClick} isSelected={selectedTooth === n} />
                      {i === 7 && <div className="w-px h-12 bg-slate-100 mx-2" />}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="h-[245px] bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative group">
           <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><History size={14} className="text-blue-600" /><h3 className="text-[10px] font-black uppercase tracking-widest">Atendimentos</h3></div>
              <div className="flex items-center gap-2">
                 {selectedPatient && (
                   <button onClick={() => router.push(`/pacientes/${selectedPatient.id}?tab=historico`)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all font-black text-[9px] uppercase" title="Ver Prontuário Completo">
                     <ClipboardList size={14} /> Prontuário
                   </button>                 )}
              </div>
           </div>
           <div className="flex-1 relative overflow-hidden flex items-center">
              <button onClick={() => scrollHistory('left')} className="absolute left-2 z-10 p-2 bg-white/80 shadow-lg rounded-full hover:bg-white transition-all"><ChevronLeft size={20} /></button>
              <button onClick={() => scrollHistory('right')} className="absolute right-2 z-10 p-2 bg-white/80 shadow-lg rounded-full hover:bg-white transition-all"><ChevronRight size={20} /></button>
              <div ref={scrollContainerRef} className="flex-1 overflow-x-auto p-5 flex gap-4 scroll-smooth hide-scrollbar px-10">
                 {history.map((item, idx) => (
                   <div key={idx} onClick={() => { setActiveHistoryItem(item); setShowDetailsModal(true); }} className="w-60 shrink-0 p-4 rounded-3xl border border-slate-100 bg-white flex flex-col gap-2 hover:shadow-xl transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                         <span className="text-[8px] font-black text-slate-400 uppercase">
  {(() => {
    const [y, m, d] = item.date.split('-');
    return `${d}/${m}/${y}`;
  })()}
</span>
                         <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Dente {item.tooth}</span>
                      </div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase line-clamp-2 leading-tight h-7">
                        {(() => {
                           const parts = item.procedure.split('|');
                           // If the first part is 'PROCEDIMENTO: ' or empty, try the second part
                           let name = parts[0].replace('PROCEDIMENTO:', '').trim();
                           if (!name || name === 'PROCEDIMENTO:' || name.length < 3) {
                              return parts.length > 1 ? parts[1].trim() : name;
                           }
                           return name;
                        })()}
                      </h4>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
                         <div className="flex flex-col">
                            <span className="text-[7px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{item.professional}</span>
                            <span className={cn(
                               "text-[7px] font-black uppercase mt-0.5",
                               (item.paidInstallments || 0) >= (Number(item.totalInstallments || item.installments) || 1) ? "text-emerald-600" : "text-rose-600"
                            )}>
                               {(item.paidInstallments || 0) >= (Number(item.totalInstallments || item.installments) || 1) ? "Pago Total" : `Pendente (${item.paidInstallments || 0}/${Number(item.totalInstallments || item.installments) || 1})`}
                            </span>
                         </div>
                         <span className="text-[10px] font-black text-emerald-600">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.numericValue || item.value)}
                         </span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {showLaunchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full h-full flex flex-col">
            <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
               <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 text-white rounded-xl"><Plus size={20} /></div><h3 className="text-sm font-black uppercase">Novo Lançamento</h3></div>
               <button onClick={() => setShowLaunchModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex">
               <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar catálogo..." value={procedureSearchTerm} onChange={(e) => setProcedureSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                     </div>
                     {selectedTreatment && (
                        <button onClick={() => { setSelectedTreatment(null); setSelectedTreatmentId(null); setTreatmentValue(""); }} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all" title="Limpar seleção">
                           <X size={16} />
                        </button>
                     )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                     {catalogData?.specialties?.map(specialty => {
                        const procs = catalogData.procedures.filter(p => p.specialtyId === specialty.id && p.name?.toLowerCase().includes(procedureSearchTerm.toLowerCase()));
                        if (procs.length === 0) return null;
                        
                        const isExpanded = procedureSearchTerm.length > 0 || expandedCategories.includes(specialty.id);
                        
                        return (
                           <div key={specialty.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                              <button 
                                onClick={() => setExpandedCategories(prev => prev.includes(specialty.id) ? prev.filter(id => id !== specialty.id) : [...prev, specialty.id])}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                              >
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{specialty.name}</p>
                                <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isExpanded ? "rotate-180" : "")} />
                              </button>
                              
                              {isExpanded && (
                                 <div className="p-2 space-y-1">
                                    {procs.map(i => (
                                       <button key={i.id} onClick={() => {setSelectedTreatment(i.name); setSelectedTreatmentId(i.id); setTreatmentValue(i.price.toString());}} className={cn("w-full text-left p-3 rounded-xl text-[10px] font-bold border transition-all", selectedTreatmentId === i.id ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-100 hover:bg-blue-50")}>{i.name}</button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
               <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                  <div className="max-w-3xl mx-auto space-y-2">
                     
                     <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Data</label><input type="date" value={procedureDate} onChange={e => setProcedureDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none h-[32px]" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Horário</label><input type="time" value={procedureTime} onChange={e => setProcedureTime(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none h-[32px]" /></div>
                        <div className="space-y-1 col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Status</label>
                           <div className="flex bg-white rounded-xl border border-slate-200 p-1 h-[32px]">
                              <button onClick={() => setProcedureStatus("A Fazer")} className={cn("flex-1 text-[10px] font-bold rounded-lg transition-colors", procedureStatus === "A Fazer" ? "bg-amber-100 text-amber-700" : "text-slate-400 hover:bg-slate-50")}>Pendente</button>
                              <button onClick={() => setProcedureStatus("Concluído")} className={cn("flex-1 text-[10px] font-bold rounded-lg transition-colors", procedureStatus === "Concluído" ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-slate-50")}>Concluído</button>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Dente / Região</label>
                              <input type="text" placeholder="Ex: 16, Sup, Geral" value={manualTooth} onChange={e => setManualTooth(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none h-[32px]" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Faces (Opcional)</label>
                              <div className="flex gap-1.5">
                                 {['top', 'bottom', 'left', 'right', 'center'].map((face) => {
                                    const labels: any = { top: 'V', bottom: 'L', left: 'D', right: 'M', center: 'O' };
                                    return (
                                       <button key={face} onClick={() => setProcedureFaces(p => ({ ...p, [face]: !(p as any)[face] }))} className={cn("flex-1 h-[32px] rounded-xl text-[10px] font-black border-2 transition-all", (procedureFaces as any)[face] ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-400")}>{labels[face]}</button>
                                    );
                                 })}
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2">
                            <div className="space-y-1 relative">
                               <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Profissional</label>
                               <div className="bg-white border border-slate-200 rounded-xl">
                                  <button onClick={() => {setIsProfessionalExpanded(!isProfessionalExpanded); setIsConvenioExpanded(false);}} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl outline-none h-[32px]">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{catalogData?.professionals?.find(p => p.id === selectedProfessionalId)?.name || "Selecione..."}</p>
                                    <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isProfessionalExpanded ? "rotate-180" : "")} />
                                  </button>
                               </div>
                               {isProfessionalExpanded && (
                                  <div className="absolute top-[44px] left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto rounded-xl p-1">
                                     {catalogData?.professionals?.map(p => <button key={p.id} onClick={() => { setSelectedProfessionalId(p.id); setIsProfessionalExpanded(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold border-b border-transparent transition-all", selectedProfessionalId === p.id ? "bg-blue-600 text-white" : "hover:bg-slate-100")}>{p.name}</button>)}
                                  </div>
                               )}
                            </div>
                            <div className="space-y-1 relative">
                               <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Convênio</label>
                               <div className="bg-white border border-slate-200 rounded-xl">
                                  <button onClick={() => {setIsConvenioExpanded(!isConvenioExpanded); setIsProfessionalExpanded(false);}} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl outline-none h-[32px]">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{catalogData?.convenios?.find(c => c.id === selectedConvenioId)?.name || "Selecione..."}</p>
                                    <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isConvenioExpanded ? "rotate-180" : "")} />
                                  </button>
                               </div>
                               {isConvenioExpanded && (
                                  <div className="absolute top-[44px] left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto rounded-xl p-1">
                                     {catalogData?.convenios?.map(c => <button key={c.id} onClick={() => { setSelectedConvenioId(c.id); setIsConvenioExpanded(false); }} className={cn("w-full text-left p-2 rounded-lg text-[10px] font-bold border-b border-transparent transition-all", selectedConvenioId === c.id ? "bg-slate-800 text-white" : "hover:bg-slate-100")}>{c.name}</button>)}
                                  </div>
                               )}
                            </div>
                        </div>
                     </div>

                     <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pagamento</label><select value={selectedPaymentId} onChange={e => setSelectedPaymentId(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold outline-none h-[32px]">{catalogData?.payments?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Parcelas</label><select value={installments} onChange={e => setInstallments(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold outline-none h-[32px]">{[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}</select></div>
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor Original</label><input type="text" placeholder="R$ 0,00" value={treatmentValue} onChange={e => setTreatmentValue(formatCurrencyInput(e.target.value))} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 outline-none h-[32px]" /></div>
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Desconto</label><input type="text" placeholder="R$ 0,00" value={discountValue} onChange={e => setDiscountValue(formatCurrencyInput(e.target.value))} className="w-full p-2 bg-rose-50 rounded-xl border border-rose-100 text-xs font-bold text-rose-700 outline-none placeholder:text-rose-300 h-[32px]" /></div>
                        </div>
                        <textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Notas técnicas..." className="w-full p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] h-10 outline-none resize-none" />
                     </div>
                  </div>
               </div>
            </div>
            <div className="px-6 py-[19px] border-t border-slate-200 bg-white flex items-center justify-between shadow-2xl">
               <div className="flex flex-col"><p className="text-[9px] font-black text-slate-400 uppercase">Procedimento</p><p className="text-lg font-black uppercase text-slate-800">{selectedTreatment || "Nenhum"}</p></div>
               <div className="flex items-center gap-4"><button onClick={() => setShowLaunchModal(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100">Cancelar</button><button onClick={handleLaunchTreatment} disabled={!selectedTreatment} className={cn("px-10 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg", selectedTreatment ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400")}>Lançar no Prontuário</button></div>
            </div>
          </div>
        </div>
      )}
      
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full h-full flex flex-col">
            <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl"><FileEdit size={20} /></div>
                  <h3 className="text-sm font-black uppercase">
                     {prescriptionStep === 'assistant' ? 'Assistente de Receitas' : 'Editor de Textos'}
                  </h3>
               </div>
               <button onClick={() => setShowPrescriptionModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>
            
            {prescriptionStep === 'assistant' && (
               <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-100 p-2">
                  <div className="w-full max-w-2xl max-h-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                     <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cirurgião</label>
                              <select 
                                 value={prescriptionForm.professionalId} 
                                 onChange={(e) => setPrescriptionForm({...prescriptionForm, professionalId: e.target.value})}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                              >
                                 {catalogData?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo de Receituário</label>
                              <select 
                                 value={prescriptionForm.model} 
                                 onChange={(e) => setPrescriptionForm({...prescriptionForm, model: e.target.value})}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                              >
                                 <option value="Receita.mod">Receita.mod</option>
                                 <option value="Branco">Texto em Branco</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                           <input type="text" value={selectedPatient?.name || ""} disabled className="w-full p-2 bg-teal-400 text-white rounded-lg text-xs font-black outline-none" />
                        </div>

                        <div className="space-y-1 relative">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicamento</label>
                           <div className="flex gap-2">
                              <input 
                                 type="text" 
                                 value={prescriptionForm.medication} 
                                 onChange={(e) => {
                                    setPrescriptionForm({...prescriptionForm, medication: e.target.value});
                                    if (!showMedicationSearch) setShowMedicationSearch(true);
                                 }}
                                 onFocus={() => setShowMedicationSearch(true)}
                                 className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" 
                                 placeholder="Buscar..."
                              />
                              <button onClick={() => setShowMedicationSearch(!showMedicationSearch)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                 <Search size={16} />
                              </button>
                           </div>
                           
                           {showMedicationSearch && (
                              <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-slate-200 shadow-2xl rounded-xl z-50 p-2 flex flex-col gap-1 max-h-40 overflow-y-auto" onMouseLeave={() => setShowMedicationSearch(false)}>
                                 {medicationsDB.filter(m => m.name.toLowerCase().includes(prescriptionForm.medication.toLowerCase())).map(med => (
                                    <button 
                                       key={med.code} 
                                       onClick={() => {
                                          setPrescriptionForm({...prescriptionForm, medication: med.name});
                                          setShowMedicationSearch(false);
                                       }}
                                       className="w-full text-left p-1.5 hover:bg-blue-50 text-[10px] font-bold border-b border-slate-50 last:border-0"
                                    >
                                       {med.name}
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        <div className="flex gap-4">
                           <div className="w-1/4 space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prescrição</label>
                              <div className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                 <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer"><input type="radio" name="rx_type" checked={prescriptionForm.type === "Adulto"} onChange={() => setPrescriptionForm({...prescriptionForm, type: "Adulto"})} className="w-3 h-3" /> Adulto</label>
                                 <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer"><input type="radio" name="rx_type" checked={prescriptionForm.type === "Criança"} onChange={() => setPrescriptionForm({...prescriptionForm, type: "Criança"})} className="w-3 h-3" /> Criança</label>
                              </div>
                           </div>
                           <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd</label>
                                 <input type="text" value={prescriptionForm.quantity} onChange={(e) => setPrescriptionForm({...prescriptionForm, quantity: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Uso</label>
                                 <input type="text" value={prescriptionForm.usage} onChange={(e) => setPrescriptionForm({...prescriptionForm, usage: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                              </div>
                              <div className="col-span-2 space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
                                 <input type="text" value={prescriptionForm.observations} onChange={(e) => setPrescriptionForm({...prescriptionForm, observations: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                              </div>
                           </div>
                        </div>
                        
                        {prescriptionItems.length > 0 && (
                           <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens ({prescriptionItems.length})</p>
                              <ul className="text-[10px] font-bold space-y-0.5">
                                 {prescriptionItems.map((item, idx) => (<li key={idx}>• {item.medication}</li>))}
                              </ul>
                           </div>
                        )}
                     </div>
                     <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button onClick={() => {
                           if (!prescriptionForm.medication) return;
                           setPrescriptionItems([...prescriptionItems, {...prescriptionForm}]);
                           setPrescriptionForm({...prescriptionForm, medication: "", quantity: "", usage: "", observations: ""});
                        }} className="px-4 py-2 rounded-lg font-black text-[10px] uppercase bg-white border border-slate-300 text-slate-600 hover:bg-slate-50">Incluir</button>
                        <button onClick={() => {
                           let items = [...prescriptionItems];
                           if (prescriptionForm.medication) items.push({...prescriptionForm});
                           if (items.length === 0) { alert("Adicione um medicamento."); return; }

                           let docText = `\n\n\n\n\nPara\n${selectedPatient?.name}\n\n`;
                           items.forEach((item, index) => {
                              docText += `${String(index + 1).padStart(2, '0')} - ${item.medication}\n      tomar ${item.quantity || '1'} de ${item.usage} ${item.observations ? '('+item.observations+')' : ''}\n\n`;
                           });
                           
                           const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
                           docText += `\n\n\nAraraquara, ${today}\n\n\n___________________________________\nDr(a). ${catalogData?.professionals?.find(p => p.id === prescriptionForm.professionalId)?.name || 'Profissional'}`;
                           
                           setFinalPrescriptionText(docText);
                           setPrescriptionStep('editor');
                        }} className="px-6 py-2 rounded-lg font-black text-[10px] uppercase bg-blue-600 text-white shadow-lg hover:bg-blue-700">Finalizar</button>
                     </div>
                  </div>
               </div>
            )}

            {prescriptionStep === 'editor' && (
               <div className="flex-1 overflow-hidden flex flex-col bg-slate-200 p-8 items-center">
                  <div className="w-full max-w-4xl bg-white shadow-2xl flex-1 rounded-sm border border-slate-300 flex flex-col overflow-hidden">
                     <div className="h-12 bg-slate-100 border-b border-slate-300 flex items-center px-4 gap-4 text-xs font-bold text-slate-600">
                        <div className="flex gap-2">
                           <button className="px-3 py-1 hover:bg-slate-200 rounded">Arquivo</button>
                           <button className="px-3 py-1 hover:bg-slate-200 rounded">Editar</button>
                           <button className="px-3 py-1 hover:bg-slate-200 rounded">Formatar</button>
                        </div>
                        <div className="w-px h-6 bg-slate-300" />
                        <div className="flex gap-2 items-center">
                           <span className="font-serif">Times New Roman</span>
                           <span className="font-serif">11</span>
                           <div className="w-4 h-4 bg-black rounded-sm" />
                        </div>
                     </div>
                     <div className="flex-1 p-16 overflow-y-auto bg-white">
                        <textarea 
                           value={finalPrescriptionText}
                           onChange={(e) => setFinalPrescriptionText(e.target.value)}
                           className="w-full h-full resize-none outline-none font-serif text-[15px] leading-relaxed"
                           spellCheck="false"
                        />
                     </div>
                  </div>
               </div>
            )}

            {prescriptionStep === 'editor' && (
               <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between shadow-2xl">
                  <button onClick={() => setPrescriptionStep('assistant')} className="px-6 py-4 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100">Voltar ao Assistente</button>
                  <div className="flex gap-4">
                     <button onClick={() => {
                        window.print();
                     }} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-800 text-white shadow-lg flex items-center gap-2 hover:bg-slate-900">
                        <Printer size={16} /> Imprimir
                     </button>
                     <button onClick={async () => {
                        if (!selectedPatient || !finalPrescriptionText) return;
                        
                        try {
                           const res = await fetch(`/api/pacientes/${selectedPatient.id}/salvar-receita`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ text: finalPrescriptionText }) 
                           });
                           if (!res.ok) throw new Error("Falha ao salvar arquivo");
                           
                           const meds = prescriptionItems.map(i => i.medication).join(', ');
                           const newItem = { 
                              id: Date.now(), 
                              type: 'history', 
                              date: new Date().toISOString(), 
                              procedure: `Receitado: ${meds}`, 
                              status: "Concluído", 
                              professional: catalogData?.professionals?.find(p => p.id === prescriptionForm.professionalId)?.name || "Sistema", 
                              value: "R$ 0,00", 
                              numericValue: 0, 
                              notes: "Receita gerada e salva como arquivo." 
                           };
                           setHistory(prev => [newItem, ...prev]);
                           
                           alert("Prescrição gravada no prontuário e arquivo salvo com sucesso!");
                           setShowPrescriptionModal(false);
                           setPrescriptionItems([]);
                           setPrescriptionStep('assistant');
                        } catch (err) {
                           console.error(err);
                           alert("Erro ao salvar arquivo da receita.");
                        }
                     }} className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase bg-rose-600 text-white shadow-lg hover:bg-rose-700">
                        Gravar no Prontuário
                     </button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {selectedPatient && (
        <FilesModal isOpen={showFilesModal} onClose={() => setShowFilesModal(false)} patientId={selectedPatient.id} patientName={selectedPatient.name} interventions={history.filter(h => h.type === 'intervention')} initialSelectedIntervention={initialFilesIntervention} />
      )}
      <DetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} item={activeHistoryItem} />
    </div>
  );
}
