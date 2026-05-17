"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Upload, 
  File, 
  FileText, 
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
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
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
        setCurrentFolder(initialSelectedIntervention);
      } else {
        setCurrentFolder(null);
      }
    }
  }, [isOpen, patientId, fetchFiles, initialSelectedIntervention]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    console.log("Uploading files...", { fileCount: fileList.length, currentFolder });

    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tipo", file.type.includes("image") ? "radiografia" : "documento");
        if (currentFolder !== null && currentFolder !== undefined) {
          formData.append("nroIntPac", String(currentFolder));
          console.log("Appended nroIntPac:", currentFolder);
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

  const handleDeleteFile = async (fileId: number) => {
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

  const currentIntervention = currentFolder ? interventions.find(i => String(i.id) === String(currentFolder)) : null;

  const filteredFiles = files.filter(file => {
    if (currentFolder === null) {
      return !file.NROINTPAC;
    } else {
      return String(file.NROINTPAC) === String(currentFolder);
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Explorador de Arquivos</h3>
                {currentFolder && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">/</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">
                      {currentIntervention?.procedure.slice(0, 30)}...
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Paciente: {patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all cursor-pointer shadow-md active:scale-95">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Enviando..." : "Upload Arquivo"}
              <input key={currentFolder || "root"} type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
            </label>
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
              {/* Navigation Bar */}
              {currentFolder && (
                <button 
                  onClick={() => setCurrentFolder(null)}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:text-blue-700 transition-colors group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Voltar para Raiz
                </button>
              )}

              {/* Files Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200/60" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {currentFolder ? "Arquivos do Tratamento" : "Arquivos Avulsos (Raiz)"}
                  </span>
                  <div className="h-px flex-1 bg-slate-200/60" />
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[40px] bg-white/50">
                    <File size={48} className="mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">
                      {currentFolder 
                        ? "Nenhum documento vinculado a este tratamento" 
                        : "Nenhum arquivo avulso na raiz"}
                    </p>
                    {currentFolder && (
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">
                         Arraste arquivos da raiz para cá para vincular
                       </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredFiles.map(file => {
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.PATH);
                      const isEditing = editingFileId === file.ID;
                      const isDragging = draggedFileId === file.ID;

                      return (
                        <div 
                          key={file.ID} 
                          draggable={!isEditing}
                          onDragStart={(e) => onDragStart(e, file.ID)}
                          onDragEnd={() => setDraggedFileId(null)}
                          className={cn(
                            "group relative bg-white border-2 rounded-[32px] overflow-hidden transition-all duration-300",
                            isEditing ? "border-blue-400 ring-4 ring-blue-50 shadow-2xl scale-[1.02] z-10" : "border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1",
                            isDragging && "opacity-40 grayscale scale-95"
                          )}
                        >
                          <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                            {isImage ? (
                              <img src={file.PATH} alt={file.NOME} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <FileText size={48} className="text-blue-200" />
                                <span className="text-[9px] font-black text-slate-300 uppercase">{file.PATH.split('.').pop()}</span>
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <a href={file.PATH} target="_blank" className="p-2 bg-white text-slate-700 rounded-xl hover:text-blue-600 transition-all shadow-lg active:scale-95" title="Ver original">
                                <ExternalLink size={16} />
                              </a>
                              <button onClick={() => handleDownload(file.PATH, file.NOME)} className="p-2 bg-white text-slate-700 rounded-xl hover:text-blue-600 transition-all shadow-lg active:scale-95" title="Baixar arquivo">
                                <Download size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-[10px] font-black text-slate-700 truncate flex-1" title={file.NOME}>{file.NOME}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <button 
                                  onClick={() => setEditingFileId(isEditing ? null : file.ID)} 
                                  className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    isEditing ? "bg-blue-600 text-white" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                  )}
                                  title="Alterar Vínculo"
                                >
                                  <Settings2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteFile(file.ID)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Excluir">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="relative">
                                  <select 
                                    defaultValue={file.NROINTPAC || ""}
                                    onChange={(e) => handleUpdateVincule(file.ID, e.target.value === "" ? null : e.target.value)}
                                    disabled={updatingId === file.ID}
                                    className="w-full pl-2 pr-8 py-1.5 bg-slate-50 border border-blue-200 rounded-lg text-[9px] font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 appearance-none cursor-pointer"
                                  >
                                    <option value="">Raiz (Avulso)</option>
                                    {interventions.map(int => (
                                      <option key={int.id} value={int.id}>
                                        {new Date(int.date).toLocaleDateString('pt-BR')} - {int.procedure.slice(0, 20)}...
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {updatingId === file.ID && (
                                  <div className="flex items-center justify-center gap-1.5 text-[8px] font-black text-blue-600 uppercase">
                                    <Loader2 size={10} className="animate-spin" /> Atualizando...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                <span className="text-[8px] font-bold text-slate-400">{new Date(file.DATA_UPLOAD).toLocaleDateString('pt-BR')}</span>
                                {file.NROINTPAC ? (
                                  <div className="flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase truncate max-w-[80px]">
                                    <LinkIcon size={8} /> Vinculado
                                  </div>
                                ) : (
                                  <span className="text-[8px] font-black text-slate-300 uppercase">Avulso</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Folders Section (Only show in root) */}
              {currentFolder === null && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200/60" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pastas de Tratamentos</span>
                    <div className="h-px flex-1 bg-slate-200/60" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {interventions.map((int) => {
                      const filesInInt = files.filter(f => String(f.NROINTPAC) === String(int.id)).length;
                      const isTarget = dropTargetId === String(int.id);

                      return (
                        <div 
                          key={int.id}
                          onClick={() => setCurrentFolder(String(int.id))}
                          onDragOver={(e) => onDragOver(e, String(int.id))}
                          onDrop={(e) => onDrop(e, String(int.id))}
                          onDragLeave={() => setDropTargetId(null)}
                          className={cn(
                            "group p-4 bg-white border-2 rounded-[24px] transition-all cursor-pointer relative",
                            isTarget 
                              ? "border-blue-500 bg-blue-50 scale-105 shadow-xl ring-4 ring-blue-100 z-10" 
                              : "border-slate-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-3 rounded-2xl transition-colors shrink-0",
                              filesInInt > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                            )}>
                              <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[10px] font-black text-slate-700 uppercase leading-tight line-clamp-2" title={int.procedure}>
                                {int.procedure}
                              </h4>
                              <p className="text-[9px] font-bold text-slate-400 mt-1">
                                {new Date(int.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase",
                              filesInInt > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                            )}>
                              {filesInInt} arquivo{filesInInt !== 1 ? 's' : ''}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <ChevronRight size={10} />
                            </div>
                          </div>

                          {isTarget && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-[24px]">
                               <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-lg animate-bounce">
                                 Solte para Mover
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Drop Zone for root when inside a folder */}
        {currentFolder && (
          <div 
            onDragOver={(e) => onDragOver(e, null)}
            onDrop={(e) => onDrop(e, null)}
            onDragLeave={() => setDropTargetId(null)}
            className={cn(
              "px-8 py-4 border-t-2 transition-all flex items-center justify-center gap-3",
              dropTargetId === null && draggedFileId ? "bg-blue-50 border-blue-500 border-dashed" : "bg-slate-50 border-transparent"
            )}
          >
            <div className="flex items-center gap-2">
              <Folder size={16} className={dropTargetId === null && draggedFileId ? "text-blue-600" : "text-slate-400"} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                dropTargetId === null && draggedFileId ? "text-blue-600" : "text-slate-400"
              )}>
                {dropTargetId === null && draggedFileId ? "Solte para mover para a Raiz" : "Dica: Arraste arquivos para as pastas ou para a barra inferior para mover"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
