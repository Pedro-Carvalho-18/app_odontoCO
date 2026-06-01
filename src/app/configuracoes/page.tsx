"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Camera,
  ChevronRight,
  Stethoscope,
  Building,
  Loader2,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  FileText,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Download,
  Upload,
  AlertTriangle,
  Pill,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Profile & Clinic States
  const [profileData, setProfileData] = useState({
    name: "",
    cro: "",
    email: "",
    phone: "",
    specialties: ""
  });

  const [clinicData, setClinicData] = useState({
    name: "",
    razao: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: ""
  });

  // DB Manager States
  const [dbTable, setDbTable] = useState("medicamentos");
  const [dbData, setDbData] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbSearch, setDbSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  
  const initialRowData = { 
    name: "", 
    cro: "", 
    specialtyId: "", 
    price: "",
    quantityAdult: "",
    posologyAdult: "",
    quantityChild: "",
    posologyChild: "",
    usage: ""
  };
  const [newRowData, setNewRowData] = useState(initialRowData);
  
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "success" | "error">("idle");
  const [importErrorMessage, setImportErrorMessage] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [profRes, clinRes, specRes] = await Promise.all([
          fetch("/api/configuracoes/perfil"),
          fetch("/api/configuracoes/clinica"),
          fetch("/api/configuracoes/db-manager?table=especialidades")
        ]);
        
        if (profRes.ok) {
          const profData = await profRes.json();
          setProfileData({
            name: profData.name || "",
            cro: profData.cro || "",
            email: profData.email || "",
            phone: profData.phone || "",
            specialties: profData.specialties || ""
          });
        }
        if (clinRes.ok) {
          const clinData = await clinRes.json();
          setClinicData({
            name: clinData.name || "",
            razao: clinData.razao || "",
            cnpj: clinData.cnpj || "",
            phone: clinData.phone || "",
            email: clinData.email || "",
            address: clinData.address || "",
            number: clinData.number || "",
            complement: clinData.complement || "",
            neighborhood: clinData.neighborhood || "",
            city: clinData.city || "",
            state: clinData.state || "",
            zipCode: clinData.zipCode || ""
          });
        }
        if (specRes.ok) {
          const specData = await specRes.json();
          setSpecialties(specData);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const fetchDbData = async () => {
    setDbLoading(true);
    try {
      const res = await fetch(`/api/configuracoes/db-manager?table=${dbTable}`);
      if (res.ok) setDbData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "banco") fetchDbData();
  }, [activeTab, dbTable]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/configuracoes/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        setShowSuccess(true);
        window.dispatchEvent(new Event('profile-updated'));
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSaveClinic = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/configuracoes/clinica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicData)
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleSaveRow = async () => {
    if (!newRowData.name) return;
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body: any = { table: dbTable, data: {
        ...newRowData,
        price: parseFloat(newRowData.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0
      }};
      if (editingId) body.id = editingId;

      const res = await fetch("/api/configuracoes/db-manager", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setNewRowData(initialRowData);
        fetchDbData();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDeleteRow = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item permanentemente?")) return;
    setDbLoading(true);
    try {
      const res = await fetch(`/api/configuracoes/db-manager?table=${dbTable}&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchDbData();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to delete row:", err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleEditRow = (item: any) => {
    setEditingId(item.id);
    setNewRowData({
      name: item.name || "",
      cro: item.cro || "",
      specialtyId: item.specialtyId || specialties[0]?.id || "1",
      price: item.price ? item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00",
      quantityAdult: item.quantityAdult || "",
      posologyAdult: item.posologyAdult || "",
      quantityChild: item.quantityChild || "",
      posologyChild: item.posologyChild || "",
      usage: item.usage || ""
    });
    setShowAddModal(true);
  };

  const [dbStats, setDbLoadingStats] = useState({ version: "---", lastApplied: "---", lastBackup: null as string | null, logs: 0 });

  useEffect(() => {
    async function loadStats() {
      if (activeTab === "banco" || activeTab === "seguranca") {
        try {
          const res = await fetch("/api/health");
          const data = await res.json();
          setDbLoadingStats({
            version: data.dbVersion,
            lastApplied: new Date(data.timestamp).toLocaleDateString('pt-BR'),
            lastBackup: data.lastBackup,
            logs: 0 // Simplificado
          });
        } catch (err) { console.error(err); }
      }
    }
    loadStats();
  }, [activeTab]);

  const handleExportBackup = () => {
    window.open('/api/configuracoes/backup');
    // Forçar atualização da data após o download (com um pequeno delay)
    setTimeout(() => {
      fetch("/api/health")
        .then(res => res.json())
        .then(data => {
          setDbLoadingStats(prev => ({ ...prev, lastBackup: data.lastBackup }));
        });
    }, 2000);
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("AVISO: Importar um novo banco de dados irá substituir TODOS os dados atuais. Deseja continuar?")) {
      e.target.value = "";
      return;
    }

    setImportStatus("importing");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/configuracoes/import", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        setImportStatus("success");
        // Aguarda 2 segundos para o usuário ver o sucesso antes de reiniciar
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const error = await res.json();
        setImportErrorMessage(error.error || "Erro desconhecido");
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 5000);
      }
    } catch (err) {
      console.error(err);
      setImportErrorMessage("Erro ao enviar o arquivo.");
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 5000);
    } finally {
      e.target.value = "";
    }
  };

  const menuItems = [
    { id: "perfil", label: "Meu Perfil", icon: User },
    { id: "clinica", label: "Dados da Clínica", icon: Building },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "banco", label: "Banco de Dados", icon: Database },
  ];

  const filteredDbData = dbData.filter(item => 
    item.name?.toLowerCase().includes(dbSearch.toLowerCase()) ||
    item.id?.toString().includes(dbSearch) ||
    item.cro?.toLowerCase().includes(dbSearch.toLowerCase()) ||
    item.specialty?.toLowerCase().includes(dbSearch.toLowerCase())
  );

  const formatCurrency = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (!numeric) return "R$ 0,00";
    const float = parseFloat(numeric) / 100;
    return float.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h1>
          <p className="text-slate-500">Gerencie suas informações pessoais e preferências.</p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Alterações Salvas</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
              <ChevronRight size={16} className={activeTab === item.id ? "opacity-100" : "opacity-0"} />
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "perfil" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600"><User size={40} /></div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900">{profileData.name || "Doutor(a)"}</h2>
                    <p className="text-sm text-slate-500 mb-3">Cirurgião Dentista | CRO {profileData.cro}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {profileData.specialties.split(',').filter(s => s.trim()).map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{tag.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CRO</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={profileData.cro} onChange={e => setProfileData({...profileData, cro: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label><input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} /></div>
                  <div className="space-y-1.5 sm:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidades</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={profileData.specialties} onChange={e => setProfileData({...profileData, specialties: e.target.value})} /></div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border-b-4 border-blue-800 active:scale-95 disabled:opacity-50 flex items-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clinica" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Building size={24} /></div>
                  <div><h2 className="text-xl font-bold text-slate-900">Dados da Clínica</h2><p className="text-sm text-slate-500">Informações para receitas e orçamentos.</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5 sm:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={clinicData.name} onChange={e => setClinicData({...clinicData, name: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={clinicData.razao} onChange={e => setClinicData({...clinicData, razao: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={clinicData.cnpj} onChange={e => setClinicData({...clinicData, cnpj: e.target.value})} /></div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSaveClinic} disabled={saving} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border-b-4 border-emerald-800 active:scale-95 disabled:opacity-50 flex items-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Salvar Clínica"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "banco" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit">
                    <button onClick={() => setDbTable("medicamentos")} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all", dbTable === "medicamentos" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}>Medicamentos</button>
                    <button onClick={() => setDbTable("procedimentos")} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all", dbTable === "procedimentos" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}>Procedimentos</button>
                    <button onClick={() => setDbTable("dentistas")} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all", dbTable === "dentistas" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}>Dentistas</button>
                  </div>
                  <button onClick={() => { setEditingId(null); setNewRowData(initialRowData); setShowAddModal(true); }} className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                <div className="p-4 border-b border-slate-100 relative">
                   <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input 
                    type="text" 
                    placeholder={`Pesquisar em ${dbTable}...`} 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" 
                    value={dbSearch}
                    onChange={e => setDbSearch(e.target.value)}
                   />
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar max-h-[400px]">
                   {dbLoading ? (
                     <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span className="text-[10px] font-black uppercase">Carregando dados...</span>
                     </div>
                   ) : (
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                           <tr className="border-b border-slate-100">
                              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome / Descrição</th>
                              {dbTable === "dentistas" && <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">CRO</th>}
                              {dbTable === "procedimentos" && (
                                <>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Especialidade</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                </>
                              )}
                              {dbTable === "medicamentos" && <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dosagem Padrão</th>}
                              <th className="px-2 py-4"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {filteredDbData.map(item => (
                             <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.id}</td>
                                <td className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase">{item.name}</td>
                                {dbTable === "dentistas" && <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{item.cro || "---"}</td>}
                                {dbTable === "procedimentos" && (
                                  <>
                                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{item.specialty || "Geral"}</td>
                                    <td className="px-6 py-4 text-[11px] font-black text-emerald-600">
                                      {item.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                  </>
                                )}
                                {dbTable === "medicamentos" && (
                                  <td className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase">
                                    {item.quantityAdult ? `A: ${item.quantityAdult}` : ""} {item.quantityChild ? `| C: ${item.quantityChild}` : ""}
                                    {!item.quantityAdult && !item.quantityChild && "---"}
                                  </td>
                                )}
                                <td className="px-2 py-4 text-left whitespace-nowrap">
                                   <div className="flex items-center justify-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => handleEditRow(item)}
                                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Editar"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteRow(item.id)}
                                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                          title="Excluir"
                                      >
                                          <Trash2 size={13} />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "seguranca" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Security Info Card ... rest same as before ... */}
              <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm border border-slate-100">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Status do Banco de Dados</h3>
                    <div className="flex gap-4 mt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Versão: <span className="text-slate-900">{dbStats.version}</span></p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Último Acesso: <span className="text-slate-900">{dbStats.lastApplied}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Segurança e Backup</h2>
                    <p className="text-sm text-slate-500">Gerencie a segurança dos seus dados e realize backups.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                        <Download size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Baixar Banco de Dados</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Crie uma cópia de segurança para levar seus dados.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleExportBackup}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Baixar Backup (.sqlite)
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
                        <Upload size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Importar Banco de Dados</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Restaure um backup ou migre de outra máquina.</p>
                      </div>
                    </div>
                    <label className={cn(
                      "w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2",
                      importStatus === "idle" && "bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700",
                      importStatus === "importing" && "bg-blue-400 text-white opacity-50 pointer-events-none",
                      importStatus === "success" && "bg-emerald-600 text-white shadow-lg shadow-emerald-100 pointer-events-none",
                      importStatus === "error" && "bg-rose-600 text-white shadow-lg shadow-rose-100 pointer-events-none"
                    )}>
                      {importStatus === "idle" && <><Upload size={14} /> Importar Arquivo</>}
                      {importStatus === "importing" && <><Loader2 size={14} className="animate-spin" /> Processando...</>}
                      {importStatus === "success" && <><CheckCircle2 size={14} /> Sucesso! Reiniciando...</>}
                      {importStatus === "error" && <><X size={14} /> {importErrorMessage || "Erro"}</>}
                      <input type="file" accept=".sqlite" className="hidden" onChange={handleImportDatabase} disabled={importStatus !== "idle"} />
                    </label>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-amber-900 tracking-widest">Aviso Importante</h4>
                      <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase mt-1">
                        Ao importar um banco de dados, todos os dados atuais (pacientes, agendas, financeiro) serão substituídos permanentemente. Recomendamos fazer um backup antes de realizar esta operação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "perfil" && activeTab !== "clinica" && activeTab !== "banco" && activeTab !== "seguranca" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <Settings size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Em Desenvolvimento</h3>
              <p className="text-xs text-slate-500 max-w-xs">Esta seção de configurações será implementada em breve para permitir o controle total do seu sistema.</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl">
                      {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                    </div>
                    <h3 className="text-sm font-black uppercase text-slate-900">
                      {editingId ? `Editar ${dbTable === 'medicamentos' ? 'Medicamento' : dbTable === 'procedimentos' ? 'Procedimento' : 'Dentista'}` : `Novo em ${dbTable}`}
                    </h3>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome / Descrição</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm" 
                      value={newRowData.name}
                      onChange={e => setNewRowData({...newRowData, name: e.target.value})}
                      autoFocus
                    />
                 </div>

                 {dbTable === "dentistas" && (
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número do CRO</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm" 
                        value={newRowData.cro}
                        onChange={e => setNewRowData({...newRowData, cro: e.target.value})}
                      />
                   </div>
                 )}

                 {dbTable === "procedimentos" && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade / Categoria</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm" 
                          value={newRowData.specialtyId}
                          onChange={e => setNewRowData({...newRowData, specialtyId: e.target.value})}
                        >
                          <option value="">Selecione...</option>
                          {specialties.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Procedimento</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                          <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-black text-sm text-emerald-700" 
                            value={newRowData.price}
                            onChange={e => setNewRowData({...newRowData, price: formatCurrency(e.target.value)})}
                          />
                        </div>
                     </div>
                   </div>
                 )}

                 {dbTable === "medicamentos" && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                        <div className="sm:col-span-2 flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-blue-600 text-white rounded-lg"><User size={12} /></div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-900">Dosagem Adulto</h4>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                           <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" value={newRowData.quantityAdult} onChange={e => setNewRowData({...newRowData, quantityAdult: e.target.value})} placeholder="Ex: 1 caixa" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Posologia</label>
                           <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" value={newRowData.posologyAdult} onChange={e => setNewRowData({...newRowData, posologyAdult: e.target.value})} placeholder="Ex: 1 comp de 12/12h" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                        <div className="sm:col-span-2 flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-rose-600 text-white rounded-lg"><Bell size={12} /></div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-900">Dosagem Criança</h4>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                           <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" value={newRowData.quantityChild} onChange={e => setNewRowData({...newRowData, quantityChild: e.target.value})} placeholder="Ex: 1 frasco" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Posologia</label>
                           <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" value={newRowData.posologyChild} onChange={e => setNewRowData({...newRowData, posologyChild: e.target.value})} placeholder="Ex: 5ml de 8/8h" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Via de Administração / Uso</label>
                         <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={newRowData.usage} onChange={e => setNewRowData({...newRowData, usage: e.target.value})} placeholder="Ex: Uso Oral, Uso Tópico" />
                      </div>
                   </div>
                 )}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">Cancelar</button>
                 <button onClick={handleSaveRow} disabled={saving || !newRowData.name} className="flex-1 py-4 text-[10px] font-black uppercase text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-95 transition-all">
                    {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingId ? "Atualizar Registro" : "Cadastrar Agora")}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
    </div>
  );
}
