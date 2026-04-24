import React, { useState } from 'react';
import { Icons } from '../Icon';
import { FileItem } from '../../types';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

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
  repoId: string;
  repoName: string;
  backlinks: ReferenceLink[];
  outgoingLinks: ReferenceLink[];
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ file, repoId, repoName, backlinks, outgoingLinks, onClose }) => {
  const navigate = useNavigate();
  const wordCount = file.content.trim() ? file.content.trim().split(/\s+/).length : 0;
  
  return (
    <aside className={clsx(
        "bg-zenith-bg border-l border-zenith-border flex flex-col h-full overflow-hidden transition-all duration-300 shrink-0",
        "w-80 relative translate-x-0 z-0 hidden lg:flex"
    )}>
      {/* Header */}
      <div className="h-14 border-b border-zenith-border flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2">
              <span className="text-[12px] tracking-tight font-bold text-white/90">Properties</span>
          </div>
          <button onClick={onClose} className="text-zenith-muted hover:text-white p-1 transition-colors"><Icons.Close size={16}/></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Metadata Grid */}
          <section className="space-y-4">
              <PropertyRow label="Created Time">
                  <div className="flex items-center gap-2 text-white/50">
                      <Icons.Calendar size={12} />
                      <span className="text-[11px] tabular-nums">{new Date(file.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
              </PropertyRow>
              <PropertyRow label="Date">
                   <div className="flex items-center gap-2 text-white/50">
                      <Icons.Calendar size={12} />
                      <span className="text-[11px] tabular-nums">{new Date(file.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
              </PropertyRow>
          </section>

          {/* Info Section */}
          <section className="pt-4">
              <h4 className="text-[11px] font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4 opacity-50">Document Stats</h4>
              <div className="space-y-3 text-[11px]">
                  <StatRow label="Words" value={wordCount} />
                  <StatRow label="Characters" value={file.content.length} />
                  <StatRow label="Modified" value={new Date(file.updatedAt).toLocaleTimeString()} />
              </div>
          </section>

          {/* Relational Sections */}
          <section className="space-y-8 pt-4">
              {/* Belongs To */}
              <div>
                  <h4 className="text-[11px] font-bold text-zenith-muted uppercase tracking-[0.2em] mb-3 opacity-50">Source Module</h4>
                  <div 
                    onClick={() => navigate(`/${repoId}`)}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/[0.08] transition-all group"
                  >
                      <div className="flex items-center gap-2">
                        <Icons.Database size={12} className="text-zenith-orange" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wide">{repoName}</span>
                      </div>
                      <Icons.ChevronRight size={14} className="text-zenith-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
              </div>

              {/* Linked Mentions (Backlinks) */}
              <div>
                  <div className="flex items-center justify-between mb-3 text-[11px] font-bold text-zenith-muted uppercase tracking-[0.2em] opacity-50">
                      <span>Linked Mentions</span>
                      <span className="opacity-40 tabular-nums">{backlinks.length}</span>
                  </div>
                  <div className="space-y-1.5">
                      {backlinks.map((link, idx) => (
                          <div 
                              key={idx}
                              onClick={() => navigate(`/${link.repoId}/${link.fileId}`)}
                              className="flex flex-col gap-1 p-2.5 bg-zenith-surface border border-transparent hover:border-zenith-orange/20 rounded-md cursor-pointer transition-colors group"
                          >
                              <div className="flex items-center gap-2 text-white/90">
                                <Icons.Book size={10} className="text-zenith-orange" />
                                <span className="text-[11px] font-bold truncate tracking-tight">{link.fileName.replace('.md', '')}</span>
                              </div>
                              {link.context && <p className="text-[10px] text-zenith-muted line-clamp-1 italic">"{link.context}"</p>}
                          </div>
                      ))}
                      {backlinks.length === 0 && <div className="text-[10px] text-zenith-muted italic opacity-40 px-2">No incoming connections</div>}
                  </div>
              </div>

              {/* Related To (Outgoing) */}
              <div>
                   <div className="flex items-center justify-between mb-3 text-[11px] font-bold text-zenith-muted uppercase tracking-[0.2em] opacity-50">
                      <span>Outgoing Links</span>
                      <span className="opacity-40 tabular-nums">{outgoingLinks.length}</span>
                  </div>
                  <div className="space-y-1.5">
                      {outgoingLinks.map((link, idx) => (
                          <div 
                              key={idx}
                              onClick={() => navigate(`/${link.repoId}/${link.fileId}`)}
                              className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-md hover:border-white/20 cursor-pointer transition-colors group"
                          >
                              <Icons.Link size={10} className="text-zenith-muted" />
                              <span className="text-[11px] text-white/70 font-medium truncate">{link.fileName.replace('.md', '')}</span>
                          </div>
                      ))}
                      {outgoingLinks.length === 0 && <div className="text-[10px] text-zenith-muted italic opacity-40 px-2">No outbound connections</div>}
                  </div>
              </div>
          </section>
      </div>

      <div className="h-10 border-t border-zenith-border flex items-center justify-center bg-[#0d0d0d]">
          <span className="text-[9px] font-mono text-zenith-muted uppercase tracking-[0.3em] opacity-40">Persistence Layer Active</span>
      </div>
    </aside>
  );
};

const PropertyRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-[110px_1fr] items-center py-0.5">
        <span className="text-[11px] text-zenith-muted uppercase tracking-widest">{label}</span>
        <div className="flex-1">{children}</div>
    </div>
);

const StatRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-zenith-muted">{label}</span>
        <span className="text-white/60 font-medium">{value}</span>
    </div>
);

export default PropertiesPanel;
