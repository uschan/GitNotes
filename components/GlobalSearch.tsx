import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from './Icon';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
}

interface SearchResult {
  type: 'repo' | 'file';
  id: string;
  name: string;
  repoId: string; // needed for file navigation
  pathStr: string;
  matchType: 'title' | 'content';
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, repos }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

    // Search Repos
    repos.forEach(repo => {
      if (repo.name.toLowerCase().includes(lowerQuery)) {
        hits.push({
          type: 'repo',
          id: repo.id,
          name: repo.name,
          repoId: repo.id,
          pathStr: repo.name,
          matchType: 'title'
        });
      }

      // Search Files
      repo.files.forEach(file => {
        if (file.name.toLowerCase().includes(lowerQuery)) {
          hits.push({
            type: 'file',
            id: file.id,
            name: file.name,
            repoId: repo.id,
            pathStr: `${repo.name} / ${file.name}`,
            matchType: 'title'
          });
        } else if (file.content.toLowerCase().includes(lowerQuery)) {
             hits.push({
            type: 'file',
            id: file.id,
            name: file.name,
            repoId: repo.id,
            pathStr: `${repo.name} / ${file.name}`,
            matchType: 'content'
          });
        }
      });
    });

    setResults(hits.slice(0, 10)); // Limit to 10
    setSelectedIndex(0);
  }, [query, repos]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'repo') {
      navigate(`/${result.id}`);
    } else {
      navigate(`/${result.repoId}/${result.id}`);
    }
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-[150]" onClick={onClose}>
      <div 
        className="bg-zenith-bg border border-zenith-border w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-zenith-border gap-3">
          <Icons.Search className="text-zenith-orange" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-zenith-muted"
            placeholder="Search modules and files..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="px-1.5 py-0.5 border border-zenith-border rounded text-[10px] text-zenith-muted font-mono">ESC</div>
        </div>

        <div className="overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, idx) => (
                <div
                  key={`${result.id}-${idx}`}
                  onClick={() => handleSelect(result)}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer font-mono text-sm group ${idx === selectedIndex ? 'bg-zenith-surface border-l-2 border-zenith-orange' : 'border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    {result.type === 'repo' ? <Icons.GitBranch size={14} className="text-zenith-muted" /> : <Icons.File size={14} className="text-zenith-muted" />}
                    <div>
                      <div className={`text-white ${idx === selectedIndex ? 'text-zenith-orange' : ''}`}>{result.name}</div>
                      <div className="text-[10px] text-zenith-muted">{result.pathStr}</div>
                    </div>
                  </div>
                  {result.matchType === 'content' && <span className="text-[10px] text-zenith-muted uppercase border border-zenith-border px-1">Content</span>}
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-zenith-muted font-mono text-xs uppercase">No Results Found</div>
          ) : (
            <div className="p-8 text-center text-zenith-muted font-mono text-xs uppercase">Type to search knowledge base...</div>
          )}
        </div>
        
        {results.length > 0 && (
            <div className="bg-zenith-surface border-t border-zenith-border px-4 py-2 flex justify-between text-[10px] font-mono text-zenith-muted uppercase">
                <span>Navigate: Arrows</span>
                <span>Select: Enter</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;