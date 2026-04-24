import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from './Icon';
import { clsx } from 'clsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, repos }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchStr = query.toLowerCase();
    const matches: any[] = [];

    repos.forEach(repo => {
      // Search files
      repo.files.forEach(file => {
        if (file.name.toLowerCase().includes(searchStr)) {
          matches.push({
            type: 'file',
            id: file.id,
            name: file.name,
            repoId: repo.id,
            repoName: repo.name,
            path: `/${repo.id}/${file.id}`
          });
        }
      });
      
      // Search repos
      if (repo.name.toLowerCase().includes(searchStr)) {
          matches.push({
              type: 'repo',
              id: repo.id,
              name: repo.name,
              path: `/${repo.id}`
          });
      }
    });

    return matches.slice(0, 10);
  }, [query, repos]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
           navigate(results[selectedIndex].path);
           onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Search Box */}
      <div className="relative w-full max-w-2xl bg-zenith-surface border border-zenith-orange shadow-[0_0_50px_rgba(255,77,0,0.3)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-zenith-border gap-3">
          <Icons.Search className="text-zenith-orange" size={20} />
          <input 
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Type file name or sector ID..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-lg placeholder:text-zenith-muted"
            value={query}
            onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <div className="px-1.5 py-0.5 border border-zenith-border rounded text-[9px] font-mono text-zenith-muted">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((result, idx) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    navigate(result.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={clsx(
                    "flex items-center justify-between p-3 cursor-pointer transition-colors group",
                    idx === selectedIndex ? "bg-zenith-orange text-black" : "hover:bg-zenith-light/10 text-zenith-text"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {result.type === 'file' ? <Icons.File size={16} /> : <Icons.Layers size={16} />}
                    <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold truncate max-w-md">{result.name}</span>
                        {result.type === 'file' && (
                            <span className={clsx(
                                "text-[10px] font-mono tracking-tighter uppercase",
                                idx === selectedIndex ? "text-black/60" : "text-zenith-muted"
                            )}>
                                Sector: {result.repoName}
                            </span>
                        )}
                    </div>
                  </div>
                  <div className={clsx(
                    "px-2 py-0.5 border text-[9px] font-mono uppercase",
                    idx === selectedIndex ? "border-black/20 text-black/60" : "border-zenith-layer-edge text-zenith-muted"
                  )}>
                    {result.type}
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-10 text-center font-mono text-zenith-muted text-sm uppercase tracking-widest italic">
                No telemetry found for "{query}"
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-zenith-border bg-zenith-bg flex flex-col items-center gap-2 opacity-50">
                       <Icons.Command size={20} className="text-zenith-orange" />
                       <span className="font-mono text-[10px] text-white">Cmd+K Navigation</span>
                    </div>
                    <div className="p-4 border border-zenith-border bg-zenith-bg flex flex-col items-center gap-2 opacity-50">
                       <Icons.Zap size={20} className="text-zenith-orange" />
                       <span className="font-mono text-[10px] text-white">Alt+N Quick Inject</span>
                    </div>
                </div>
                <p className="font-mono text-[9px] text-zenith-muted uppercase tracking-[0.2em]">Zenith Neural Uplink Standby</p>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-zenith-border bg-zenith-surface flex items-center justify-between text-[9px] font-mono text-zenith-muted uppercase tracking-widest">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><Icons.ChevronDown size={10} /> Select</span>
                <span className="flex items-center gap-1"><span className="px-1 border border-zenith-border rounded-sm">↵</span> Open</span>
            </div>
            <div>Terminal Version 2.4.0</div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
