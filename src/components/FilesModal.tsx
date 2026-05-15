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
  ChevronDown
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
  const [selectedIntervention, setSelectedIntervention] = useState<string>("");
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
        setSelectedIntervention(initialSelectedIntervention);
      } else {
        setSelectedIntervention("");
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
        formData.append("tipo", file.type.includes("image") ? "radiografia" : "documento");
        if (selectedIntervention) {
          formData.append("nroIntPac", selectedIntervention);
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

  const handleUpdateVincule = async (fileId: number, newVincule: string) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-100">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Documentos e Imagens</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Paciente: {patientName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar: Upload & Filters */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col gap-6 bg-slate-50/50">
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de Vínculo (Novo Upload)</span>
                <div className="flex p-1 bg-slate-200/50 rounded-xl gap-1">
                  <button 
                    onClick={() => setSelectedIntervention("")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                      !selectedIntervention ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Avulso
                  </button>
                  <button 
                    onClick={() => {
                      if (interventions.length > 0 && !selectedIntervention) {
                        setSelectedIntervention(String(interventions[0].id));
                      }
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                      selectedIntervention ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Consulta
                  </button>
                </div>
              </div>

                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Selecionar Consulta</span>
                    <select 
                      value={selectedIntervention}
                      onChange={(e) => setSelectedIntervention(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-sm"
                    >
                      {interventions.map(int => (
                        <option key={int.id} value={int.id}>
                          {new Date(int.date).toLocaleDateString('pt-BR')} - {int.procedure.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group relative overflow-hidden">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="text-[9px] font-black text-blue-600 uppercase">Enviando...</span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-blue-100 transition-colors mb-3">
                      <Upload size={20} className="text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-blue-600">Solte ou Clique</span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase mt-1">Imagens ou PDFs</span>
                  </>
                )}
                <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            <div className="mt-auto">
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 leading-tight">
                  <span className="text-blue-600 font-black">Dica:</span> Para mudar o vínculo de um arquivo já salvo, clique no ícone de engrenagem no card do arquivo.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content: Files Grid */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={40} className="animate-spin mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Carregando arquivos...</p>
              </div>
            ) : (() => {
              const filteredFiles = files.filter(file => {
                if (selectedIntervention === "") {
                  // Aba Avulso: mostra apenas o que não tem vínculo
                  return !file.NROINTPAC;
                } else {
                  // Aba Consulta: mostra APENAS o que pertence à consulta selecionada
                  return String(file.NROINTPAC) === String(selectedIntervention);
                }
              });

              if (filteredFiles.length === 0) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px]">
                    <File size={48} className="mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">
                      {selectedIntervention === "" 
                        ? "Nenhum arquivo avulso encontrado" 
                        : "Nenhum documento vinculado a esta consulta específica"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFiles.map(file => {
                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.PATH);
                    const intervention = interventions.find(i => String(i.id) === String(file.NROINTPAC));
                    const isEditing = editingFileId === file.ID;

                    return (
                      <div key={file.ID} className={cn(
                        "group relative bg-white border rounded-3xl overflow-hidden transition-all duration-300",
                        isEditing ? "border-blue-400 ring-4 ring-blue-50 shadow-2xl scale-[1.02] z-10" : "border-slate-200 hover:shadow-xl hover:-translate-y-1"
                      )}>
                        <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden relative">
                          {isImage ? (
                            <img src={file.PATH} alt={file.NOME} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <FileText size={48} className="text-blue-200" />
                              <span className="text-[9px] font-black text-slate-300 uppercase">{file.PATH.split('.').pop()}</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a href={file.PATH} target="_blank" className="p-2 bg-white text-slate-700 rounded-xl hover:text-blue-600 transition-all shadow-lg" title="Ver original">
                              <ExternalLink size={16} />
                            </a>
                            <button onClick={() => handleDownload(file.PATH, file.NOME)} className="p-2 bg-white text-slate-700 rounded-xl hover:text-blue-600 transition-all shadow-lg" title="Baixar arquivo">
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
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
                                  onChange={(e) => handleUpdateVincule(file.ID, e.target.value)}
                                  disabled={updatingId === file.ID}
                                  className="w-full pl-2 pr-8 py-1.5 bg-slate-50 border border-blue-200 rounded-lg text-[9px] font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 appearance-none cursor-pointer"
                                >
                                  <option value="">Tornar Avulso</option>
                                  {interventions.map(int => (
                                    <option key={int.id} value={int.id}>
                                      {new Date(int.date).toLocaleDateString('pt-BR')} - {int.procedure.slice(0, 20)}...
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>                              {updatingId === file.ID && (
                                <div className="flex items-center justify-center gap-1.5 text-[8px] font-black text-blue-600 uppercase">
                                  <Loader2 size={10} className="animate-spin" /> Atualizando...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                              <span className="text-[8px] font-bold text-slate-400">{new Date(file.DATA_UPLOAD).toLocaleDateString('pt-BR')}</span>
                              {intervention ? (
                                <div className="flex items-center gap-1 text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase truncate max-w-[120px]" title={intervention.procedure}>
                                  <LinkIcon size={8} /> {intervention.procedure}
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded-full uppercase">Avulso</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
