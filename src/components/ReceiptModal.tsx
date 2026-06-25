"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Search, 
  Printer, 
  Save, 
  Check, 
  User, 
  ChevronDown, 
  FileText, 
  DollarSign, 
  Calendar,
  Loader2,
  Trash2,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export function ReceiptModal({ isOpen, onClose, patientId }: ReceiptModalProps) {
  const [step, setStep] = useState<'selection' | 'editor'>('selection');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("1");
  const [customName, setCustomName] = useState("");
  const [customCpf, setCustomCpf] = useState("");
  const [referente, setReferente] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalText, setFinalText] = useState("");
  const [saving, setSaving] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, clinRes] = await Promise.all([
        fetch(`/api/pacientes/${patientId}/recibos/dados`),
        fetch("/api/configuracoes/clinica")
      ]);
      const json = await res.json();
      const clinJson = await clinRes.json();
      setData(json);
      setClinicInfo(clinJson);
      setCustomName(json.patient.name);
      setCustomCpf(json.patient.cpf);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchData();
    }
  }, [isOpen, patientId, fetchData]);

  const togglePayment = (id: string) => {
    setSelectedPayments(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generateText = () => {
    if (selectedPayments.length === 0) {
      alert("Selecione ao menos um pagamento.");
      return;
    }

    const professional = data.professionals.find((p: any) => p.id === selectedProfessionalId);
    const total = data.payments
      .filter((p: any) => selectedPayments.includes(p.id.toString()))
      .reduce((acc: number, curr: any) => acc + curr.value, 0);

    const dateObj = new Date(receiptDate);
    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const header = clinicInfo 
      ? `${clinicInfo.name.toUpperCase()}\n${clinicInfo.address || ""}, ${clinicInfo.number || ""}${clinicInfo.complement ? " - " + clinicInfo.complement : ""} - ${clinicInfo.neighborhood || ""}\n${clinicInfo.city || ""} - ${clinicInfo.state || ""} | CEP: ${clinicInfo.zipCode || ""}\nTelefone: ${clinicInfo.phone || ""} | E-mail: ${clinicInfo.email || ""}\n\n================================================================================\n\n`
      : "CONSULTÓRIO ODONTOLÓGICO\nAl. Rogério Pinto Ferráz 257 - Araraquara - SP\n\n================================================================================\n\n";

    let text = `${header}`;
    text += `          RECIBO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS\n\n\n`;
    text += `Recebi de ${customName || data.patient.name}, CPF nº ${customCpf || data.patient.cpf || '___.___.___-__'},\n`;
    text += `a importância de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    text += `referente a ${referente || 'serviços odontológicos realizados'}.\n\n`;
    text += `Para clareza firmo o presente.\n\n\n`;
    text += `Araraquara, ${dateStr}\n\n\n`;
    text += `__________________________________________\n`;
    text += `${professional?.name || 'Cirurgião Dentista'}\n`;
    text += `CPF: ${professional?.cpf || ''}  CRO: ${professional?.cro || ''}\n\n\n`;
    text += `------------------------------------------\n`;
    const fullAddress = clinicInfo
      ? `${clinicInfo.address || ""}${clinicInfo.number ? " " + clinicInfo.number : ""}${clinicInfo.complement ? " - " + clinicInfo.complement : ""}`
      : 'Al. Rogério Pinto Ferráz 257';
    text += `${clinicInfo?.name || 'Consultório Odontológico'}\n`;
    text += `${fullAddress} - ${clinicInfo?.city || 'Araraquara'} - ${clinicInfo?.state || 'SP'}`;

    setFinalText(text);
    setStep('editor');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const professional = data.professionals.find((p: any) => p.id === selectedProfessionalId);
      const total = data.payments
        .filter((p: any) => selectedPayments.includes(p.id.toString()))
        .reduce((acc: number, curr: any) => acc + curr.value, 0);

      const res = await fetch(`/api/pacientes/${patientId}/salvar-recibo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: selectedProfessionalId,
          value: total,
          name: customName,
          referente: referente || 'Serviços Odontológicos',
          date: receiptDate,
          cpfPac: customCpf,
          cpfCir: professional?.cpf || '',
          ccIds: selectedPayments,
          text: finalText
        })
      });

      if (res.ok) {
        alert("Recibo gerado e salvo com sucesso!");
        onClose();
        setStep('selection');
        setSelectedPayments([]);
        setReferente("");
      } else {
        alert("Erro ao salvar recibo.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha na conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-4xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200/50">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Emissão de Recibo</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {step === 'selection' ? 'Seleção de Pagamentos' : 'Edição do Documento'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-emerald-600" />
              <span className="text-[11px] font-black uppercase">Carregando dados financeiros...</span>
            </div>
          ) : step === 'selection' ? (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                
                <section className="grid grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissional Emitente</label>
                      <select 
                        value={selectedProfessionalId} 
                        onChange={(e) => setSelectedProfessionalId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                      >
                         {data.professionals.map((p: any) => (
                           <option key={p.id} value={p.id}>{p.name}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Emissão</label>
                      <input 
                        type="date" 
                        value={receiptDate} 
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome no Recibo</label>
                      <input 
                        type="text" 
                        value={customName} 
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF do Pagador</label>
                      <input 
                        type="text" 
                        value={customCpf} 
                        onChange={(e) => setCustomCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all" 
                      />
                   </div>
                   <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referente a (Opcional)</label>
                      <input 
                        type="text" 
                        value={referente} 
                        onChange={(e) => setReferente(e.target.value)}
                        placeholder="Ex: Tratamento Odontológico, Extração de Dente 16..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all" 
                      />
                   </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <History size={14} /> Selecione os Pagamentos
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {data.payments.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                        Nenhum pagamento registrado para este paciente.
                      </div>
                    ) : (
                      data.payments.map((p: any) => (
                        <button 
                          key={p.id} 
                          onClick={() => togglePayment(p.id.toString())}
                          className={cn(
                            "w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all",
                            selectedPayments.includes(p.id.toString())
                              ? "bg-emerald-50 border-emerald-500 shadow-sm"
                              : "bg-white border-slate-100 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                              selectedPayments.includes(p.id.toString())
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-200"
                            )}>
                              {selectedPayments.includes(p.id.toString()) && <Check size={14} strokeWidth={4} />}
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-700 uppercase">{p.description}</p>
                               <div className="flex items-center gap-3 mt-0.5">
                                 <span className="text-[10px] font-bold text-slate-400">{new Date(p.date).toLocaleDateString('pt-BR')}</span>
                                 {p.receiptNumber && (
                                   <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Recibo #{p.receiptNumber}</span>
                                 )}
                               </div>
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-700">
                             {p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-200 p-8 flex flex-col items-center overflow-hidden">
               <div className="w-full max-w-2xl bg-white shadow-2xl flex-1 rounded-sm border border-slate-300 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     Visualização da Impressão
                  </div>
                  <div className="flex-1 p-12 overflow-y-auto bg-white">
                     <textarea 
                        value={finalText}
                        onChange={(e) => setFinalText(e.target.value)}
                        className="w-full h-full resize-none outline-none font-mono text-[14px] leading-relaxed text-center lining-nums"
                        spellCheck="false"
                     />
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-2xl relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Selecionado</span>
            <span className="text-lg font-black text-emerald-600">
              {data?.payments
                .filter((p: any) => selectedPayments.includes(p.id.toString()))
                .reduce((acc: number, curr: any) => acc + curr.value, 0)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
             {step === 'editor' && (
               <button 
                 onClick={() => setStep('selection')}
                 className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100 transition-all"
               >
                 Voltar
               </button>
             )}
             <button 
               onClick={step === 'selection' ? generateText : handleSave}
               disabled={selectedPayments.length === 0 || saving}
               className={cn(
                 "px-10 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2",
                 selectedPayments.length > 0 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                  : "bg-slate-200 text-slate-400"
               )}
             >
               {saving ? <Loader2 size={16} className="animate-spin" /> : step === 'selection' ? 'Gerar Documento' : 'Salvar e Imprimir'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
