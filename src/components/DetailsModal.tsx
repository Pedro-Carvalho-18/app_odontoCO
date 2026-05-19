export const DetailsModal = ({ item, isOpen, onClose }: { item: any; isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
          <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">Detalhes do Atendimento</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} /></button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-black text-slate-400 uppercase text-[11px] tracking-widest block mb-1">
              {item.procedure.includes("Receitado:") ? "Receituário" : "Procedimento"}
            </label>
            <p className="text-lg font-black text-slate-900 leading-tight italic">
              {item.procedure.includes("Receitado:") 
                ? item.procedure.replace(/PROCEDIMENTO:\s*/i, "").replace(/Receitado:\s*/i, "").trim()
                : item.procedure}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {item.time && <div><label className="font-black text-slate-400 uppercase text-[11px] tracking-widest block mb-1">Horário</label><p className="text-sm font-bold text-slate-800">{item.time}</p></div>}
            <div><label className="font-black text-slate-400 uppercase text-[11px] tracking-widest block mb-1">Data</label><p className="text-sm font-bold text-slate-800">
  {(() => {
    const [y, m, d] = item.date.split('-');
    return `${d}/${m}/${y}`;
  })()}
</p></div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div><label className="font-black text-slate-400 uppercase text-[11px] tracking-widest block mb-1">Profissional</label><p className="text-sm font-bold text-slate-800">{item.professional}</p></div>
            <div><label className="font-black text-slate-400 uppercase text-[11px] tracking-widest block mb-1">Valor</label><p className="text-base font-black text-emerald-600">
  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.numericValue || item.value)}
</p></div>
          </div>
          <div><label className="font-black text-slate-400 uppercase text-[11px] tracking-widest block mb-1">Observações</label><p className="text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl mt-1 leading-relaxed border border-slate-100 italic">"{item.notes}"</p></div>
        </div>
      </div>
    </div>
  );
};

import { X } from "lucide-react";
