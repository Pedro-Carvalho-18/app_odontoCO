"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  User,
  Search,
  Filter,
  X,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

function AgendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [searchPatient, setSearchPatient] = useState("");
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isPatientSearchFocused, setIsSearchFocused] = useState(false);
  
  const [catalog, setCatalog] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: currentDate.toISOString().split('T')[0],
    startTime: "08:00",
    endTime: "08:30",
    professionalId: "1",
    statusId: "1",
    type: "Consulta",
    notes: ""
  });

  // Handle patient pre-selection from URL
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId) {
      const fetchPatient = async () => {
        try {
          const res = await fetch(`/api/pacientes/${patientId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedPatient(data);
            setSearchPatient(data.name);
            setShowNewModal(true);
          }
        } catch (err) {
          console.error("Error pre-selecting patient:", err);
        }
      };
      fetchPatient();
    }
  }, [searchParams]);

  // Calculate week dates (Monday to Saturday)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    // Ajustar para segunda-feira (1). Se for domingo (0), volta 6 dias.
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const fetchAgenda = useCallback(async () => {
    if (!weekDays || weekDays.length < 6) return;
    setLoading(true);
    try {
      const start = weekDays[0];
      const end = weekDays[5];
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      
      const res = await fetch(`/api/agenda?startDate=${startStr}&endDate=${endStr}`);
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch agenda:", err);
    } finally {
      setLoading(false);
    }
  }, [weekDays]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  useEffect(() => {
    async function loadCatalog() {
      const res = await fetch('/api/catalogo');
      const data = await res.json();
      setCatalog(data);
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/pacientes?q=${searchPatient}&limit=5`);
        const data = await res.json();
        setPatientsList(data.patients || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (isPatientSearchFocused && !searchPatient) {
      fetchList();
      return;
    }

    if (!searchPatient) {
      setPatientsList([]);
      return;
    }

    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [searchPatient, isPatientSearchFocused]);

  const handleSave = async () => {
    if (!selectedPatient && !searchPatient) return;
    setSaving(true);
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patientId: selectedPatient?.id,
          patientName: selectedPatient?.name || searchPatient
        })
      });
      if (res.ok) {
        setShowNewModal(false);
        fetchAgenda();
        setSelectedPatient(null);
        setSearchPatient("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (appt: any) => {
    setSelectedAppt(appt);
    setFormData({
      date: appt.date.split(' ')[0],
      startTime: appt.startTime,
      endTime: appt.endTime,
      professionalId: appt.professionalId?.toString() || "1",
      statusId: appt.statusId?.toString() || "1",
      type: appt.type,
      notes: appt.notes || ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agenda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: selectedAppt.id
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchAgenda();
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
      const res = await fetch(`/api/agenda?id=${selectedAppt.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setShowEditModal(false);
        fetchAgenda();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const resetToday = () => setCurrentDate(new Date());

  const timeSlots = Array.from({ length: 26 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7;
    const minutes = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const formatDateToSQL = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-4 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Agenda Semanal</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {weekDays.length > 0 && (
                <>
                  {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {weekDays[weekDays.length - 1].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={prevWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 border-r border-slate-200/50 rounded-r-none"><ChevronLeft size={18} /></button>
            
            <button 
              onClick={() => {
                if (dateInputRef.current) {
                  try {
                    // @ts-ignore
                    dateInputRef.current.showPicker();
                  } catch (e) {
                    dateInputRef.current.click();
                  }
                }
              }}
              className="relative flex items-center group border-r border-slate-200/50 hover:bg-white transition-colors h-full"
            >
              <input 
                ref={dateInputRef}
                type="date" 
                className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none"
                value={currentDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(new Date(e.target.value + 'T12:00:00'));
                  }
                }}
              />
              <div className="flex items-center pl-9 pr-4 py-2 relative">
                <div className="absolute left-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                  <CalendarIcon size={14} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-blue-600 transition-colors">
                  Calendário
                </span>
              </div>
            </button>

            <button onClick={nextWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 rounded-l-none"><ChevronRight size={18} /></button>
          </div>
          
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <Plus size={16} />
            Novo Agendamento
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          )}

          <div className="min-w-[1200px] h-full flex flex-col">
            {/* Day Headers */}
            <div className="flex border-b border-slate-100 sticky top-0 bg-white z-20">
              <div className="w-20 shrink-0 border-r border-slate-100 bg-slate-50/50"></div>
              {weekDays.map((day, i) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div key={i} className={cn(
                    "flex-1 py-4 flex flex-col items-center justify-center border-r border-slate-100 last:border-0",
                    isToday ? "bg-blue-50/30" : "bg-white"
                  )}>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em]",
                      isToday ? "text-blue-600" : "text-slate-400"
                    )}>
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <span className={cn(
                      "text-lg font-black mt-0.5",
                      isToday ? "text-blue-600" : "text-slate-900"
                    )}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="flex-1">
              {timeSlots.map((time) => {
                const now = new Date();
                const currentH = now.getHours();
                const currentM = now.getMinutes();
                const [slotH, slotM] = time.split(':').map(Number);
                
                const isCurrentTimeSlot = currentH === slotH && (currentM >= slotM && currentM < slotM + 30);

                return (
                  <div 
                    key={time} 
                    className={cn(
                      "flex border-b border-slate-50 last:border-0 min-h-[80px]",
                      isCurrentTimeSlot && "bg-blue-50/10"
                    )}
                  >
                    <div className="w-20 shrink-0 flex flex-col items-end justify-start py-3 pr-4 border-r border-slate-100 bg-slate-50/30">
                      <span className={cn(
                        "text-[10px] font-black",
                        isCurrentTimeSlot ? "text-blue-600" : "text-slate-800"
                      )}>{time}</span>
                      {isCurrentTimeSlot && <span className="text-[6px] font-black text-blue-500 uppercase tracking-tighter mt-1">Agora</span>}
                    </div>

                    {weekDays.map((day, dayIdx) => {
                      const dateStr = formatDateToSQL(day);
                      const appts = appointments.filter(a => {
                        const aDateStr = a.date.split(' ')[0];
                        if (aDateStr !== dateStr) return false;
                        
                        const [slotH, slotM] = time.split(':').map(Number);
                        const [startH, startM] = a.startTime.split(':').map(Number);
                        const [endH, endM] = a.endTime.split(':').map(Number);
                        const slotT = slotH * 60 + slotM;
                        const startT = startH * 60 + startM;
                        const endT = endH * 60 + endM;
                        
                        return slotT >= startT && slotT < endT;
                      });

                      return (
                        <div key={dayIdx} className="flex-1 border-r border-slate-50 last:border-0 p-1 relative group">
                          {appts.length > 0 ? (
                            <div className="space-y-1">
                              {appts.map(appt => {
                                const isFirstSlot = time === appt.startTime || !appointments.some(a => a.id === appt.id && a.date.split(' ')[0] === dateStr && a.startTime < time);
                                return (
                                  <div 
                                    key={appt.id}
                                    onClick={() => handleEdit(appt)}
                                    className={cn(
                                      "p-2 rounded-xl border transition-all cursor-pointer overflow-hidden",
                                      appt.statusId === "01" || appt.statusId === "03" ? "bg-rose-50 border-rose-100 text-rose-700" : 
                                      appt.statusId === "05" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                      appt.statusId === "06" ? "bg-amber-50 border-amber-100 text-amber-700" :
                                      "bg-blue-50 border-blue-100 text-blue-700",
                                      !isFirstSlot && "opacity-40 border-dashed"
                                    )}
                                  >
                                    {isFirstSlot ? (
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="text-[8px] font-black uppercase tracking-widest">{appt.startTime} - {appt.endTime}</span>
                                          <span className="text-[8px] font-bold opacity-60 uppercase">• {appt.type}</span>
                                          {appt.source === 'intervention' && (
                                            <span className="bg-slate-900 text-white text-[6px] px-1 rounded font-black uppercase tracking-tighter">Lançamento</span>
                                          )}
                                        </div>
                                        <h3 className="text-[9px] font-black uppercase truncate leading-tight">{appt.patientName}</h3>
                                      </div>
                                    ) : (
                                      <div className="h-1" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setFormData({...formData, date: dateStr, startTime: time, endTime: (() => {
                                  const [h, m] = time.split(':').map(Number);
                                  const total = h * 60 + m + 30;
                                  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
                                })()});
                                setShowNewModal(true);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-blue-50/30 flex items-center justify-center transition-all"
                            >
                              <Plus size={14} className="text-blue-500" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><Plus size={20} /></div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">Novo Agendamento</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preencha os dados da consulta</p>
                  </div>
               </div>
               <button onClick={() => setShowNewModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
               <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar paciente ou digitar nome..." 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      value={searchPatient}
                      onChange={(e) => {
                        setSearchPatient(e.target.value);
                        if (selectedPatient) setSelectedPatient(null);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    />
                  </div>
                  {isPatientSearchFocused && patientsList.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[210] overflow-y-auto max-h-48 custom-scrollbar">
                      {patientsList.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => {
                            setSelectedPatient(p);
                            setSearchPatient(p.name);
                            setIsSearchFocused(false);
                          }}
                          className="w-full p-4 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black uppercase">{p.name[0]}</div>
                          <span className="font-bold text-sm text-slate-700 uppercase">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                      value={formData.statusId}
                      onChange={e => setFormData({...formData, statusId: e.target.value})}
                    >
                      {catalog?.agendaStatuses?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
                    <input 
                      type="time" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim</label>
                    <input 
                      type="time" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissional</label>
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

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Observações</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none min-h-[100px] resize-none"
                    placeholder="Ex: Limpeza, Avaliação, etc..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value, type: e.target.value})}
                  />
               </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
               <button onClick={() => setShowNewModal(false)} className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200">Cancelar</button>
               <button onClick={handleSave} disabled={saving || (!selectedPatient && !searchPatient)} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                 {saving ? <Loader2 size={16} className="animate-spin" /> : "Agendar Consulta"}
               </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg"><Clock size={20} /></div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900">Editar Agendamento</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedAppt?.patientName}</p>
                  </div>
               </div>
               <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                      value={formData.statusId}
                      onChange={e => setFormData({...formData, statusId: e.target.value})}
                    >
                      {catalog?.agendaStatuses?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
                    <input 
                      type="time" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim</label>
                    <input 
                      type="time" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Observações</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
               </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
               {showDeleteConfirm ? (
                 <div className="flex-1 flex gap-3 animate-in zoom-in-95 duration-200">
                    <button onClick={handleDelete} disabled={saving} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Exclusão"}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200">Cancelar</button>
                 </div>
               ) : (
                 <>
                    <button onClick={handleUpdate} disabled={saving} className="flex-[3] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : "Salvar Alterações"}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 flex items-center justify-center">
                      <Trash2 size={18} />
                    </button>
                 </>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <AgendaContent />
    </Suspense>
  );
}
