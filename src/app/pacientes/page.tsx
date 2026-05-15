"use client";

import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus,
  Mail,
  Phone,
  X,
  FileText,
  Calendar,
  History,
  DollarSign,
  Loader2,
  HeartPulse,
  AlertTriangle,
  Stethoscope
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  status: string;
  cpf: string | null;
  rg?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  profession?: string | null;
  zipCode?: string | null;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // New Patient State
  const [showNewModal, setShowNewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const initialAnamnesis = [
    { id: "2", question: "Alergia a medicamentos? Quais?" },
    { id: "1", question: "Usa Medicamentos? Quais?" },
    { id: "3", question: "Pressão alta?" },
    { id: "11", question: "Tem asma?" },
    { id: "13", question: "Reação com anestésicos?" },
    { id: "6", question: "Bruxismo (ranger dentes)?" },
    { id: "17", question: "Está grávida?" },
    { id: "8", question: "Tem sinusite?" }
  ];

  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    rg: "",
    birthDate: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    profession: "",
    anamnesis: initialAnamnesis.map(q => ({ ...q, value: "" }))
  });

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const fetchPatients = async (query = "", pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const res = await fetch(`/api/pacientes?q=${query}&page=${pageNum}&limit=50`);
      const data = await res.json();
      
      const newPatients = data.patients || (Array.isArray(data) ? data : []);
      
      if (append) {
        setPatients(prev => [...prev, ...newPatients]);
      } else {
        setPatients(newPatients);
      }
      
      setHasMore(data.hasMore !== undefined ? data.hasMore : newPatients.length === 50);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchPatients(searchTerm, 1, false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPatients(searchTerm, nextPage, true);
    }
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pacientes/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatientForm)
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewPatientForm({
          name: "", email: "", phone: "", cpf: "", rg: "", 
          birthDate: "", address: "", neighborhood: "", 
          city: "", state: "", zipCode: "", profession: "",
          anamnesis: initialAnamnesis.map(q => ({ ...q, value: "" }))
        });
        setPage(1);
        fetchPatients(searchTerm, 1, false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "1": return { label: "Ativo", class: "bg-emerald-100 text-emerald-700" };
      case "2": return { label: "Em Tratamento", class: "bg-blue-100 text-blue-700" };
      case "3": return { label: "Inativo", class: "bg-slate-100 text-slate-700" };
      default: return { label: "Desconhecido", class: "bg-slate-50 text-slate-400" };
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-slate-500">Gerencie o cadastro e histórico dos seus pacientes reais.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={18} />
          Novo Paciente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            {(loading || loadingMore) && <Loader2 size={18} className="animate-spin text-blue-600" />}
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        <div 
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar"
          onScroll={handleScroll}
        >
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold">Contato</th>
                <th className="px-6 py-4 font-semibold">CPF</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 opacity-20" />
                    Carregando pacientes...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              ) : (
                <>
                  {patients.map((patient) => {
                    const statusInfo = formatStatus(patient.status);
                    return (
                      <tr 
                        key={patient.id} 
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/pacientes/${patient.id}?tab=dados`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {patient.name.split(' ').filter(n => n).map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700 uppercase">{patient.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {patient.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail size={12} />
                                {patient.email}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone size={12} />
                              {patient.phone || "Sem telefone"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{patient.cpf || "N/A"}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusInfo.class)}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {loadingMore && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        <Loader2 size={24} className="animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><UserPlus size={20} /></div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">Novo Paciente</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preencha os dados cadastrais e de saúde</p>
                  </div>
               </div>
               <button onClick={() => setShowNewModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.name}
                    onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.phone}
                    onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.email}
                    onChange={e => setNewPatientForm({...newPatientForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.cpf}
                    onChange={e => setNewPatientForm({...newPatientForm, cpf: maskCPF(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.birthDate}
                    onChange={e => setNewPatientForm({...newPatientForm, birthDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Seção de Anamnese no Cadastro */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <HeartPulse size={18} className="text-rose-500" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficha de Saúde Inicial</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newPatientForm.anamnesis.map((item, idx) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase leading-tight block">{item.question}</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        placeholder="Não / Observações..."
                        value={item.value}
                        onChange={(e) => {
                          const newAnamnesis = [...newPatientForm.anamnesis];
                          newAnamnesis[idx].value = e.target.value;
                          setNewPatientForm({ ...newPatientForm, anamnesis: newAnamnesis });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.address}
                    onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.city}
                    onChange={e => setNewPatientForm({...newPatientForm, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado (UF)</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                    value={newPatientForm.state}
                    onChange={e => setNewPatientForm({...newPatientForm, state: e.target.value.toUpperCase()})}
                  />
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
                onClick={handleCreatePatient}
                disabled={saving || !newPatientForm.name}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {saving ? <Loader2 size={16} className="animate-spin" /> : "Cadastrar Paciente"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
