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
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const hits: SearchResult[] = [];

    repos.forEach(repo => {
      repo.files.forEach(file => {
        if (file.name.toLowerCase().includes(lowerQuery) || file.content.toLowerCase().includes(lowerQuery)) {
          hits.push({
            id: file.id,
            name: file.name,
            repoId: repo.id,
            repoName: repo.name,
            pathStr: `${repo.name} / ${file.name}`
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-[160]" onClick={onClose}>
      <div 
        className="bg-zenith-bg border border-zenith-orange w-full max-w-xl shadow-[0_0_30px_rgba(255,77,0,0.15)] overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-zenith-border gap-3 bg-zenith-surface">
          <Icons.Link className="text-zenith-orange" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-zenith-muted"
            placeholder="Link to note..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="px-1.5 py-0.5 border border-zenith-border rounded text-[10px] text-zenith-muted font-mono">ESC</div>
        </div>

        <div className="overflow-y-auto bg-black">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, idx) => (
                <div
                  key={`${result.id}-${idx}`}
                  onClick={() => handleSelect(result)}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer font-mono text-sm group ${idx === selectedIndex ? 'bg-zenith-surface border-l-2 border-zenith-orange' : 'border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icons.File size={14} className="text-zenith-muted" />
                    <div>
                      <div className={`text-white ${idx === selectedIndex ? 'text-zenith-orange' : ''}`}>{result.name}</div>
                      <div className="text-[10px] text-zenith-muted">{result.pathStr}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-zenith-muted font-mono text-xs uppercase">No Matching Notes Found</div>
          ) : (
            <div className="p-8 text-center text-zenith-muted font-mono text-xs uppercase">Type to search knowledge base...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkSelectorModal;