"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Upload, 
  File, 
  FileText, 
  FileBadge,
  Trash2, 
  Loader2, 
  ExternalLink,
  Download,
  Link as LinkIcon,
  Check,
  Settings2,
  ChevronDown,
  ChevronRight,
  Folder,
  ArrowLeft,
  FolderOpen,
  Pill,
  Image as ImageIcon,
  DollarSign
} from "lucide-react";
import { cn, rtfToHtml } from "@/lib/utils";

interface PatientFile {
  ID: number;
  NROPAC: string;
  NROINTPAC: number | null;
  NROTRA: number | null;
  NOME: string;
  TIPO: string;
  PATH: string;
  DATA_UPLOAD: string;
  OBSERVACAO: string;
  IS_VIRTUAL?: boolean;
  CONTENT?: string;
}

interface FilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  interventions: any[];
  initialSelectedIntervention?: string;
}

export function FilesModal({ isOpen, onClose, patientId, patientName, interventions, initialSelectedIntervention }: FilesModalProps) {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]); // Array of path segments: e.g. ['tratamentos', '123']
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pacientes/${patientId}/arquivos`);
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      if (initialSelectedIntervention) {
        setCurrentPath(['tratamentos', String(initialSelectedIntervention)]);
      } else {
        setCurrentPath([]);
      }
    }
  }, [isOpen, patientId, fetchFiles, initialSelectedIntervention]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append("file", file);
        
        // Determine type based on current category or file extension
        let tipo = file.type.includes("image") ? "radiografia" : "documento";
        if (currentPath[0] === 'atestados') tipo = 'atestado';
        if (currentPath[0] === 'receituarios') tipo = 'receituario';
        if (currentPath[0] === 'radiografias') tipo = 'radiografia';
        
        formData.append("tipo", tipo);
        
        // Handle treatment binding
        if (currentPath[0] === 'tratamentos' && currentPath[1]) {
          formData.append("nroIntPac", currentPath[1]);
        }

        const res = await fetch(`/api/pacientes/${patientId}/arquivos`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Erro no upload");
      }
      await fetchFiles();
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateVincule = async (fileId: number, newVincule: string | null) => {
    setUpdatingId(fileId);
    try {
      const res = await fetch(`/api/pacientes/${patientId}/arquivos/${fileId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nroIntPac: newVincule }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar vínculo");
      
      await fetchFiles();
      setEditingFileId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar vínculo");
    } finally {
      setUpdatingId(null);
      setDraggedFileId(null);
      setDropTargetId(null);
    }
  };

  const handleDeleteFile = async (fileId: number | string) => {
    if (!confirm("Deseja realmente excluir este arquivo?")) return;

    try {
      const res = await fetch(`/api/pacientes/${patientId}/arquivos/${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.ID !== fileId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const response = await fetch(path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  const onDragStart = (e: React.DragEvent, fileId: number) => {
    setDraggedFileId(fileId);
    e.dataTransfer.setData("fileId", String(fileId));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, interventionId: string | null) => {
    e.preventDefault();
    if (dropTargetId !== interventionId) {
      setDropTargetId(interventionId);
    }
  };

  const onDrop = async (e: React.DragEvent, interventionId: string | null) => {
    e.preventDefault();
    const fileId = Number(e.dataTransfer.getData("fileId"));
    if (fileId && String(interventionId) !== String(files.find(f => f.ID === fileId)?.NROINTPAC || null)) {
      await handleUpdateVincule(fileId, interventionId);
    }
    setDropTargetId(null);
    setDraggedFileId(null);
  };

  if (!isOpen) return null;

  const currentLevel = currentPath.length === 0 ? 'root' : 
                   (currentPath[0] === 'tratamentos' && !currentPath[1] ? 'tratamentos_list' : 'files');

  const filteredFiles = files.filter(file => {
    if (currentLevel === 'files') {
      const category = currentPath[0];
      if (category === 'atestados') return file.TIPO === 'atestado';
      if (category === 'receituarios') return file.TIPO === 'receituario';
      if (category === 'recibos') return file.TIPO === 'recibo';
      if (category === 'radiografias') return file.TIPO === 'radiografia';
      if (category === 'tratamentos' && currentPath[1]) return String(file.NROINTPAC) === String(currentPath[1]);
    }
    return false;
  });

  const getBreadcrumbs = () => {
    const crumbs: { name: string; path: string[] }[] = [{ name: 'Raiz', path: [] }];
    if (currentPath[0]) {
      const catNames: any = { atestados: 'Atestados', receituarios: 'Receituários', recibos: 'Recibos', radiografias: 'Radiografias', tratamentos: 'Tratamentos' };
      crumbs.push({ name: catNames[currentPath[0]], path: [currentPath[0]] });
    }
    if (currentPath[1]) {
      const int = interventions.find(i => String(i.id) === String(currentPath[1]));
      crumbs.push({ name: int?.procedure.slice(0, 20) + '...', path: [currentPath[0], currentPath[1]] });
    }
    return crumbs;
  };

  const categories = [
    { id: 'atestados', name: 'Atestados', icon: FileBadge, color: 'bg-emerald-100 text-emerald-600', count: files.filter(f => f.TIPO === 'atestado').length },
    { id: 'receituarios', name: 'Receituários', icon: Pill, color: 'bg-rose-100 text-rose-600', count: files.filter(f => f.TIPO === 'receituario').length },
    { id: 'recibos', name: 'Recibos', icon: DollarSign, color: 'bg-amber-100 text-amber-600', count: files.filter(f => f.TIPO === 'recibo').length },
    { id: 'radiografias', name: 'Radiografias', icon: ImageIcon, color: 'bg-blue-100 text-blue-600', count: files.filter(f => f.TIPO === 'radiografia').length },
    { id: 'tratamentos', name: 'Tratamentos', icon: Folder, color: 'bg-slate-100 text-slate-600', count: interventions.length },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {currentPath.length > 0 && (
              <button 
                onClick={() => setCurrentPath(prev => prev.slice(0, -1))}
                className="p-2 bg-white border-2 border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center group"
                title="Voltar"
              >
                <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {getBreadcrumbs().map((crumb, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-slate-300">/</span>}
                    <button 
                      onClick={() => setCurrentPath(crumb.path)}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-all",
                        idx === getBreadcrumbs().length - 1 ? "text-slate-800" : "text-blue-600 hover:text-blue-700"
                      )}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Paciente: {patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {currentLevel === 'files' && (
               <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all cursor-pointer shadow-md active:scale-95">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Enviando..." : "Upload Arquivo"}
                <input key={currentPath.join('_')} type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
              </label>
             )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={40} className="animate-spin mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Carregando explorador...</p>
            </div>
          ) : (
            <div className="space-y-10">
              
              {currentLevel === 'root' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id}
                      onClick={() => setCurrentPath([cat.id])}
                      className="group p-8 bg-white border-2 border-slate-100 rounded-[40px] transition-all cursor-pointer hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center gap-4 text-center"
                    >
                      <div className={cn("p-6 rounded-[32px] transition-transform group-hover:scale-110", cat.color)}>
                        <cat.icon size={48} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em]">{cat.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                          {cat.count} {cat.count === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentLevel === 'tratamentos_list' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200/60" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pastas de Tratamentos</span>
                    <div className="h-px flex-1 bg-slate-200/60" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {interventions.map((int) => {
                      const filesInInt = files.filter(f => String(f.NROINTPAC) === String(int.id)).length;
                      return (
                        <div 
                          key={int.id}
                          onClick={() => setCurrentPath(['tratamentos', String(int.id)])}
                          className="group p-4 bg-white border-2 border-slate-100 rounded-[24px] transition-all cursor-pointer hover:border-blue-200 hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-3 rounded-2xl bg-amber-100 text-amber-600")}>
                              <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[10px] font-black text-slate-700 uppercase leading-tight line-clamp-2">{int.procedure}</h4>
                              <p className="text-[9px] font-bold text-slate-400 mt-1">{new Date(int.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase">{filesInInt} itens</span>
                            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight size={10} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentLevel === 'files' && (
                <div className="space-y-4">
                  {filteredFiles.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[40px] bg-white/50">
                      <File size={48} className="mb-4 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">Nenhum documento encontrado nesta pasta</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {filteredFiles.map(file => {
                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.PATH);
                        const isEditing = editingFileId === file.ID;
                        
                        const handleOpen = () => {
                          if (file.IS_VIRTUAL) {
                            const win = window.open('', '_blank');
                            if (win) {
                                const isRtf = file.CONTENT?.includes('{\\rtf');
                                const content = isRtf ? rtfToHtml(file.CONTENT!) : file.CONTENT;
                                const contentStyle = isRtf ? '' : 'white-space: pre-wrap;';
                                
                                win.document.write(`<html><head><title>${file.NOME}</title></head><body style="font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto;"><div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;"><h2 style="margin: 0;">${file.NOME}</h2><button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Imprimir</button></div><div style="color: #666; font-size: 12px; margin-bottom: 20px;">Data: ${new Date(file.DATA_UPLOAD).toLocaleString('pt-BR')}</div><div style="${contentStyle} background: #fff; padding: 40px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-family: serif; font-size: 16px;">${content || 'Sem conteúdo disponível'}</div><div style="margin-top: 40px; color: #999; font-size: 10px; text-align: center; border-top: 1px solid #eee; pt: 10px;">Documento recuperado do Banco de Dados | Sistema de Gestão Odontológica</div></body></html>`);
                                win.document.close();
                            }
                          } else {
                            window.open(file.PATH, '_blank');
                          }
                        };

                        const handleDownloadForce = () => {
                          if (file.IS_VIRTUAL) {
                            const blob = new Blob([file.CONTENT || ''], { type: 'application/msword' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `${file.NOME.replace(/\s+/g, '_')}.doc`);
                            document.body.appendChild(link);
                            link.click();
                            link.parentNode?.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } else {
                            handleDownload(file.PATH, file.NOME);
                          }
                        };

                        return (
                          <div key={file.ID} className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-300 flex flex-col">
                            {/* Preview Area ... */}
                            {/* (rest of the card UI remains same but uses handleOpen and handleDownloadForce) */}
                            {/* I will only replace the relevant part in the tool call */}
                            {/* Preview Area */}
                            <div 
                              onClick={handleOpen}
                              className="aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden relative cursor-pointer group/preview"
                            >
                              {isImage ? (
                                <img src={file.PATH} alt={file.NOME} className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110" />
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover/preview:scale-110 transition-transform">
                                    <FileText size={32} className="text-blue-500" />
                                  </div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{file.PATH.split('.').pop() || 'DOC'}</span>
                                </div>
                              )}
                              
                              {/* Overlay on Hover */}
                              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4 group-hover/preview:translate-y-0 transition-transform">
                                  <ExternalLink size={14} className="text-blue-600" />
                                  <span className="text-[10px] font-black text-blue-600 uppercase">Abrir Arquivo</span>
                                </div>
                              </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="mb-3">
                                <h5 className="text-[11px] font-black text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors" title={file.NOME}>
                                  {file.NOME}
                                </h5>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                  {new Date(file.DATA_UPLOAD).toLocaleDateString('pt-BR')}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                                <button 
                                  onClick={handleOpen}
                                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all group/btn"
                                  title="Abrir"
                                >
                                  <ExternalLink size={16} />
                                  <span className="text-[8px] font-black uppercase">Abrir</span>
                                </button>

                                <button 
                                  onClick={handleDownloadForce}
                                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all group/btn"
                                  title="Download"
                                >
                                  <Download size={16} />
                                  <span className="text-[8px] font-black uppercase">Baixar</span>
                                </button>

                                <button 
                                  onClick={() => handleDeleteFile(file.ID)}
                                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all group/btn"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                  <span className="text-[8px] font-black uppercase">Excluir</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
