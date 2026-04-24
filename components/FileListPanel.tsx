import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from './Icon';
import { clsx } from 'clsx';

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
    <div className="hidden lg:flex w-80 bg-zenith-bg border-r border-zenith-border flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-zenith-border">
        <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm tracking-tight text-white uppercase truncate">{repo.name}</h2>
            <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowAdd(!showAdd)}
                  className="p-1.5 text-zenith-muted hover:text-white transition-colors"
                >
                    <Icons.Plus size={16} />
                </button>
            </div>
        </div>
        
        <div className="relative group">
            <Icons.Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zenith-muted group-focus-within:text-zenith-orange" />
            <input 
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zenith-surface border border-zenith-border rounded px-8 py-1.5 text-[11px] font-mono focus:border-zenith-orange outline-none transition-colors"
            />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
        {showAdd && (
            <div className="px-3 mb-2 animate-in slide-in-from-top-2">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input 
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="filename.md"
                        className="flex-1 bg-black border border-zenith-orange px-2 py-1 text-[11px] font-mono text-white outline-none"
                    />
                </form>
            </div>
        )}

        {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-[10px] text-zenith-muted font-mono uppercase">
                No entries found
            </div>
        ) : (
            filteredFiles.map(file => (
                <NavLink
                    key={file.id}
                    to={`/${repo.id}/${file.id}`}
                    className={({ isActive }) => clsx(
                        "block px-4 py-3 border-b border-zenith-border/50 hover:bg-zenith-surface transition-colors",
                        isActive ? "bg-zenith-surface border-l-2 border-l-zenith-orange" : ""
                    )}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className={clsx(
                            "font-bold text-[13px] tracking-tight truncate flex-1",
                            activeFileId === file.id ? "text-zenith-orange" : "text-white"
                        )}>
                            {file.name.replace('.md', '')}
                        </span>
                        <span className="text-[9px] text-zenith-muted font-mono shrink-0 ml-2">
                            {new Date(file.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <p className="text-[11px] text-zenith-muted line-clamp-1 font-mono opacity-60">
                        {file.content.substring(0, 100).replace(/[#*`[\]]/g, '') || "No content data available."}
                    </p>
                </NavLink>
            ))
        )}
      </div>
    </div>
  );
};

export default FileListPanel;
