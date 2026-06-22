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
  Folder,
  FolderOpen,
  Upload,
  Clock,
  User,
  Printer,
  Pill,
  Smile,
  Layers,
  Zap,
  Droplets,
  Scissors,
  Grid,
  ShieldCheck,
  Baby,
  Camera,
  Syringe,
  Eye,
  Heart,
  Maximize,
  AlertCircle,
  FileBadge,
  DollarSign,
  Microscope,
  Stethoscope,
  Scan,
  Layout,
  Menu
} from "lucide-react";
import { cn, normalizeString } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FilesModal } from "@/components/FilesModal";
import { DetailsModal } from "@/components/DetailsModal";
import { ReceiptModal } from "@/components/ReceiptModal";

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
  latestIcon?: string;
  procedureName?: string;
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
      latestIcon: undefined,
      procedureName: undefined,
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [showOdontoInfo, setShowOdontoInfo] = useState(false);
  const isFetchingRef = useRef(false);

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

  // Handle patient selection and action from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patientId');
    const action = params.get('action');

    if (patientId) {
      const fetchPatient = async () => {
        try {
          const res = await fetch(`/api/pacientes/${patientId}`);
          if (res.ok) {
            const data = await res.json();
            const patientObj = { id: data.id, name: data.name, phone: data.phone, email: data.email };
            setSelectedPatient(patientObj);
            
            if (action === 'new_budget') {
              setShowLaunchModal(true);
            }
          }
        } catch (err) {
          console.error("Error selecting patient from URL:", err);
        }
      };
      fetchPatient();
    }
  }, []);

  const [catalogData, setCatalogData] = useState<{
    specialties: any[];
    procedures: any[];
    payments: any[];
    professionals: any[];
    convenios: any[];
    motivosAtestado: any[];
  } | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // ... rest of state declarations ...
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [selectedTreatmentIcon, setSelectedTreatmentIcon] = useState<string | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<any[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("1");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("none");
  const [selectedConvenioId, setSelectedConvenioId] = useState<string>("1");

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isProfessionalExpanded, setIsProfessionalExpanded] = useState(false);
  const [isConvenioExpanded, setIsConvenioExpanded] = useState(false);
  const [procedureSearchTerm, setProcedureSearchTerm] = useState("");
  const [isProcedureSearchFocused, setIsProcedureSearchFocused] = useState(false);
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
  const [isPaid, setIsPaid] = useState(false);
  const [procedureFaces, setProcedureFaces] = useState({ top: false, bottom: false, left: false, right: false, center: false });
  const [discountValue, setDiscountValue] = useState("");
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
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

  // States for Atestado Workflow
  const [atestadoStep, setAtestadoStep] = useState<'assistant' | 'editor'>('assistant');
  const [atestadoForm, setAtestadoForm] = useState({
    professionalId: "1",
    motivoId: "1",
    periodoInicio: new Date().toISOString().split('T')[0],
    periodoFim: new Date().toISOString().split('T')[0],
    horarioInicio: "08:00",
    horarioFim: "09:00",
    observacoes: "",
    usaHorario: true
  });
  const [finalAtestadoText, setFinalAtestadoText] = useState("");

  // States for Consent Form (Termo de Consentimento) Workflow
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentStep, setConsentStep] = useState<'assistant' | 'editor'>('assistant');
  const [consentForm, setConsentForm] = useState({
    professionalId: "1",
    procedureDescription: "",
    observacoes: "",
  });
  const [finalConsentText, setFinalConsentText] = useState("");
  const [medicationsDB, setMedicationsDB] = useState<{ 
    code: number; 
    name: string;
    posologyAdult?: string;
    quantityAdult?: string;
    posologyChild?: string;
    quantityChild?: string;
    usage?: string;
  }[]>([]);

  const handleMedicationSelect = (med: any, type: string = prescriptionForm.type) => {
    setPrescriptionForm({
      ...prescriptionForm,
      medication: med.name,
      type: type,
      quantity: type === "Adulto" ? (med.quantityAdult || "") : (med.quantityChild || ""),
      usage: med.usage || "",
      observations: type === "Adulto" ? (med.posologyAdult || "") : (med.posologyChild || "")
    });
    setShowMedicationSearch(false);
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [catRes, medRes] = await Promise.all([
            fetch('/api/catalogo', { cache: 'no-store' }),
            fetch('/api/medicamentos', { cache: 'no-store' })
        ]);
        const catalogData = await catRes.json();
        const medsData = await medRes.json();
        setCatalogData(catalogData);
        setMedicationsDB(medsData);
      } catch (err) { console.error(err); } finally { setLoadingCatalog(false); }
    }
    loadCatalog();
  }, []);

  const [patientOdontograms, setPatientOdontograms] = useState<Record<string, Record<number, ToothState>>>({});
  const [modifiedTeeth, setModifiedTeeth] = useState<Record<string, number[]>>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const diagCategories = [
    {
      id: 'ausencia',
      name: 'Ausência',
      icon: 'dia_auscoroa.bmp',
      items: [
        { name: 'Faltante', icon: 'dia_auscoroa.bmp' },
        { name: 'Cárie', icon: 'dia_lesao.bmp' },
        { name: 'Aus. Coroa', icon: 'dia_auscoroa.bmp' },
        { name: 'Aus. Raiz', icon: 'dia_ausraiz.bmp' },
        { name: 'Impactado', icon: 'dia_impactado.bmp' },
        { name: 'Incluso', icon: 'dia_incluso.bmp' },
        { name: 'Semi', icon: 'dia_semi.bmp' },
        { name: 'Supranum.', icon: 'dia_supranum.bmp' },
      ]
    },
    {
      id: 'posicao',
      name: 'Posição',
      icon: 'dia_extrusao.bmp',
      items: [
        { name: 'Extrusão', icon: 'dia_extrusao.bmp' },
        { name: 'Intrusão', icon: 'dia_intrusao.bmp' },
        { name: 'Giroversão', icon: 'dia_giroversao.bmp' },
      ]
    },
    {
      id: 'lesao',
      name: 'Lesão',
      icon: 'dia_lesao.bmp',
      items: [
        { name: 'Lesão', icon: 'dia_lesao.bmp' },
        { name: 'Fratura', icon: 'dia_fratura.bmp' },
        { name: 'Fissura', icon: 'dia_fissura.bmp' },
        { name: 'Trepanacao', icon: 'dia_trepanacao.bmp' },
        { name: 'Erosão', icon: 'dia_erosao.bmp' },
        { name: 'Descalcif.', icon: 'dia_descalcif.bmp' },
      ]
    },
    {
      id: 'anomalias',
      name: 'Geral',
      icon: 'dia_distal.bmp',
      items: [
        { name: 'Mesial', icon: 'dia_mesial.bmp' },
        { name: 'Distal', icon: 'dia_distal.bmp' },
        { name: 'Fluorose', icon: 'dia_fluorose.bmp' },
      ]
    }
  ];

  const [activeDiagCategoryId, setActiveDiagCategoryId] = useState<string | null>(null);
  const [subDiagStartIndex, setSubDiagStartIndex] = useState(0);

  const intCategories = [
    { 
      id: 'restaura', 
      name: 'Restauração', 
      icon: 'int_restaura.bmp',
      specialtyId: '1',
      items: [
        { name: 'Restaura', icon: 'int_restaura.bmp' },
        { name: 'Rest. O', icon: 'int_RestO.bmp' },
        { name: 'Rest. MO', icon: 'int_RestMO.bmp' },
        { name: 'Rest. DO', icon: 'int_RestDO.bmp' },
        { name: 'Rest. MOD', icon: 'int_RestMOD.bmp' },
        { name: 'Adesiva', icon: 'int_adesiva.bmp' },
      ]
    },
    { 
      id: 'cirur', 
      name: 'Cirurgia', 
      icon: 'int_cirur.bmp',
      specialtyId: '6',
      items: [
        { name: 'Cirurgia', icon: 'int_cirur.bmp' },
        { name: 'Apicecto.', icon: 'int_apicecto.bmp' },
        { name: 'Frenecto.', icon: 'int_frenec.bmp' },
        { name: 'Gengivec.', icon: 'int_gengivec.bmp' },
        { name: 'Hemissec.', icon: 'int_hemi.bmp' },
        { name: 'Rizecto.', icon: 'int_rizec.bmp' },
      ]
    },
    { 
      id: 'ortho', 
      name: 'Orto', 
      icon: 'int_bracket.bmp',
      specialtyId: '7',
      items: [
        { name: 'Bracket', icon: 'int_bracket.bmp' },
        { name: 'Banda', icon: 'int_banda.bmp' },
        { name: 'Attach', icon: 'int_attach.bmp' },
        { name: 'Manut.', icon: 'int_manut.bmp' },
        { name: 'Manut. G', icon: 'int_manuten.bmp' },
        { name: 'Móvel', icon: 'int_movel.bmp' },
      ]
    },
    { 
      id: 'endo', 
      name: 'Endo', 
      icon: 'int_canal.bmp',
      specialtyId: '3',
      items: [
        { name: 'Canal', icon: 'int_canal.bmp' },
        { name: 'Pulpo', icon: 'int_pulpo.bmp' },
        { name: 'Capeam.', icon: 'int_capea.bmp' },
        { name: 'Trepanação', icon: 'dia_trepanacao.bmp' },
      ]
    },
    { 
      id: 'protese', 
      name: 'Prótese', 
      icon: 'int_coroa.bmp',
      specialtyId: '2',
      items: [
        { name: 'Coroa', icon: 'int_coroa.bmp' },
        { name: 'Prótese', icon: 'int_protese.bmp' },
        { name: 'Prótese F', icon: 'int_fixa.bmp' },
        { name: 'Núcleo', icon: 'int_nucleo.bmp' },
        { name: 'Reemb.', icon: 'int_reemb.bmp' },
        { name: 'Prótese T', icon: 'int_total.bmp' },
      ]
    },
    { 
      id: 'implant', 
      name: 'Implante', 
      icon: 'esp_Implantodontia.bmp',
      specialtyId: '13',
      items: [
        { name: 'Implante', icon: 'int_implante.bmp' },
        { name: 'Enxerto', icon: 'int_enxerto.bmp' },
        { name: 'Aumento', icon: 'int_aumen.bmp' },
      ]
    },
    { 
      id: 'estetica', 
      name: 'Estética', 
      icon: 'esp_Estética.bmp',
      specialtyId: '12',
      items: [
        { name: 'Claream.', icon: 'int_bran.bmp' },
        { name: 'Faceta', icon: 'int_faceta.bmp' },
        { name: 'Polim.', icon: 'int_poli.bmp' },
      ]
    },
    { 
      id: 'kids', 
      name: 'Odontopediatria', 
      icon: 'esp_Odontopediatria.bmp',
      specialtyId: '9',
      items: [
        { name: 'Escovação', icon: 'int_escova.bmp' },
        { name: 'Selante', icon: 'int_selante.bmp' },
        { name: 'Flúor', icon: 'int_fluor.bmp' },
      ]
    },
    { 
      id: 'prevent', 
      name: 'Prevenção', 
      icon: 'int_prof.bmp',
      specialtyId: '8',
      items: [
        { name: 'Prof.', icon: 'int_prof.bmp' },
        { name: 'Raspag.', icon: 'int_raspagem.bmp' },
        { name: 'Rasp. G', icon: 'int_raspger.bmp' },
        { name: 'Selante', icon: 'int_selante.bmp' },
        { name: 'Fotos', icon: 'int_fotos.bmp' },
      ]
    },
    { 
      id: 'geral', 
      name: 'Geral', 
      icon: 'int_consulta.bmp',
      specialtyId: '5',
      items: [
        { name: 'Consulta', icon: 'int_consulta.bmp' },
        { name: 'Emerg.', icon: 'int_emerg.bmp' },
        { name: 'Placa', icon: 'int_placa.bmp' },
        { name: 'Peric.', icon: 'int_peric.bmp' },
        { name: 'Túnel', icon: 'int_tunel.bmp' },
      ]
    }
  ];

  const [activeIntCategoryId, setActiveIntCategoryId] = useState<string | null>(null);
  const [subIntStartIndex, setSubIntStartIndex] = useState(0);

  const [iconStartIndex, setIconStartIndex] = useState(0);
  const [diagStartIndex, setDiagStartIndex] = useState(0);
  const [intStartIndex, setIntStartIndex] = useState(0);
  const [isDiagExpanded, setIsDiagExpanded] = useState(false);
  const [isIntExpanded, setIsIntExpanded] = useState(false);
  const [isTreatmentsExpanded, setIsTreatmentsExpanded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      const res = await fetch(`/api/pacientes/${pIdStr}/historico`, { cache: 'no-store' });
      const data = await res.json();
      
      const combined = [
        ...(data.interventions || []), 
        ...(data.history || [])
      ].map((item: any) => {
        // Clean the date string: replace '.' with ' ' if it's in the format YYYY-MM-DD.000
        const cleanDate = item.date ? item.date.replace('.000', '') : new Date().toISOString();
        const createdAt = item.createdAt ? item.createdAt.replace('.000', '').replace(' ', 'T') : null;
        return {
          ...item,
          fullDate: createdAt || cleanDate.replace(' ', 'T'),
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

      // 1. Aplicar o estado clínico consolidado vindo da API (Estado Atual Real)
      if (data.clinicalState && Array.isArray(data.clinicalState)) {
        data.clinicalState.forEach((item: any) => {
          const toothNum = getVisualToothNumber(parseInt(item.internalToothId));
          if (!newOdontogram[toothNum]) return;

          const status = String(item.dentalStatus || "").toLowerCase().trim();
          
          if (status.includes('extracao') || status.includes('ausente')) {
            newOdontogram[toothNum].status = 'absent';
          } else if (status.includes('canal')) {
            newOdontogram[toothNum].status = 'restoration';
          } else if (status.includes('implante') || status.includes('total') || status.includes('pontica') || status.includes('coroa') || status.includes('fixa') || status.includes('bloco')) {
            newOdontogram[toothNum].status = 'prosthesis';
          } else if (status.includes('carie')) {
            newOdontogram[toothNum].status = 'caries';
          } else {
            newOdontogram[toothNum].status = 'healthy';
          }

          if (item.FACE1 !== undefined && item.FACE1 !== null) {
            newOdontogram[toothNum].surfaces.top = String(item.FACE1) === '-1';
            newOdontogram[toothNum].surfaces.right = String(item.FACE2) === '-1';
            newOdontogram[toothNum].surfaces.bottom = String(item.FACE3) === '-1';
            newOdontogram[toothNum].surfaces.left = String(item.FACE4) === '-1';
            newOdontogram[toothNum].surfaces.center = String(item.FACE5) === '-1';
          }
          if (item.latestIcon) {
            newOdontogram[toothNum].latestIcon = item.latestIcon;
            newOdontogram[toothNum].procedureName = item.procedureName;
          }
        });
      }

      // Filtrar itens únicos para exibição na lista de histórico
      const unique = normalized.filter((item, index, self) =>
        index === self.findIndex((t) => (t.id === item.id && t.type === item.type)) &&
        !item.procedure?.includes("Alteração Odontograma")
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

  const fetchPatients = useCallback(async (pageNum = 1, query = "", append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (pageNum === 1) setLoadingPatients(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/pacientes?page=${pageNum}&q=${query}&limit=20`);
      const data = await res.json();
      const patientsList = data?.patients || [];
      
      if (append) {
        setPatients(prev => [...prev, ...patientsList]);
      } else {
        setPatients(patientsList);
        if (patientsList.length > 0 && !selectedPatient && pageNum === 1) {
          // setSelectedPatient(patientsList[0]); // Don't auto-select to avoid surprising the user
        }
      }
      setHasMore(data?.hasMore ?? false);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoadingPatients(false); 
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (!initialLoadDone) return;
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchPatients(1, searchTerm, false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, initialLoadDone, fetchPatients]);

  const handleSearchScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !isFetchingRef.current && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPatients(nextPage, searchTerm, true);
    }
  };

  useEffect(() => {
    if (selectedPatient) fetchHistory(selectedPatient.id);
  }, [selectedPatient, fetchHistory]);

  const handleSaveAll = async (silent = false) => {
    if (!selectedPatient) {
      if (!silent) alert("Erro: Nenhum paciente selecionado para salvar.");
      return;
    }
    const pId = String(selectedPatient.id);
    const currentOdontogram = patientOdontograms[pId] || initialOdontogram();
    const patientMods = modifiedTeeth[pId] || [];
    
    // Novas intervenções lançadas pelo modal que AINDA NÃO FORAM SALVAS (ids numéricos gerados localmente)
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
      if (!silent) alert(`Nenhuma alteração detectada.`);
      return;
    }

    if (!silent) setLoadingHistory(true);
    setIsAutoSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${pId}/salvar`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ interventions: allToSave, odontogram: currentOdontogram }) 
      });
      
      if (res.ok) {
        // Limpar apenas os dentes que enviamos agora
        setModifiedTeeth(prev => ({ ...prev, [pId]: [] }));
        await fetchHistory(pId);
        if (!silent) alert("Alterações salvas com sucesso!");
      } else {
        const errData = await res.json();
        if (!silent) alert(`Erro ao salvar no servidor: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) { 
      console.error(err); 
      if (!silent) alert("Erro crítico: Falha ao conectar com a API de salvamento.");
    } finally { 
      if (!silent) setLoadingHistory(false); 
      setIsAutoSaving(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!selectedPatient || !initialLoadDone) return;
    
    const pId = String(selectedPatient.id);
    const hasUnsavedInterventions = history.some(h => typeof h.id === 'number');
    const hasModifiedTeeth = (modifiedTeeth[pId]?.length || 0) > 0;

    if (hasUnsavedInterventions || hasModifiedTeeth) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSaveAll(true);
      }, 2000);
    }
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [patientOdontograms, history, selectedPatient, initialLoadDone]);

  const findProcedureInCatalog = useCallback((name: string) => {
    if (!catalogData?.procedures) return null;
    const normalizedSearch = normalizeString(name);
    
    // 1. Tenta correspondência exata primeiro (prioridade máxima)
    const exactMatch = catalogData.procedures.find(p => normalizeString(p.name) === normalizedSearch);
    if (exactMatch) return exactMatch;

    // 2. Tenta encontrar os que COMEÇAM com o termo (ex: "Coroa" deve bater com "Coroa/Metal" antes de "Aumento de Coroa")
    const startingMatches = catalogData.procedures
      .filter(p => normalizeString(p.name).startsWith(normalizedSearch))
      .sort((a, b) => a.name.length - b.name.length); // Prefere o nome mais curto
    if (startingMatches.length > 0) return startingMatches[0];

    // 3. Tenta encontrar uma correspondência parcial em qualquer lugar
    const partialMatches = catalogData.procedures
      .filter(p => normalizeString(p.name).includes(normalizedSearch))
      .sort((a, b) => a.name.length - b.name.length);
    return partialMatches.length > 0 ? partialMatches[0] : null;
  }, [catalogData]);

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
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) return "R$ 0,00";
    const floatVal = parseFloat(numericVal) / 100;
    return floatVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const executeLaunch = async (
    pId: string, 
    procedureName: string, 
    toothNum: string, 
    procedureId: string = '0', 
    price: number = 0, 
    icon?: string | null,
    isDiagnostic: boolean = false
  ) => {
    setLoadingHistory(true);
    const timestamp = Date.now();
    const prof = catalogData?.professionals?.find(p => p.id === selectedProfessionalId)?.name || "Clínica";
    const pay = catalogData?.payments?.find(p => p.id === selectedPaymentId)?.name || "PIX";
    const conv = catalogData?.convenios?.find(p => p.id === selectedConvenioId)?.name || "Particular";
    
    let currentOdontogram = { ...(patientOdontograms[pId] || initialOdontogram()) };
    const tNumInt = parseInt(toothNum);
    
    if (!isNaN(tNumInt) && currentOdontogram[tNumInt]) {
      const procLower = procedureName.toLowerCase();
      if (procLower.includes('extra') || procLower.includes('ausen') || procLower.includes('faltante')) {
        currentOdontogram[tNumInt].status = 'absent';
        currentOdontogram[tNumInt].latestIcon = 'dia_auscoroa.bmp';
      } else if (procLower.includes('canal')) {
        currentOdontogram[tNumInt].status = 'restoration';
      } else if (procLower.includes('implante') || procLower.includes('total') || procLower.includes('pontica') || (procLower.includes('coroa') && !procLower.includes('aumento')) || procLower.includes('fixa') || procLower.includes('bloco') || procLower.includes('protese')) {
        currentOdontogram[tNumInt].status = 'prosthesis';
      } else if (procLower.includes('carie')) {
        currentOdontogram[tNumInt].status = 'caries';
        currentOdontogram[tNumInt].latestIcon = 'dia_lesao.bmp';
      }

      if (icon) {
        currentOdontogram[tNumInt].latestIcon = icon;
        currentOdontogram[tNumInt].procedureName = procedureName;
        const iconLower = icon.toLowerCase();
        if (iconLower.includes('carie')) currentOdontogram[tNumInt].status = 'caries';
        else if (iconLower.includes('aus') || iconLower.includes('incluso') || iconLower.includes('faltante')) currentOdontogram[tNumInt].status = 'absent';
        else if (iconLower.includes('lesao') || iconLower.includes('fratura') || iconLower.includes('fissura')) currentOdontogram[tNumInt].status = 'caries';
      }
    }

    const typeLabel = isDiagnostic ? "DIAGNÓSTICO" : "PROCEDIMENTO";

    const newItem = { 
      id: timestamp, 
      type: 'intervention', 
      date: procedureDate, 
      tooth: toothNum, 
      procedure: procedureName, 
      status: procedureStatus, 
      professional: prof, 
      professionalId: selectedProfessionalId,
      paymentMethodId: selectedPaymentId,
      paymentMethod: pay,
      isPaid: isPaid,
      value: price, 
      numericValue: price, 
      procedureId: procedureId,
      notes: `${typeLabel}: ${procedureName} | ${procedureTime} | Convênio: ${conv} | Pagamento: ${pay} (${installments}x) | ${observation}`,
      installments: installments,
      toothData: tNumInt && !isNaN(tNumInt) ? currentOdontogram[tNumInt] : undefined
    };

    try {
      const res = await fetch(`/api/pacientes/${pId}/salvar`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ interventions: [newItem], odontogram: currentOdontogram }) 
      });
      
      if (res.ok) {
        const tInt = parseInt(toothNum);
        if (!isNaN(tInt)) {
          setModifiedTeeth(prev => ({
            ...prev,
            [pId]: (prev[pId] || []).filter(n => n !== tInt)
          }));
        }
        setHistory(prev => prev.filter(h => typeof h.id !== 'number'));
        setPatientOdontograms(prev => ({ ...prev, [pId]: currentOdontogram }));
        await fetchHistory(pId);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLaunchTreatment = async () => {
    if ((selectedProcedures.length === 0 && !selectedTreatment) || !selectedPatient) return;
    
    const baseValStr = treatmentValue.replace(/\D/g, '');
    const baseVal = (parseInt(baseValStr) || 0) / 100;
    const discStr = discountValue.replace(/\D/g, '');
    const disc = (parseInt(discStr) || 0) / 100;
    const finalTotal = Math.max(0, baseVal - disc);
    
    const toothNum = manualTooth || selectedTooth?.toString() || "Geral";
    const proceduresToLaunch = selectedProcedures.length > 0 ? selectedProcedures : [{ name: selectedTreatment, price: baseVal, id: selectedTreatmentId }];
    const combinedName = proceduresToLaunch.map(p => p.name).join(" + ");
    const procId = proceduresToLaunch[0]?.id || selectedTreatmentId || '0';

    const success = await executeLaunch(
      String(selectedPatient.id),
      combinedName,
      toothNum,
      procId,
      finalTotal,
      selectedTreatmentIcon
    );

    if (success) {
      alert(`Procedimento "${combinedName}" lançado com sucesso!`);
      setSelectedProcedures([]);
      setSelectedTreatment(null);
      setSelectedTreatmentId(null);
      setSelectedTreatmentIcon(null);
      setTreatmentValue("");
      setDiscountValue("");
      setObservation("");
      setSelectedPaymentId("1");
      setInstallments("1");
      setShowLaunchModal(false);
    } else {
      alert("Erro ao salvar no servidor.");
    }
  };

  const upperJaw = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerJaw = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  if (!initialLoadDone) return <div className="flex h-screen items-center justify-center font-black uppercase text-slate-400">Carregando...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      <header className="w-full px-6 py-2 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-50 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          {/* Search Bar (Expandable on hover) */}
          <div className="relative group">
            <div className={cn(
              "flex items-center bg-slate-100 border border-slate-200 rounded-xl transition-all duration-500 ease-in-out h-10 overflow-hidden",
              searchTerm || isSearchFocused ? "w-80 shadow-md bg-white border-blue-200" : "w-10 hover:w-80 hover:shadow-md hover:bg-white hover:border-blue-200"
            )}>
              <div className="min-w-[40px] flex items-center justify-center text-slate-400">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Pesquisar paciente..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onFocus={() => setIsSearchFocused(true)} 
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} 
                className={cn(
                  "w-full bg-transparent outline-none text-xs font-bold pr-4 transition-opacity duration-300",
                  searchTerm || isSearchFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} 
              />
            </div>

            {(isSearchFocused || searchTerm) && patients.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2"
                onScroll={handleSearchScroll}
              >
                {patients.map(p => (
                  <button key={p.id} onClick={() => {setSelectedPatient(p); setSearchTerm("");}} className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-black">{p.name[0]}</div>
                    <span className="font-black text-xs uppercase">{p.name}</span>
                  </button>
                ))}
                {loadingMore && (
                  <div className="p-3 text-center">
                    <Loader2 size={16} className="animate-spin mx-auto text-blue-600" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Patient Profile */}
          {selectedPatient && (
            <button 
              onClick={() => router.push(`/pacientes/${selectedPatient.id}?tab=dados`)} 
              className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-[12px] font-black uppercase hover:bg-slate-200 transition-colors shadow-sm whitespace-nowrap" 
              title="Ver Perfil do Paciente"
            >
              <User size={16} className="text-blue-600" />
              <span className="text-slate-800">{selectedPatient.name}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedPatient && (
            <>
              {/* Carrossel de Ícones de Diagnóstico (Categorizado) */}
              <div className="relative group">
                <div className={cn(
                  "flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm ml-2 transition-all duration-500 overflow-hidden",
                  isDiagExpanded ? "max-w-[500px]" : "max-w-[52px]"
                )}>
                  <button 
                    onClick={() => {
                      const next = !isDiagExpanded;
                      setIsDiagExpanded(next);
                      if (!next) {
                        setActiveDiagCategoryId(null);
                      }
                      if (next) { setIsIntExpanded(false); setIsTreatmentsExpanded(false); }
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all flex items-center justify-center shrink-0",
                      isDiagExpanded ? "bg-rose-50 text-rose-500" : "hover:bg-white text-blue-600"
                    )}
                    title={isDiagExpanded ? "Fechar" : "Abrir Diagnóstico"}
                  >
                    {isDiagExpanded ? <X size={20} /> : <img src="/icones/app/esp_Diagnóstico.bmp" alt="Diagnóstico" className="w-7 h-7 object-contain" />}
                  </button>

                  {isDiagExpanded && (
                    <div className="flex items-center gap-2.5 shrink-0 px-1">
                       {diagCategories.map((cat) => (
                          <button 
                            key={cat.id}
                            title={cat.name}
                            onClick={() => {
                               if (activeDiagCategoryId === cat.id) {
                                  setActiveDiagCategoryId(null);
                               } else {
                                  setActiveDiagCategoryId(cat.id);
                                  setSubDiagStartIndex(0);
                               }
                            }}
                            className={cn(
                              "group relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 border-2",
                              activeDiagCategoryId === cat.id 
                                ? "bg-white border-blue-500 shadow-md scale-105" 
                                : "border-transparent hover:bg-white hover:border-slate-200"
                            )}
                          >
                             <img 
                               src={`/icones/app/${cat.icon}`} 
                               alt={cat.name} 
                               className="w-7 h-7 object-contain transition-all"
                             />
                             <span className="absolute -bottom-1 text-[7px] font-black uppercase tracking-tighter text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                               {cat.name}
                             </span>
                          </button>
                       ))}
                    </div>
                  )}
                </div>

                {/* Sub-carrossel de Variações de Diagnóstico */}
                {isDiagExpanded && activeDiagCategoryId && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[60] flex items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <button 
                      onClick={() => {
                        const items = diagCategories.find(c => c.id === activeDiagCategoryId)?.items || [];
                        setSubDiagStartIndex(prev => (prev - 1 + items.length) % items.length);
                      }}
                      className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-0.5 max-w-[400px] overflow-hidden">
                      {(diagCategories.find(c => c.id === activeDiagCategoryId)?.items || [])
                        .map((_, i, all) => all[(subDiagStartIndex + i) % all.length])
                        .slice(0, 6)
                        .map((item, idx) => (
                          <button 
                            key={idx}
                            title={item.name}
                            onClick={async () => {
                               if (!selectedPatient) {
                                  alert("Selecione um paciente primeiro.");
                                  return;
                               }
                               
                               const toothNum = selectedTooth?.toString() || "Geral";
                               const success = await executeLaunch(
                                  selectedPatient.id,
                                  item.name,
                                  toothNum,
                                  '0', // No procedureId for simple diagnostics
                                  0,   // No price for diagnostics
                                  item.icon,
                                  true // isDiagnostic = true
                               );

                               if (success) {
                                  // No alert needed for direct clinical marks, but we could add a toast here
                               } else {
                                  alert("Erro ao registrar diagnóstico.");
                               }
                            }}
                            className="group relative flex flex-col items-center p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100"
                          >
                             <img 
                               src={`/icones/app/${item.icon}`} 
                               alt={item.name} 
                               className="w-6 h-6 object-contain transition-all group-hover:scale-110"
                             />
                             <span className="text-[7px] font-black uppercase mt-1 text-slate-500 group-hover:text-blue-600 whitespace-nowrap">
                               {item.name}
                             </span>
                          </button>
                        ))
                      }
                    </div>

                    <button 
                      onClick={() => {
                        const items = diagCategories.find(c => c.id === activeDiagCategoryId)?.items || [];
                        setSubDiagStartIndex(prev => (prev + 1) % items.length);
                      }}
                      className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <ChevronRight size={14} />
                    </button>

                    <div className="h-6 w-px bg-slate-100 mx-1" />
                    
                    <button 
                      onClick={() => setActiveDiagCategoryId(null)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Fechar Variações"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-slate-200 mx-1" />

              {/* Carrossel de Ícones de Intervenções (Unificado com Especialidades) */}
              <div className="relative group">
                <div className={cn(
                  "flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm ml-1 transition-all duration-500 overflow-hidden",
                  isIntExpanded ? "max-w-[800px]" : "max-w-[52px]"
                )}>
                  <button 
                    onClick={() => {
                      const next = !isIntExpanded;
                      setIsIntExpanded(next);
                      if (!next) {
                        setActiveIntCategoryId(null);
                      }
                      if (next) { setIsDiagExpanded(false); }
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all flex items-center justify-center shrink-0",
                      isIntExpanded ? "bg-rose-50 text-rose-500" : "hover:bg-white text-blue-600"
                    )}
                    title={isIntExpanded ? "Fechar" : "Abrir Plano de Tratamento"}
                  >
                    {isIntExpanded ? <X size={20} /> : <img src="/icones/app/esp_Gerais.bmp" alt="Plano de Tratamento" className="w-7 h-7 object-contain" />}
                  </button>

                  {isIntExpanded && (
                    <div className="flex items-center gap-2.5 shrink-0 px-1">
                       {intCategories.map((cat) => (
                          <button 
                            key={cat.id}
                            title={cat.name}
                            onClick={() => {
                               if (activeIntCategoryId === cat.id) {
                                  setActiveIntCategoryId(null);
                               } else {
                                  setActiveIntCategoryId(cat.id);
                                  setSubIntStartIndex(0);
                               }
                            }}
                            className={cn(
                              "group relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 border-2",
                              activeIntCategoryId === cat.id 
                                ? "bg-white border-blue-500 shadow-md scale-105" 
                                : "border-transparent hover:bg-white hover:border-slate-200"
                            )}
                          >
                             <img 
                               src={`/icones/app/${cat.icon}`} 
                               alt={cat.name} 
                               className="w-7 h-7 object-contain transition-all"
                             />
                             <span className="absolute -bottom-1 text-[7px] font-black uppercase tracking-tighter text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                               {cat.name}
                             </span>
                          </button>
                       ))}
                    </div>
                  )}
                </div>

                {/* Sub-carrossel de Variações + Botão Ver Tudo */}
                {isIntExpanded && activeIntCategoryId && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[60] flex items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <button 
                      onClick={() => {
                        const items = intCategories.find(c => c.id === activeIntCategoryId)?.items || [];
                        setSubIntStartIndex(prev => (prev - 1 + items.length) % items.length);
                      }}
                      className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-0.5 max-w-[480px] overflow-hidden">
                      {(intCategories.find(c => c.id === activeIntCategoryId)?.items || [])
                        .map((_, i, all) => all[(subIntStartIndex + i) % all.length])
                        .slice(0, 6)
                        .map((item, idx) => (
                          <button 
                            key={idx}
                            title={item.name}
                            onClick={() => {
                               const proc = findProcedureInCatalog(item.name);
                               setSelectedTreatmentIcon(item.icon); 
                               setSelectedTreatment(item.name); // SEMPRE usa o nome literal do carrossel
                               if (proc) {
                                  setSelectedTreatmentId(proc.id);
                                  setSelectedProcedures([proc]);
                                  setTreatmentValue(formatCurrencyInput(Math.round((proc.price || 0) * 100).toString()));
                               } else {
                                  setSelectedTreatmentId(null);
                                  setSelectedProcedures([]);
                                  setTreatmentValue("R$ 0,00");
                               }
                               setManualTooth(selectedTooth ? selectedTooth.toString() : "");
                               setShowLaunchModal(true);
                            }}
                            className="group relative flex flex-col items-center p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-100"
                          >
                             <img 
                               src={`/icones/app/${item.icon}`} 
                               alt={item.name} 
                               className="w-6 h-6 object-contain transition-all group-hover:scale-110"
                             />
                             <span className="text-[7px] font-black uppercase mt-1 text-slate-500 group-hover:text-blue-600 whitespace-nowrap">
                               {item.name}
                             </span>
                          </button>
                        ))
                      }

                      {/* Botão Dinâmico "Ver Tudo" da Especialidade */}
                      <button 
                        onClick={() => {
                           const cat = intCategories.find(c => c.id === activeIntCategoryId);
                           if (cat) {
                              setExpandedCategories([cat.specialtyId]);
                              setSelectedTreatment(null);
                              setSelectedTreatmentId(null);
                              setSelectedProcedures([]);
                              setTreatmentValue("");
                              setProcedureSearchTerm("");
                              setManualTooth(selectedTooth ? selectedTooth.toString() : "");
                              setShowLaunchModal(true);
                           }
                        }}
                        className="group relative flex flex-col items-center p-2 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100 shrink-0"
                      >
                         <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                            <Plus size={14} />
                         </div>
                         <span className="text-[7px] font-black uppercase mt-1 text-blue-600 whitespace-nowrap">
                            Ver Tudo
                         </span>
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        const items = intCategories.find(c => c.id === activeIntCategoryId)?.items || [];
                        setSubIntStartIndex(prev => (prev + 1) % items.length);
                      }}
                      className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <ChevronRight size={14} />
                    </button>

                    <div className="h-6 w-px bg-slate-100 mx-1" />

                    <button 
                      onClick={() => setActiveIntCategoryId(null)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Fechar Variações"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-slate-200 mx-2" />
              
              {/* Menu de Ferramentas Clínicas (Vertical Dropdown) */}
              <div className="relative">
                <button 
                  onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} 
                  className={cn(
                    "p-2.5 rounded-xl transition-all shadow-sm border",
                    isActionMenuOpen ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                  title="Ferramentas Clínicas"
                >
                  <Menu size={20} />
                </button>

                {isActionMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[140]" onClick={() => setIsActionMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 flex flex-col gap-1">
                        <button 
                          onClick={() => { setShowPrescriptionModal(true); setIsActionMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-all group"
                        >
                          <Pill size={18} className="text-slate-400 group-hover:text-blue-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider">Receituário</span>
                        </button>
                        
                        <button 
                          onClick={() => { setShowAtestadoModal(true); setIsActionMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 rounded-xl transition-all group"
                        >
                          <FileBadge size={18} className="text-slate-400 group-hover:text-emerald-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider">Gerar Atestado</span>
                        </button>

                        <button 
                          onClick={() => { setShowConsentModal(true); setIsActionMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl transition-all group"
                        >
                          <ShieldCheck size={18} className="text-slate-400 group-hover:text-indigo-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider">Termo de Consentimento</span>
                        </button>

                        <button 
                          onClick={() => { setShowReceiptModal(true); setIsActionMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl transition-all group"
                        >
                          <DollarSign size={18} className="text-slate-400 group-hover:text-rose-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider">Gerar Recibo</span>
                        </button>

                        {selectedPatient && (
                          <button 
                            onClick={() => { setShowFilesModal(true); setIsActionMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-slate-700 hover:text-amber-600 rounded-xl transition-all group border-t border-slate-50 mt-1"
                          >
                            <Folder size={18} className="text-slate-400 group-hover:text-amber-500" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Arquivos / Docs</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col p-3 gap-3">
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm relative flex flex-col items-center justify-center p-4 overflow-auto custom-scrollbar">
           <div className="absolute top-4 left-6 flex items-center gap-2 text-slate-300">
              <Shield size={16} /><span className="text-[9px] font-black uppercase tracking-[0.3em]">Odontograma</span>
           </div>

           {selectedPatient && (
             <div className="absolute top-4 right-6 z-30">
               <button 
                 onClick={() => setShowOdontoInfo(!showOdontoInfo)}
                 className={cn(
                   "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                   showOdontoInfo ? "bg-blue-600 border-blue-700 text-white shadow-md" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300"
                 )}
               >
                 <span className="text-[12px] font-black italic">i</span>
               </button>

               {showOdontoInfo && (
                 <>
                   <div className="fixed inset-0 z-[35]" onClick={() => setShowOdontoInfo(false)} />
                   <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[40] p-5 animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Legenda do Odontograma</h4>
                     
                     <div className="space-y-4">
                       <section className="space-y-2">
                         <p className="text-[9px] font-black uppercase text-slate-500 mb-1.5">Cores de Fundo</p>
                         <div className="grid grid-cols-2 gap-2">
                           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white border border-slate-200" /><span className="text-[9px] font-bold text-slate-600 uppercase">Saudável</span></div>
                           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-50 border border-rose-200" /><span className="text-[9px] font-bold text-slate-600 uppercase">Cárie</span></div>
                           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /><span className="text-[9px] font-bold text-slate-600 uppercase">Restauração</span></div>
                           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-50 border border-amber-200" /><span className="text-[9px] font-bold text-slate-600 uppercase">Prótese</span></div>
                         </div>
                       </section>

                       <section className="space-y-2">
                         <p className="text-[9px] font-black uppercase text-slate-500 mb-1.5">Símbolos e Marcas</p>
                         <div className="space-y-2">
                           <div className="flex items-center gap-3">
                             <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-rose-500 font-black text-xs">X</div>
                             <span className="text-[9px] font-bold text-slate-600 uppercase leading-tight">Dente Ausente / Extraído</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="w-6 h-6 border-2 border-blue-500 bg-blue-100 rounded-sm" />
                             <span className="text-[9px] font-bold text-slate-600 uppercase leading-tight">Faces Tratadas (Em Azul no envelope)</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="w-6 h-1 bg-blue-600 rounded-full" />
                             <span className="text-[9px] font-bold text-slate-600 uppercase leading-tight">Texto Azul: Nome do último procedimento</span>
                           </div>
                         </div>
                       </section>

                       <p className="text-[8px] font-medium text-slate-400 italic mt-2 leading-relaxed">
                         O ícone do dente é atualizado automaticamente para refletir o desenho do último tratamento realizado.
                       </p>
                     </div>
                   </div>
                 </>
               )}
             </div>
           )}
           
           {!selectedPatient ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-4 mt-8">
                 <User size={48} className="text-slate-200" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum Paciente Selecionado</h2>
                 <p className="text-[10px] font-bold">Use a barra de pesquisa acima para encontrar um paciente.</p>
              </div>
           ) : (
             <div className="flex w-full items-center justify-center relative px-12">
                <div className="flex flex-col gap-6 items-center my-auto">
                   <div className="flex justify-center items-end gap-1.5 flex-nowrap">
                      {upperJaw.map((n, i) => (
                        <div key={n} className="flex items-end gap-1 shrink-0">
                           <DetailedTooth 
                             number={n} 
                             status={patientOdontograms[selectedPatient?.id || ""]?.[n]?.status} 
                             latestIcon={patientOdontograms[selectedPatient?.id || ""]?.[n]?.latestIcon}
                             procedureName={patientOdontograms[selectedPatient?.id || ""]?.[n]?.procedureName}
                             surfaces={patientOdontograms[selectedPatient?.id || ""]?.[n]?.surfaces} 
                             onSelect={handleToothClick} 
                             isSelected={selectedTooth === n} 
                           />
                           {i === 7 && <div className="w-px h-16 bg-slate-100 mx-3" />}
                        </div>
                      ))}
                   </div>
                   <div className="flex justify-center items-start gap-1.5 flex-nowrap">
                      {lowerJaw.map((n, i) => (
                        <div key={n} className="flex items-start gap-1 shrink-0">
                           <DetailedTooth 
                             number={n} 
                             status={patientOdontograms[selectedPatient?.id || ""]?.[n]?.status} 
                             latestIcon={patientOdontograms[selectedPatient?.id || ""]?.[n]?.latestIcon}
                             procedureName={patientOdontograms[selectedPatient?.id || ""]?.[n]?.procedureName}
                             surfaces={patientOdontograms[selectedPatient?.id || ""]?.[n]?.surfaces} 
                             onSelect={handleToothClick} 
                             isSelected={selectedTooth === n} 
                           />
                           {i === 7 && <div className="w-px h-16 bg-slate-100 mx-3" />}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
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
              <div 
                ref={scrollContainerRef} 
                className="flex-1 overflow-x-auto p-5 flex gap-4 scroll-smooth px-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                 {history.filter(h => !h.procedure.includes("Alteração Odontograma")).map((item, idx) => (
                   <HistoryItem 
                     key={idx} 
                     item={item} 
                     onClick={() => { setActiveHistoryItem(item); setShowDetailsModal(true); }} 
                   />
                 ))}
              </div>
           </div>
        </div>
      </main>

            {showLaunchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full h-full flex flex-col">
            <div className="px-8 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
               <div className="flex items-center gap-2.5">
                 <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg">
                   <Plus size={16} />
                 </div>
                 <h3 className="text-[12px] font-black uppercase text-slate-900">
                   Novo Lançamento - {catalogData?.specialties?.find(s => s.id === expandedCategories[0])?.name || "Geral"}
                 </h3>
               </div>
               <button onClick={() => setShowLaunchModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex justify-center bg-slate-50">
               <div className="w-full p-8 overflow-y-auto custom-scrollbar">
                  <div className="max-w-6xl mx-auto space-y-4">
                     
                     {/* LINHA 1: Data, Hora e Status */}
                     <div className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm">
                        <div className="grid grid-cols-3 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Data do Procedimento</label>
                              <input type="date" value={procedureDate} onChange={e => setProcedureDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-900 outline-none h-[48px]" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Horário</label>
                              <input type="time" value={procedureTime} onChange={e => setProcedureTime(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-900 outline-none h-[48px]" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Status</label>
                              <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1 h-[48px]">
                                 <button onClick={() => setProcedureStatus("A Fazer")} className={cn("flex-1 text-[11px] font-black rounded-lg transition-colors", procedureStatus === "A Fazer" ? "bg-amber-100 text-amber-900" : "text-slate-500 hover:bg-slate-100")}>PENDENTE</button>
                                 <button onClick={() => setProcedureStatus("Concluído")} className={cn("flex-1 text-[11px] font-black rounded-lg transition-colors", procedureStatus === "Concluído" ? "bg-emerald-100 text-emerald-900" : "text-slate-500 hover:bg-slate-100")}>CONCLUÍDO</button>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* LINHA 2: Dentista e Paciente */}
                     <div className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1.5 relative">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Dentista Responsável</label>
                              <button onClick={() => {setIsProfessionalExpanded(!isProfessionalExpanded); setIsConvenioExpanded(false);}} className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors rounded-xl outline-none h-[48px]">
                                 <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight truncate">{catalogData?.professionals?.find(p => p.id === selectedProfessionalId)?.name || "Selecione o Dentista..."}</p>
                                 <ChevronDown size={18} className={cn("text-slate-600 transition-transform shrink-0", isProfessionalExpanded ? "rotate-180" : "")} />
                              </button>
                              {isProfessionalExpanded && (
                                 <div className="absolute top-[60px] left-0 right-0 z-[250] bg-white border border-slate-300 shadow-2xl max-h-60 overflow-y-auto rounded-xl p-1.5">
                                    {catalogData?.professionals?.map(p => <button key={p.id} onClick={() => { setSelectedProfessionalId(p.id); setIsProfessionalExpanded(false); }} className={cn("w-full text-left p-3 rounded-lg text-[13px] font-black border-b border-transparent transition-all", selectedProfessionalId === p.id ? "bg-blue-600 text-white" : "text-slate-900 hover:bg-slate-100")}>{p.name}</button>)}
                                 </div>
                              )}
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Nome do Paciente</label>
                              <input type="text" value={selectedPatient?.name || ""} disabled className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl text-[14px] font-black text-blue-700 outline-none h-[48px]" />
                           </div>
                        </div>
                     </div>

                     {/* LINHA 3: Procedimento e Dente */}
                     <div className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm">
                        <div className="grid grid-cols-12 gap-6">
                                                      <div className="col-span-8 space-y-1.5 relative">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Procedimento</label>
                              <div className="relative group">
                                 <div className="relative">
                                    <input 
                                       type="text"
                                       placeholder="Pesquisar procedimento..."
                                       value={selectedTreatment || procedureSearchTerm}
                                       onChange={(e) => {
                                          const val = e.target.value;
                                          setProcedureSearchTerm(val);
                                          if (selectedTreatment) {
                                             setSelectedTreatment(null);
                                             setSelectedTreatmentId(null);
                                             setSelectedProcedures([]);
                                             setTreatmentValue("");
                                          }
                                       }}
                                       onFocus={() => { 
                                          setIsProcedureSearchFocused(true);
                                          if (!selectedTreatment) setProcedureSearchTerm(procedureSearchTerm || ""); 
                                       }}
                                       onBlur={() => setTimeout(() => setIsProcedureSearchFocused(false), 200)}
                                       className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-900 outline-none h-[56px] focus:border-blue-500 focus:bg-white transition-all pl-12"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    {(procedureSearchTerm || selectedTreatment) && (
                                       <button 
                                          onClick={() => {
                                             setProcedureSearchTerm("");
                                             setSelectedTreatment(null);
                                             setSelectedTreatmentId(null);
                                             setSelectedProcedures([]);
                                             setTreatmentValue("");
                                          }}
                                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                                       >
                                          <X size={18} />
                                       </button>
                                    )}
                                 </div>

                                 {/* Dropdown de Resultados */}
                                 {(procedureSearchTerm || isProcedureSearchFocused) && !selectedTreatment && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[300] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                       {catalogData?.procedures
                                          .filter(p => p.specialtyId === expandedCategories[0] && normalizeString(p.name).includes(normalizeString(procedureSearchTerm)))
                                          .sort((a, b) => a.name.localeCompare(b.name))
                                          .map(proc => (
                                             <button 
                                                key={proc.id} 
                                                onClick={() => {
                                                   setSelectedTreatment(proc.name);
                                                   setSelectedTreatmentId(proc.id);
                                                   setSelectedProcedures([proc]);
                                                   setTreatmentValue(formatCurrencyInput(Math.round((proc.price || 0) * 100).toString()));
                                                   setProcedureSearchTerm("");
                                                }}
                                                className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3"
                                             >
                                                <span className="font-black text-[11px] uppercase text-slate-700">{proc.name}</span>
                                                <span className="text-[10px] font-black text-blue-600 shrink-0">{formatCurrencyInput(Math.round((proc.price || 0) * 100).toString())}</span>
                                             </button>
                                          ))
                                       }
                                       {catalogData?.procedures.filter(p => p.specialtyId === expandedCategories[0] && normalizeString(p.name).includes(normalizeString(procedureSearchTerm))).length === 0 && (
                                          <div className="p-4 text-center text-slate-400 text-[10px] font-black uppercase">Nenhum procedimento encontrado</div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </div>
                           <div className="col-span-4 space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Dente / Região</label>
                              <input type="text" placeholder="Ex: 16, Sup, Geral" value={manualTooth} onChange={e => setManualTooth(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-900 outline-none h-[56px]" />
                           </div>
                        </div>
                     </div>

                     {/* LINHA 4: Observações e Faces */}
                     <div className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm">
                        <div className="grid grid-cols-12 gap-6">
                           <div className="col-span-4 space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Faces (Opcional)</label>
                              <div className="flex gap-1.5">
                                 {['top', 'bottom', 'left', 'right', 'center'].map((face) => {
                                    const labels: any = { top: 'V', bottom: 'L', left: 'D', right: 'M', center: 'O' };
                                    return (
                                       <button key={face} onClick={() => setProcedureFaces(p => ({ ...p, [face]: !(p as any)[face] }))} className={cn("flex-1 h-[48px] rounded-xl text-[12px] font-black border-2 transition-all", (procedureFaces as any)[face] ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-300 text-slate-600 hover:border-blue-400")}>{labels[face]}</button>
                                    );
                                 })}
                              </div>
                           </div>
                           <div className="col-span-8 space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Notas Técnicas / Observações</label>
                              <textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Descreva os detalhes deste atendimento..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-[14px] font-black text-slate-900 h-[48px] outline-none resize-none focus:bg-white focus:border-blue-300 transition-all placeholder:text-slate-300" />
                           </div>
                        </div>
                     </div>

                     {/* LINHA 5: Informações Bancárias / Financeiro */}
                     <div className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm border-t-4 border-t-emerald-500">
                        <div className="grid grid-cols-4 gap-6">
                           <div className="space-y-1.5 relative">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Convênio</label>
                              <button onClick={() => {setIsConvenioExpanded(!isConvenioExpanded); setIsProfessionalExpanded(false);}} className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors rounded-xl outline-none h-[48px]">
                                 <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate">{catalogData?.convenios?.find(c => c.id === selectedConvenioId)?.name || "Particular"}</p>
                                 <ChevronDown size={18} className={cn("text-slate-600 transition-transform shrink-0", isConvenioExpanded ? "rotate-180" : "")} />
                              </button>
                              {isConvenioExpanded && (
                                 <div className="absolute bottom-full left-0 right-0 z-[250] mb-2 bg-white border border-slate-300 shadow-2xl max-h-60 overflow-y-auto rounded-xl p-1.5">
                                    {catalogData?.convenios?.map(c => <button key={c.id} onClick={() => { setSelectedConvenioId(c.id); setIsConvenioExpanded(false); }} className={cn("w-full text-left p-3 rounded-lg text-[13px] font-black border-b border-transparent transition-all", selectedConvenioId === c.id ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100")}>{c.name}</button>)}
                                 </div>
                              )}
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Pagamento</label>
                              <select value={selectedPaymentId} onChange={e => setSelectedPaymentId(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[12px] font-black text-slate-900 outline-none h-[48px]">
                                 <option value="none">Método...</option>
                                 {catalogData?.payments?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Parcelas / Recebimento</label>
                              <div className="flex gap-2">
                                 <select value={installments} onChange={e => setInstallments(e.target.value)} className="w-20 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[12px] font-black text-slate-900 outline-none h-[48px]">
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                                 </select>
                                 <button onClick={() => setIsPaid(!isPaid)} className={cn("flex-1 px-2 text-[10px] font-black rounded-xl transition-all border", isPaid ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-rose-100 text-rose-900 border-rose-200")}>
                                    {isPaid ? "PAGO" : "PENDENTE"}
                                 </button>
                              </div>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[13px] font-black text-slate-900 uppercase ml-1">Valor Final</label>
                              <input type="text" placeholder="R$ 0,00" value={treatmentValue} onChange={e => setTreatmentValue(formatCurrencyInput(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-[18px] font-black text-emerald-700 outline-none h-[48px]" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="px-6 py-[19px] border-t border-slate-200 bg-white flex items-center justify-between shadow-2xl">
               <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Procedimento</p>
                  <p className="text-sm font-black uppercase text-slate-800 leading-tight">{selectedTreatment || "Nenhum"}</p>
                  {selectedTreatment && (
                     <p className="text-[10px] font-black text-blue-600 uppercase mt-1">
                        Total: {treatmentValue || "R$ 0,00"}
                     </p>
                  )}
               </div>
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
               <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-100">
                  <div className="w-full h-full bg-white shadow-xl overflow-hidden flex flex-col">
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
                              <div className="flex-1 relative">
                                 <input 
                                    type="text" 
                                    value={prescriptionForm.medication} 
                                    onChange={(e) => {
                                       setPrescriptionForm({...prescriptionForm, medication: e.target.value});
                                       if (!showMedicationSearch) setShowMedicationSearch(true);
                                    }}
                                    onFocus={() => setShowMedicationSearch(true)}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none pr-8" 
                                    placeholder="Buscar..."
                                 />
                                 {prescriptionForm.medication && (
                                    <button 
                                       onClick={() => setPrescriptionForm({...prescriptionForm, medication: "", quantity: "", usage: "", observations: ""})}
                                       className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                       <X size={14} />
                                    </button>
                                 )}
                              </div>
                              <button onClick={() => setShowMedicationSearch(!showMedicationSearch)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                 <Search size={16} />
                              </button>
                           </div>
                           
                           {showMedicationSearch && (
                              <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-slate-200 shadow-2xl rounded-xl z-50 p-2 flex flex-col gap-1 max-h-40 overflow-y-auto" onMouseLeave={() => setShowMedicationSearch(false)}>
                                 {medicationsDB.filter(m => normalizeString(m.name).includes(normalizeString(prescriptionForm.medication))).map(med => (
                                    <button 
                                       key={med.code} 
                                       onClick={() => handleMedicationSelect(med)}
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
                                 <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer"><input type="radio" name="rx_type" checked={prescriptionForm.type === "Adulto"} onChange={() => {
                                    const med = medicationsDB.find(m => m.name === prescriptionForm.medication);
                                    if (med) handleMedicationSelect(med, "Adulto");
                                    else setPrescriptionForm({...prescriptionForm, type: "Adulto"});
                                 }} className="w-3 h-3" /> Adulto</label>
                                 <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer"><input type="radio" name="rx_type" checked={prescriptionForm.type === "Criança"} onChange={() => {
                                    const med = medicationsDB.find(m => m.name === prescriptionForm.medication);
                                    if (med) handleMedicationSelect(med, "Criança");
                                    else setPrescriptionForm({...prescriptionForm, type: "Criança"});
                                 }} className="w-3 h-3" /> Criança</label>
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
                           
                           // Collect all items: those already in the list + the current one if not empty
                           let finalItems = [...prescriptionItems];
                           if (prescriptionForm.medication) {
                              finalItems.push({...prescriptionForm});
                           }

                           const meds = finalItems.map(i => {
                              const obs = i.observations ? ` (${i.observations})` : "";
                              return `${i.medication} - ${i.quantity || '1'} ${i.usage}${obs}`;
                           }).join(', ');
                           
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
                           
                           // Send to API to persist in clinical history
                           await fetch(`/api/pacientes/${selectedPatient.id}/salvar`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ interventions: [newItem], odontogram: patientOdontograms[selectedPatient.id] || {} })
                           });

                           await fetchHistory(selectedPatient.id);
                           
                           alert("Prescrição gravada no prontuário e arquivo salvo com sucesso!");
                           setShowPrescriptionModal(false);
                           setPrescriptionItems([]);
                           setPrescriptionForm({...prescriptionForm, medication: "", quantity: "", usage: "", observations: ""});
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

      {showAtestadoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full h-full flex flex-col">
            <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl"><FileBadge size={20} /></div>
                  <h3 className="text-sm font-black uppercase">
                     {atestadoStep === 'assistant' ? 'Assistente de Atestados' : 'Editor de Atestados'}
                  </h3>
               </div>
               <button onClick={() => setShowAtestadoModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>
            
            {atestadoStep === 'assistant' && (
               <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-100 p-8">
                  <div className="w-full max-w-2xl bg-white shadow-xl rounded-[32px] overflow-hidden flex flex-col border border-slate-200">
                     <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cirurgião</label>
                              <select 
                                 value={atestadoForm.professionalId} 
                                 onChange={(e) => setAtestadoForm({...atestadoForm, professionalId: e.target.value})}
                                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                              >
                                 {catalogData?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                              <select 
                                 value={atestadoForm.motivoId} 
                                 onChange={(e) => setAtestadoForm({...atestadoForm, motivoId: e.target.value})}
                                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                              >
                                 {catalogData?.motivosAtestado?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                           <input type="text" value={selectedPatient?.name || ""} disabled className="w-full p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black outline-none" />
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 space-y-4">
                           <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período / Horário</h4>
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-600 cursor-pointer">
                                 <input type="checkbox" checked={atestadoForm.usaHorario} onChange={e => setAtestadoForm({...atestadoForm, usaHorario: e.target.checked})} className="w-4 h-4 rounded" />
                                 Incluir Horários
                              </label>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
                                 <input type="date" value={atestadoForm.periodoInicio} onChange={e => setAtestadoForm({...atestadoForm, periodoInicio: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim</label>
                                 <input type="date" value={atestadoForm.periodoFim} onChange={e => setAtestadoForm({...atestadoForm, periodoFim: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                              </div>
                           </div>

                           {atestadoForm.usaHorario && (
                              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Das</label>
                                    <input type="time" value={atestadoForm.horarioInicio} onChange={e => setAtestadoForm({...atestadoForm, horarioInicio: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Até às</label>
                                    <input type="time" value={atestadoForm.horarioFim} onChange={e => setAtestadoForm({...atestadoForm, horarioFim: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                                 </div>
                              </div>
                           )}
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Adicionais</label>
                           <textarea 
                              value={atestadoForm.observacoes} 
                              onChange={(e) => setAtestadoForm({...atestadoForm, observacoes: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none h-24 resize-none focus:bg-white transition-all"
                              placeholder="Alguma observação específica para este atestado?"
                           />
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button onClick={() => setShowAtestadoModal(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100">Cancelar</button>
                        <button onClick={() => {
                           const professional = catalogData?.professionals?.find(p => p.id === atestadoForm.professionalId);
                           const profName = professional?.name || "Profissional";
                           const profCro = professional?.cro || "";
                           
                           const motivo = catalogData?.motivosAtestado?.find((m: any) => m.id === atestadoForm.motivoId)?.name || "Tratamento Odontológico";
                           
                           const dtIni = new Date(atestadoForm.periodoInicio).toLocaleDateString('pt-BR');
                           const dtFim = new Date(atestadoForm.periodoFim).toLocaleDateString('pt-BR');
                           
                           let periodoStr = dtIni === dtFim ? `no dia ${dtIni}` : `no período de ${dtIni} a ${dtFim}`;
                           let horarioStr = atestadoForm.usaHorario ? `, no horário das ${atestadoForm.horarioInicio} às ${atestadoForm.horarioFim}` : "";
                           
                           let docText = `Consultório Odontológico\nAl. Rogério Pinto Ferráz 257\n14802-362 - Araraquara - SP\n\n\n`;
                           docText += `ATESTADO ODONTOLÓGICO\n\n\n`;
                           docText += `Atesto para os devidos fins de direito, que o(a) Sr(a). ${selectedPatient?.name}, esteve sob meus cuidados profissionais ${periodoStr}${horarioStr}, por motivo de ${motivo.toLowerCase()}, estando sob minha responsabilidade.\n\n`;
                           
                           if (atestadoForm.observacoes) {
                              docText += `Observações: ${atestadoForm.observacoes}\n\n`;
                           }

                           const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
                           docText += `\nAraraquara, ${today}\n\n\n`;
                           docText += `___________________________________\n`;
                           docText += `${profName}\n`;
                           if (profCro) docText += `CRO ${profCro}\n`;
                           
                           docText += `\n\n___________________________________\n`;
                           docText += `${selectedPatient?.name}\n\n\n`;
                           
                           docText += `LEI FEDERAL 5.081 de 24/08/66, Art. 6º "Compete ao Cirurgião-Dentista... III - atestar, no setor de sua atividade profissional, estados mórbidos e outros, inclusive para justificação de faltas ao emprego". (com a modificação prevista pela Lei Federal 6.215, de 30/06/75).`;
                           
                           setFinalAtestadoText(docText);
                           setAtestadoStep('editor');
                        }} className="px-10 py-3 rounded-2xl font-black text-[10px] uppercase bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all">Gerar Atestado</button>
                     </div>
                  </div>
               </div>
            )}

            {atestadoStep === 'editor' && (
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
                           <span className="font-serif">12</span>
                           <div className="w-4 h-4 bg-black rounded-sm" />
                        </div>
                     </div>
                     <div className="flex-1 p-20 overflow-y-auto bg-white">
                        <textarea 
                           value={finalAtestadoText}
                           onChange={(e) => setFinalAtestadoText(e.target.value)}
                           className="w-full h-full resize-none outline-none font-serif text-[16px] leading-loose text-center"
                           spellCheck="false"
                        />
                     </div>
                  </div>
               </div>
            )}

            {atestadoStep === 'editor' && (
               <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between shadow-2xl">
                  <button onClick={() => setAtestadoStep('assistant')} className="px-6 py-4 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100">Voltar ao Assistente</button>
                  <div className="flex gap-4">
                     <button onClick={() => {
                        window.print();
                     }} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-800 text-white shadow-lg flex items-center gap-2 hover:bg-slate-900">
                        <Printer size={16} /> Imprimir
                     </button>
                     <button onClick={async () => {
                        if (!selectedPatient || !finalAtestadoText) return;
                        
                        try {
                           const res = await fetch(`/api/pacientes/${selectedPatient.id}/salvar-atestado`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ text: finalAtestadoText }) 
                           });
                           if (!res.ok) throw new Error("Falha ao salvar arquivo");
                           
                           const motivo = catalogData?.motivosAtestado?.find((m: any) => m.id === atestadoForm.motivoId)?.name || "Tratamento";
                           const dtIni = new Date(atestadoForm.periodoInicio).toLocaleDateString('pt-BR');
                           const resumo = `Atestado: dia ${dtIni} por motivo de ${motivo}`;

                           const newItem = { 
                              id: Date.now(), 
                              type: 'history', 
                              date: new Date().toISOString(), 
                              procedure: resumo, 
                              status: "Concluído", 
                              professional: catalogData?.professionals?.find(p => p.id === atestadoForm.professionalId)?.name || "Sistema", 
                              value: "R$ 0,00", 
                              numericValue: 0, 
                              notes: "Atestado gerado e salvo como arquivo." 
                           };
                           
                           await fetch(`/api/pacientes/${selectedPatient.id}/salvar`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ interventions: [newItem], odontogram: patientOdontograms[selectedPatient.id] || {} })
                           });

                           await fetchHistory(selectedPatient.id);
                           
                           alert("Atestado gravado no prontuário e arquivo salvo com sucesso!");
                           setShowAtestadoModal(false);
                           setAtestadoStep('assistant');
                        } catch (err) {
                           console.error(err);
                           alert("Erro ao salvar arquivo do atestado.");
                        }
                     }} className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase bg-emerald-600 text-white shadow-lg hover:bg-emerald-700">
                        Gravar no Prontuário
                     </button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {showConsentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full h-full flex flex-col">
            <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl"><ShieldCheck size={20} /></div>
                  <h3 className="text-sm font-black uppercase">
                     {consentStep === 'assistant' ? 'Assistente de Termos de Consentimento' : 'Editor de Termos'}
                  </h3>
               </div>
               <button onClick={() => setShowConsentModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>
            
            {consentStep === 'assistant' && (
               <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-100 p-8">
                  <div className="w-full max-w-2xl bg-white shadow-xl rounded-[32px] overflow-hidden flex flex-col border border-slate-200">
                     <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cirurgião</label>
                           <select 
                              value={consentForm.professionalId} 
                              onChange={(e) => setConsentForm({...consentForm, professionalId: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                           >
                              {catalogData?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                           <input type="text" value={selectedPatient?.name || ""} disabled className="w-full p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black outline-none" />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tratamento / Procedimento</label>
                           <input 
                              type="text" 
                              value={consentForm.procedureDescription} 
                              onChange={(e) => setConsentForm({...consentForm, procedureDescription: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all h-[48px]"
                              placeholder="Ex: Implante dentário no dente 14"
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Adicionais</label>
                           <textarea 
                              value={consentForm.observacoes} 
                              onChange={(e) => setConsentForm({...consentForm, observacoes: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none h-24 resize-none focus:bg-white transition-all"
                              placeholder="Alguma observação específica para este termo?"
                           />
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button onClick={() => setShowConsentModal(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100">Cancelar</button>
                        <button onClick={() => {
                           const professional = catalogData?.professionals?.find(p => p.id === consentForm.professionalId);
                           const profName = professional?.name || "Profissional";
                           const profCro = professional?.cro || "";
                           const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
                           
                           let docText = `Consultório Odontológico\nAl. Rogério Pinto Ferráz 257\n14802-362 - Araraquara - SP\n\n\n`;
                           docText += `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)\n\n\n`;
                           docText += `Eu, ${selectedPatient?.name || "[Nome do Paciente]"}, declaro que fui devidamente informado(a) pelo(a) cirurgião(ã)-dentista ${profName} sobre os detalhes do tratamento de "${consentForm.procedureDescription || "[Nome do Procedimento]"}".\n\n`;
                           docText += `Fui esclarecido(a) quanto aos objetivos, riscos, benefícios, alternativas de tratamento e possíveis complicações decorrentes do procedimento proposto. Compreendo que na odontologia, como em qualquer ciência biológica, os resultados não são absolutamente garantidos e dependem também da resposta do meu organismo e dos cuidados pós-operatórios recomendados.\n\n`;
                           docText += `Tive a oportunidade de fazer perguntas, as quais foram respondidas de forma satisfatória e em linguagem compreensível. Declaro estar ciente e de acordo com o plano de tratamento proposto.\n\n`;
                           
                           if (consentForm.observacoes) {
                              docText += `Observações Adicionais: ${consentForm.observacoes}\n\n`;
                           }

                           docText += `\nAraraquara, ${today}\n\n\n`;
                           docText += `___________________________________\n`;
                           docText += `${selectedPatient?.name || "Paciente"}\n`;
                           docText += `Paciente / Responsável\n\n\n`;
                           docText += `___________________________________\n`;
                           docText += `${profName}\n`;
                           if (profCro) docText += `CRO ${profCro}\n`;
                           docText += `Cirurgião-Dentista`;
                           
                           setFinalConsentText(docText);
                           setConsentStep('editor');
                        }} className="px-10 py-3 rounded-2xl font-black text-[10px] uppercase bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all">Gerar Termo</button>
                     </div>
                  </div>
               </div>
            )}

            {consentStep === 'editor' && (
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
                           <span className="font-serif">12</span>
                           <div className="w-4 h-4 bg-black rounded-sm" />
                        </div>
                     </div>
                     <div className="flex-1 p-20 overflow-y-auto bg-white">
                        <textarea 
                           value={finalConsentText}
                           onChange={(e) => setFinalConsentText(e.target.value)}
                           className="w-full h-full resize-none outline-none font-serif text-[16px] leading-loose text-center"
                           spellCheck="false"
                        />
                     </div>
                  </div>
               </div>
            )}

            {consentStep === 'editor' && (
               <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between shadow-2xl">
                  <button onClick={() => setConsentStep('assistant')} className="px-6 py-4 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100">Voltar ao Assistente</button>
                  <div className="flex gap-4">
                     <button onClick={() => {
                        window.print();
                     }} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-800 text-white shadow-lg flex items-center gap-2 hover:bg-slate-900">
                        <Printer size={16} /> Imprimir
                     </button>
                     <button onClick={async () => {
                        if (!selectedPatient || !finalConsentText) return;
                        
                        try {
                           const res = await fetch(`/api/pacientes/${selectedPatient.id}/salvar-termo`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ text: finalConsentText }) 
                           });
                           if (!res.ok) throw new Error("Falha ao salvar arquivo");
                           
                           const resumo = `Termo de Consentimento: ${consentForm.procedureDescription || "Tratamento"}`;

                           const newItem = { 
                              id: Date.now(), 
                              type: 'history', 
                              date: new Date().toISOString(), 
                              procedure: resumo, 
                              status: "Concluído", 
                              professional: catalogData?.professionals?.find(p => p.id === consentForm.professionalId)?.name || "Sistema", 
                              value: "R$ 0,00", 
                              numericValue: 0, 
                              notes: "Termo de consentimento gerado e salvo como arquivo." 
                           };
                           
                           await fetch(`/api/pacientes/${selectedPatient.id}/salvar`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ interventions: [newItem], odontogram: patientOdontograms[selectedPatient.id] || {} })
                           });

                           await fetchHistory(selectedPatient.id);
                           
                           alert("Termo de Consentimento gravado no prontuário e arquivo salvo com sucesso!");
                           setShowConsentModal(false);
                           setConsentStep('assistant');
                        } catch (err) {
                           console.error(err);
                           alert("Erro ao salvar arquivo do termo.");
                        }
                     }} className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase bg-emerald-600 text-white shadow-lg hover:bg-emerald-700">
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
      {selectedPatient && (
        <ReceiptModal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} patientId={selectedPatient.id} />
      )}
      <DetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} item={activeHistoryItem} />
    </div>
  );
}

function HistoryItem({ item, onClick }: { item: any, onClick: () => void }) {
  const isRecipe = item.procedure.includes("Receitado:");
  const isAtestado = item.procedure.includes("Atestado:");
  const isDiag = item.procedure.includes("DIAGNÓSTICO:");

  return (
    <div onClick={onClick} className="w-72 shrink-0 p-5 rounded-3xl border border-slate-100 bg-white flex flex-col gap-3 hover:shadow-xl transition-all cursor-pointer">
       <div className="flex items-center justify-between mb-2">
           <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
              {(() => {
                const [y, m, d] = item.date.split('-');
                return `${d}/${m}/${y}`;
              })()}
           </span>
           {item.tooth && !isRecipe && !isAtestado && (
             <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Dente {item.tooth}</span>
           )}
        </div>
       <div className="flex-1 min-h-[40px]">
         {isRecipe ? (
           <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-blue-600">
               <FileText size={14} className="shrink-0" />
               <span className="text-[10px] font-black uppercase tracking-wider">Receituário</span>
             </div>
             <p className="text-[12px] font-bold text-slate-700 leading-tight line-clamp-2 italic">
               {item.procedure.replace(/PROCEDIMENTO:\s*/i, "").replace(/Receitado:\s*/i, "").trim()}
             </p>
           </div>
         ) : isAtestado ? (
           <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-emerald-600">
               <FileBadge size={14} className="shrink-0" />
               <span className="text-[10px] font-black uppercase tracking-wider">Atestado Gerado</span>
             </div>
             <p className="text-[12px] font-bold text-slate-700 leading-tight line-clamp-2 italic">
               {item.procedure.replace(/PROCEDIMENTO:\s*/i, "").trim()}
             </p>
           </div>
         ) : isDiag ? (
           <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-amber-500">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-wider">Diagnóstico Clínico</span>
             </div>
             <h4 className="text-[12px] font-black text-slate-800 uppercase line-clamp-2 leading-tight">
               {item.procedure.replace(/DIAGNÓSTICO:\s*/i, "").trim()}
             </h4>
           </div>
         ) : (
           <h4 className="text-[12px] font-black text-slate-800 uppercase line-clamp-2 leading-tight">
             {item.procedure.replace(/PROCEDIMENTO:\s*/i, "").trim()}
           </h4>
         )}
       </div>                      
       <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
          <div className="flex flex-col">
             <span className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[100px]">{item.professional}</span>
             {!isRecipe && !isAtestado && !isDiag && (
                <span className={cn(
                   "text-[9px] font-black uppercase mt-1",
                   (item.paidInstallments || 0) >= (Number(item.totalInstallments || item.installments) || 1) ? "text-emerald-600" : "text-rose-600"
                )}>
                   {(item.paidInstallments || 0) >= (Number(item.totalInstallments || item.installments) || 1) ? "Pago Total" : `Pendente (${item.paidInstallments || 0}/${Number(item.totalInstallments || item.installments) || 1})`}
                </span>
             )}
          </div>
          {!isRecipe && !isAtestado && !isDiag && (
             <span className="text-[12px] font-black text-emerald-600">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.numericValue || item.value)}
             </span>
          )}
       </div>
    </div>
  );
}
