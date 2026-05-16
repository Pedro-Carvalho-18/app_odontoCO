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
  X
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
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [newRowData, setNewRowData] = useState({ name: "", cro: "", specialtyId: "" });

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
          setNewRowData(prev => ({ ...prev, specialtyId: specData[0]?.id || "1" }));
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

  const handleAddRow = async () => {
    if (!newRowData.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/configuracoes/db-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: dbTable, data: newRowData })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewRowData({ name: "", cro: "", specialtyId: specialties[0]?.id || "1" });
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

  const [dbStats, setDbLoadingStats] = useState({ version: "---", lastApplied: "---", logs: 0 });

  useEffect(() => {
    async function loadStats() {
      if (activeTab === "banco") {
        try {
          const res = await fetch("/api/health");
          const data = await res.json();
          setDbLoadingStats({
            version: data.dbVersion,
            lastApplied: new Date(data.timestamp).toLocaleDateString('pt-BR'),
            logs: 0 // Simplificado
          });
        } catch (err) { console.error(err); }
      }
    }
    loadStats();
  }, [activeTab]);

  const handleExportBackup = () => {
    alert("Exportando backup para suporte... (Este arquivo deverá ser enviado ao desenvolvedor)");
    // Aqui poderíamos disparar o download direto do arquivo .sqlite
    window.open('/api/configuracoes/backup');
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
    item.cro?.toLowerCase().includes(dbSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
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
                  <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
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
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / Descrição</th>
                              {dbTable === "dentistas" && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CRO</th>}
                              {dbTable === "procedimentos" && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidade</th>}
                              <th className="px-6 py-4"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {filteredDbData.map(item => (
                             <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 text-xs font-bold text-slate-400">{item.id}</td>
                                <td className="px-6 py-4 text-xs font-black text-slate-700 uppercase">{item.name}</td>
                                {dbTable === "dentistas" && <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.cro || "---"}</td>}
                                {dbTable === "procedimentos" && <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.specialty || "Geral"}</td>}
                                <td className="px-6 py-4 text-right">
                                   <button 
                                      onClick={() => handleDeleteRow(item.id)}
                                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   )}
                </div>
              </div>

              {/* Support Info */}
              <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl shadow-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Informações de Suporte</h3>
                      <div className="flex gap-4 mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Versão do DB: <span className="text-white">{dbStats.version}</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sincronizado: <span className="text-white">{dbStats.lastApplied}</span></p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleExportBackup}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Database size={14} /> Exportar Banco (Suporte)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "perfil" && activeTab !== "clinica" && activeTab !== "banco" && (
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
           <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl"><Plus size={18} /></div>
                    <h3 className="text-sm font-black uppercase text-slate-900">Novo em {dbTable}</h3>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-4">
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
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm" 
                        value={newRowData.specialtyId}
                        onChange={e => setNewRowData({...newRowData, specialtyId: e.target.value})}
                      >
                        {specialties.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                   </div>
                 )}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 rounded-2xl">Cancelar</button>
                 <button onClick={handleAddRow} disabled={saving || !newRowData.name} className="flex-1 py-4 text-[10px] font-black uppercase text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50">
                    {saving ? "Salvando..." : "Confirmar"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
