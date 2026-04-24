import React, { useState, useEffect, useRef } from 'react';
import { Repository } from '../types';
import { Icons } from './Icon';

interface LinkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
  onSelect: (repoId: string, fileId: string, fileName: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  repoId: string;
  repoName: string;
  pathStr: string;
}

const LinkSelectorModal: React.FC<LinkSelectorModalProps> = ({ isOpen, onClose, repos, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    // If query is empty, show recent or all files up to 10
    const hits: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    repos.forEach(repo => {
      repo.files.forEach(file => {
        if (!query.trim() || file.name.toLowerCase().includes(lowerQuery) || file.content.toLowerCase().includes(lowerQuery)) {
          hits.push({
            id: file.id,
            name: file.name,
            repoId: repo.id,
            repoName: repo.name,
            pathStr: repo.name
          });
        }
      });
    });

    setResults(hits.slice(0, 10));
    setSelectedIndex(0);
  }, [query, repos]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result.repoId, result.id, result.name);
    onClose();
  };

  const getTypeInfo = (name: string, repo: string) => {
    const n = name.toLowerCase();
    const r = repo.toLowerCase();
    
    if (n.includes('annie') || r.includes('people') || r.includes('community')) {
      return { icon: Icons.User, label: 'Person', color: 'text-blue-400' };
    }
    if (n.includes('essay') || r.includes('essays') || r.includes('writing')) {
      return { icon: Icons.Book, label: 'Essay', color: 'text-zenith-orange' };
    }
    if (n.includes('reading') || r.includes('reading') || r.includes('library')) {
      return { icon: Icons.BookOpen, label: 'Reading', color: 'text-green-400' };
    }
    return { icon: Icons.FileText, label: 'Note', color: 'text-zenith-muted' };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-start justify-center pt-[15vh] z-[160]" onClick={onClose}>
      <div 
        className="bg-zenith-bg border border-zenith-border w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-zenith-border gap-3 bg-[#0d0d0d]">
          <Icons.Search className="text-zenith-muted" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white font-sans text-sm outline-none placeholder:text-zenith-muted"
            placeholder="Search notes to link..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1">
             <div className="px-1.5 py-0.5 bg-zenith-surface border border-zenith-border rounded text-[9px] text-zenith-muted font-mono">ESC</div>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar bg-zenith-bg py-1">
          {results.length > 0 ? (
            <div>
              {results.map((result, idx) => {
                const typeInfo = getTypeInfo(result.name, result.repoId);
                const RepoIcon = typeInfo.icon;
                
                return (
                  <div
                    key={`${result.id}-${idx}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelect(result)}
                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer group transition-colors ${idx === selectedIndex ? 'bg-zenith-surface' : 'hover:bg-[#0d0d0d]'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-1.5 rounded bg-black/40 ${idx === selectedIndex ? 'text-white' : typeInfo.color}`}>
                        <RepoIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[13px] font-medium truncate ${idx === selectedIndex ? 'text-zenith-orange' : 'text-white'}`}>
                          {result.name.replace('.md', '')}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-zenith-muted uppercase tracking-wider font-mono">{result.pathStr}</span>
                           <span className="text-[10px] text-zenith-border">•</span>
                           <span className={`text-[10px] font-medium uppercase tracking-tight ${typeInfo.color}`}>{typeInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    {idx === selectedIndex && (
                        <div className="text-zenith-orange animate-in fade-in slide-in-from-right-1 duration-200">
                             <Icons.ArrowRight size={14} />
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
                <div className="w-10 h-10 bg-zenith-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-zenith-border">
                    <Icons.FileX size={20} className="text-zenith-muted" />
                </div>
                <div className="text-zenith-muted font-sans text-xs">No matching notes found in your knowledge base.</div>
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-zenith-border bg-[#0a0a0a] flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-zenith-muted">
                    <span className="px-1 py-0.5 border border-zenith-border bg-zenith-surface rounded text-[9px]">↑↓</span>
                    <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zenith-muted">
                    <span className="px-1 py-0.5 border border-zenith-border bg-zenith-surface rounded text-[9px]">Enter</span>
                    <span>Link</span>
                </div>
            </div>
            <div className="text-[10px] text-zenith-muted italic opacity-50">
                Knowledge Link Mode
            </div>
        </div>
      </div>
    </div>
  );
};

export default LinkSelectorModal;