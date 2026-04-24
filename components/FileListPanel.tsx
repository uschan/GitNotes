import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from './Icon';
import clsx from 'clsx';

interface FileListPanelProps {
  repos: Repository[];
  onAddFile: (repoId: string, filename: string) => void;
}

const FileListPanel: React.FC<FileListPanelProps> = ({ repos, onAddFile }) => {
  const { repoId, fileId: activeFileId } = useParams<{ repoId: string, fileId?: string }>();
  const repo = repos.find(r => r.id === repoId);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  if (!repo) return null;

  const filteredFiles = repo.files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddFile(repo.id, newName.trim());
      setNewName('');
      setShowAdd(false);
    }
  };

  return (
    <div className="flex w-72 bg-[#080808] border-r border-zenith-border flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zenith-border bg-[#0d0d0d]">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-bold text-[13px] uppercase tracking-[0.1em] text-zenith-muted truncate">{repo.name}</h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setShowAdd(!showAdd)}
                  className="w-5 h-5 flex items-center justify-center rounded bg-zenith-surface border border-zenith-border text-zenith-muted hover:text-white transition-colors"
                >
                    <Icons.Plus size={12} />
                </button>
            </div>
        </div>
        
        <div className="relative group">
            <Icons.Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zenith-border group-focus-within:text-zenith-orange transition-colors" />
            <input 
                type="text"
                placeholder="Search module..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-zenith-border rounded pl-8 pr-3 py-1.5 text-[11px] font-sans text-white outline-none focus:border-white/20 transition-all placeholder:text-zenith-border"
            />
        </div>

        {showAdd && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                <form onSubmit={handleAdd}>
                    <input 
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="New entry name..."
                        className="w-full bg-zenith-surface border border-zenith-orange px-3 py-1.5 text-[11px] font-mono text-white outline-none rounded"
                    />
                </form>
            </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredFiles.length === 0 ? (
            <div className="p-12 text-center text-[10px] text-zenith-muted font-mono uppercase tracking-[0.2em] opacity-40">
                No Entries
            </div>
        ) : (
            filteredFiles.map(file => {
                const isActive = activeFileId === file.id;
                return (
                    <NavLink
                        key={file.id}
                        to={`/${repo.id}/${file.id}`}
                        className={clsx(
                            "block px-5 py-3.5 border-b border-zenith-border/30 transition-all relative group",
                            isActive ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zenith-orange shadow-[0_0_10px_rgba(255,77,0,0.5)]"></div>
                        )}
                        
                        <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className={clsx(
                                "font-bold text-[13px] leading-snug truncate tracking-tight",
                                isActive ? "text-white" : "text-white/60 group-hover:text-white transition-colors"
                            )}>
                                {file.name.replace('.md', '')}
                            </h3>
                            <span className="text-[9px] font-mono tabular-nums text-zenith-border mt-0.5 whitespace-nowrap">
                                {new Date(file.updatedAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                            </span>
                        </div>
                        
                        <p className="text-[11px] text-zenith-muted line-clamp-1 leading-relaxed opacity-50 group-hover:opacity-80 transition-opacity font-serif italic pr-4">
                            {file.content.substring(0, 80).replace(/[#*`[\]]/g, '') || "No initial data stream recorded."}
                        </p>
                    </NavLink>
                );
            })
        )}
      </div>
    </div>
  );
};

export default FileListPanel;
