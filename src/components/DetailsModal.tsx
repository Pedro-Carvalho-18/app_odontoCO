export const DetailsModal = ({ item, isOpen, onClose }: { item: any; isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase text-slate-800">Detalhes do Atendimento</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4 text-xs">
          <div><label className="font-black text-slate-400 uppercase text-[9px]">Procedimento</label><p className="font-bold text-slate-800">{item.procedure}</p></div>
          {item.time && <div><label className="font-black text-slate-400 uppercase text-[9px]">Horário</label><p className="font-bold text-slate-800">{item.time}</p></div>}
          <div><label className="font-black text-slate-400 uppercase text-[9px]">Data</label><p className="font-bold text-slate-800">
  {(() => {
    const [y, m, d] = item.date.split('-');
    return `${d}/${m}/${y}`;
  })()}
</p></div>
          <div><label className="font-black text-slate-400 uppercase text-[9px]">Profissional</label><p className="font-bold text-slate-800">{item.professional}</p></div>
          <div><label className="font-black text-slate-400 uppercase text-[9px]">Valor</label><p className="font-bold text-emerald-600">
  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.numericValue || item.value)}
</p></div>
          <div><label className="font-black text-slate-400 uppercase text-[9px]">Observações</label><p className="font-bold text-slate-600 bg-slate-50 p-3 rounded-xl mt-1">{item.notes}</p></div>
        </div>
      </div>
    </div>
  );
};

import { X } from "lucide-react";
