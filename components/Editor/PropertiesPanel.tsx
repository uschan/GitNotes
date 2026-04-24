import React, { useState } from 'react';
import { Icons } from '../Icon';
import { FileItem } from '../../types';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface ReferenceLink {
  fileId: string;
  fileName: string;
  repoId: string;
  repoName: string;
  context?: string;
  type?: string;
}

interface PropertiesPanelProps {
  file: FileItem;
  repoName: string;
  backlinks: ReferenceLink[];
  outgoingLinks: ReferenceLink[];
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ file, repoName, backlinks, outgoingLinks, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'links'>('info');

  const wordCount = file.content.trim() ? file.content.trim().split(/\s+/).length : 0;
  const charCount = file.content.length;

  return (
    <aside className={clsx(
        "bg-zenith-bg border-l border-zenith-border flex flex-col h-full overflow-hidden transition-all duration-300",
        "lg:w-80 lg:relative lg:translate-x-0 lg:z-0",
        "fixed inset-y-0 right-0 w-[85%] max-w-sm z-[60] shadow-2xl lg:shadow-none"
    )}>
      {/* Header */}
      <div className="h-14 border-b border-zenith-border flex items-center justify-between px-4 shrink-0 bg-zenith-surface/50">
          <div className="flex items-center gap-1 border border-zenith-border p-0.5 rounded overflow-hidden scale-90 origin-left">
              <button 
                onClick={() => setActiveTab('info')}
                className={clsx(
                    "px-3 py-1 text-[9px] font-mono tracking-widest uppercase transition-all",
                    activeTab === 'info' ? "bg-white text-black font-bold" : "text-zenith-muted hover:text-white"
                )}
              >
                  Params
              </button>
              <button 
                onClick={() => setActiveTab('links')}
                className={clsx(
                    "px-3 py-1 text-[9px] font-mono tracking-widest uppercase transition-all",
                    activeTab === 'links' ? "bg-white text-black font-bold" : "text-zenith-muted hover:text-white"
                )}
              >
                  Relays
              </button>
          </div>
          <button onClick={onClose} className="text-zenith-muted hover:text-white p-2"><Icons.Close size={14}/></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === 'info' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                  {/* File Stats */}
                  <section className="space-y-4">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zenith-muted uppercase tracking-wider">Type</span>
                          <span className="text-white bg-zenith-surface px-2 py-0.5 rounded border border-zenith-border">Markdown</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zenith-muted uppercase tracking-wider">Module</span>
                          <span className="text-zenith-orange font-bold">{repoName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zenith-muted uppercase tracking-wider">Words</span>
                          <span className="text-white">{wordCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zenith-muted uppercase tracking-wider">Modified</span>
                          <span className="text-white">{new Date(file.updatedAt).toLocaleDateString()}</span>
                      </div>
                  </section>

                  <div className="h-px bg-zenith-border shadow-[0_0_10px_rgba(255,255,255,0.05)]"></div>

                  {/* Character Breakdown Visual */}
                  <section>
                      <h4 className="text-[10px] font-mono font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4">Volume Matrix</h4>
                      <div className="flex gap-1 h-3">
                          <div className="bg-zenith-orange h-full rounded-l-sm" style={{ width: '60%' }} title="Text"></div>
                          <div className="bg-zenith-green h-full" style={{ width: '25%' }} title="Formatting"></div>
                          <div className="bg-zenith-muted h-full rounded-r-sm" style={{ width: '15%' }} title="Meta"></div>
                      </div>
                      <div className="flex justify-between mt-2 text-[9px] font-mono text-zenith-muted uppercase">
                          <span>Alpha</span>
                          <span>{charCount} Units</span>
                      </div>
                  </section>

                  {/* Timeline */}
                  <section>
                     <h4 className="text-[10px] font-mono font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Icons.History size={12} /> Sync Log
                      </h4>
                      <div className="space-y-4 relative border-l border-zenith-border pl-4 ml-1">
                          <div className="relative">
                              <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-zenith-green ring-4 ring-black"></div>
                              <div className="text-[10px] font-mono">
                                  <div className="text-white opacity-90 uppercase font-bold">Node Created</div>
                                  <div className="text-zenith-muted mt-0.5">{new Date(file.updatedAt).toLocaleString()}</div>
                              </div>
                          </div>
                      </div>
                  </section>
              </div>
          ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300">
                  {/* Incoming Links (Backlinks) */}
                  <section>
                      <h4 className="text-[10px] font-mono font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                          <span className="flex items-center gap-2"><Icons.Activity size={14} className="text-zenith-green" /> Inbound</span>
                          <span className="bg-zenith-surface border border-zenith-border px-1.5 py-0.5 rounded text-[9px]">{backlinks.length}</span>
                      </h4>
                      
                      {backlinks.length === 0 ? (
                          <div className="p-4 border border-zenith-border border-dashed text-center">
                              <span className="text-[10px] font-mono text-zenith-muted uppercase">Isolated Node</span>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {backlinks.map((link, idx) => (
                                  <div 
                                      key={idx}
                                      onClick={() => navigate(`/${link.repoId}/${link.fileId}`)}
                                      className="group bg-zenith-surface border border-zenith-border p-3 cursor-pointer hover:border-zenith-orange transition-colors"
                                  >
                                      <div className="text-[11px] font-bold text-white mb-1 group-hover:text-zenith-orange truncate">
                                          {link.fileName}
                                      </div>
                                      {link.context && (
                                          <div className="text-[10px] text-zenith-muted font-mono line-clamp-2 italic border-l border-zenith-border pl-2 mt-1">
                                              {link.context}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}
                  </section>

                  {/* Outgoing Links */}
                  <section>
                      <h4 className="text-[10px] font-mono font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                          <span className="flex items-center gap-2"><Icons.Zap size={14} className="text-zenith-orange" /> Outbound</span>
                          <span className="bg-zenith-surface border border-zenith-border px-1.5 py-0.5 rounded text-[9px]">{outgoingLinks.length}</span>
                      </h4>
                      
                      {outgoingLinks.length === 0 ? (
                          <div className="p-4 border border-zenith-border border-dashed text-center">
                              <span className="text-[10px] font-mono text-zenith-muted uppercase">Terminal Node</span>
                          </div>
                      ) : (
                          <div className="space-y-3">
                               {outgoingLinks.map((link, idx) => (
                                  <div 
                                      key={idx}
                                      onClick={() => navigate(`/${link.repoId}/${link.fileId}`)}
                                      className="group bg-zenith-surface border border-zenith-border p-3 cursor-pointer hover:border-zenith-orange transition-colors flex items-center justify-between"
                                  >
                                      <div className="text-[11px] font-bold text-white group-hover:text-zenith-orange truncate">
                                          {link.fileName}
                                      </div>
                                      <Icons.Info size={10} className="text-zenith-muted group-hover:text-zenith-orange" />
                                  </div>
                              ))}
                          </div>
                      )}
                  </section>
              </div>
          )}
      </div>

      {/* Footer Info Area */}
      <div className="p-4 bg-zenith-surface/30 border-t border-zenith-border mt-auto">
          <div className="flex items-center justify-between font-mono text-[9px] text-zenith-muted uppercase tracking-widest">
              <span className="flex items-center gap-1 opacity-50"><Icons.Info size={10} /> Encryption Active</span>
              <span>v.2.4.0</span>
          </div>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
