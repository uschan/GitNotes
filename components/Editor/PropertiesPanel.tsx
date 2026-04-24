import React from 'react';
import { Icons } from '../Icon';
import { FileItem } from '../../types';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface Backlink {
  fileId: string;
  fileName: string;
  repoId: string;
  repoName: string;
  context: string;
}

interface PropertiesPanelProps {
  file: FileItem;
  repoName: string;
  backlinks: Backlink[];
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ file, repoName, backlinks, onClose }) => {
  const navigate = useNavigate();
  const wordCount = file.content.trim() ? file.content.trim().split(/\s+/).length : 0;
  const charCount = file.content.length;

  return (
    <aside className={clsx(
        "bg-zenith-bg border-l border-zenith-border flex flex-col h-full overflow-hidden transition-all duration-300",
        "lg:w-80 lg:relative lg:translate-x-0 lg:z-0",
        "fixed inset-y-0 right-0 w-[85%] max-w-sm z-[60] shadow-2xl lg:shadow-none"
    )}>
      <div className="h-14 border-b border-zenith-border flex items-center justify-between px-4 shrink-0">
          <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">Metadata</span>
          <button onClick={onClose} className="text-zenith-muted hover:text-white"><Icons.Close size={14}/></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Main Properties */}
          <section className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zenith-muted uppercase tracking-wider">Type</span>
                  <span className="text-white bg-zenith-surface px-2 py-0.5 rounded border border-zenith-border">Markdown</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zenith-muted uppercase tracking-wider">Module</span>
                  <span className="text-zenith-orange">{repoName}</span>
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

          <div className="h-px bg-zenith-border"></div>

          {/* References / Backlinks */}
          <section>
              <h4 className="text-[10px] font-mono font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Icons.GitBranch size={12} /> Linked Mentions
              </h4>
              
              {backlinks.length === 0 ? (
                  <div className="p-4 border border-zenith-border border-dashed text-center">
                      <span className="text-[10px] font-mono text-zenith-muted uppercase">No connections found</span>
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
                              <div className="text-[10px] text-zenith-muted font-mono line-clamp-2 italic border-l border-zenith-border pl-2">
                                  {link.context}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </section>

          {/* History / Activity placeholder */}
          <section>
             <h4 className="text-[10px] font-mono font-bold text-zenith-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Icons.History size={12} /> Timeline
              </h4>
              <div className="space-y-4">
                  <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-zenith-green mt-1 shrink-0"></div>
                      <div className="text-[10px] font-mono">
                          <div className="text-white opacity-80 uppercase">Last Sync</div>
                          <div className="text-zenith-muted mt-0.5">{new Date().toLocaleString()}</div>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-zenith-muted mt-1 shrink-0"></div>
                      <div className="text-[10px] font-mono">
                          <div className="text-white opacity-40 uppercase">Archived</div>
                          <div className="text-zenith-muted mt-0.5">N/A</div>
                      </div>
                  </div>
              </div>
          </section>
      </div>

      {/* Utility Area */}
      <div className="p-4 bg-zenith-surface/30 mt-auto">
          <div className="text-[9px] font-mono text-zenith-muted uppercase tracking-widest flex items-center justify-between">
              <span>Characters</span>
              <span>{charCount}</span>
          </div>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
