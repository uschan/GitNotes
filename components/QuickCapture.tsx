import React, { useState } from 'react';
import { Icons } from './Icon';
import { Repository } from '../types';

interface QuickCaptureProps {
  repos: Repository[];
  onQuickSave: (repoId: string, title: string, content: string) => Promise<void>;
  onCreateRepo: (name: string) => Promise<string | null>;
}

const QuickCapture: React.FC<QuickCaptureProps> = ({ repos, onQuickSave, onCreateRepo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);

    try {
      let targetRepoId = selectedRepoId;

      // Logic: If no repo selected, default to the first one, or create a 'General' one
      if (!targetRepoId && !isCreatingRepo) {
        if (repos.length > 0) {
          targetRepoId = repos[0].id;
        } else {
            // Auto create general if absolutely no repos exist
            const id = await onCreateRepo('general-notes');
            if (id) targetRepoId = id;
        }
      }

      // Logic: If user opted to create new repo
      if (isCreatingRepo && newRepoName.trim()) {
        const id = await onCreateRepo(newRepoName);
        if (id) targetRepoId = id;
      }

      // Generate Title if empty
      let finalTitle = title.trim();
      if (!finalTitle) {
         const dateStr = new Date().toISOString().split('T')[0];
         const snippet = content.slice(0, 15).replace(/\n/g, ' ').trim();
         finalTitle = snippet ? `${snippet}... (${dateStr}).md` : `note-${dateStr}.md`;
      }
      if (!finalTitle.endsWith('.md')) finalTitle += '.md';

      if (targetRepoId) {
          await onQuickSave(targetRepoId, finalTitle, content);
          // Reset
          setContent('');
          setTitle('');
          setIsExpanded(false);
          setIsCreatingRepo(false);
          setNewRepoName('');
      }
    } catch (e) {
        console.error("Capture failed", e);
        alert("Transmission failed. Check network.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className={`mb-12 border transition-all duration-300 ${isExpanded ? 'bg-zenith-surface border-zenith-orange shadow-[0_0_20px_rgba(255,77,0,0.15)]' : 'bg-black border-zenith-border hover:border-zenith-light'}`}>
      
      {/* Collapsed View (Input Trigger) */}
      {!isExpanded && (
        <div 
            onClick={() => setIsExpanded(true)}
            className="p-4 flex items-center gap-4 cursor-text"
        >
            <div className="text-zenith-orange animate-pulse">
                <Icons.Edit size={18} />
            </div>
            <span className="font-mono text-zenith-muted text-sm tracking-wide">
                INITIATE QUICK CAPTURE PROTOCOL...
            </span>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-zenith-border pb-2">
                <span className="font-mono text-xs text-zenith-orange tracking-widest uppercase flex items-center gap-2">
                    <Icons.Zap size={12} /> Live Uplink
                </span>
                <button onClick={() => setIsExpanded(false)} className="text-zenith-muted hover:text-white">
                    <Icons.Close size={16} />
                </button>
            </div>

            <div className="space-y-4">
                <textarea 
                    autoFocus
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter raw data stream..."
                    className="w-full bg-black border border-zenith-border p-4 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none min-h-[120px] resize-y"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Filename (Optional)"
                        className="bg-black border border-zenith-border p-2 text-white font-mono text-xs focus:border-zenith-orange focus:outline-none"
                    />

                    <div className="relative">
                        {!isCreatingRepo ? (
                            <div className="flex gap-2">
                                <select 
                                    value={selectedRepoId}
                                    onChange={e => {
                                        if(e.target.value === 'NEW') {
                                            setIsCreatingRepo(true);
                                        } else {
                                            setSelectedRepoId(e.target.value);
                                        }
                                    }}
                                    className="flex-1 bg-black border border-zenith-border p-2 text-white font-mono text-xs focus:border-zenith-orange focus:outline-none appearance-none"
                                >
                                    <option value="" disabled>Select Target Module</option>
                                    {repos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    <option value="NEW" className="text-zenith-orange">[+ CREATE NEW MODULE]</option>
                                </select>
                                <div className="absolute right-2 top-2.5 pointer-events-none text-zenith-muted">
                                    <Icons.ChevronRight size={12} className="rotate-90" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newRepoName}
                                    onChange={e => setNewRepoName(e.target.value)}
                                    placeholder="New Module Name"
                                    className="flex-1 bg-black border border-zenith-orange p-2 text-zenith-orange font-mono text-xs focus:outline-none placeholder:text-zenith-orange/50"
                                />
                                <button 
                                    onClick={() => setIsCreatingRepo(false)}
                                    className="p-2 border border-zenith-border text-zenith-muted hover:text-white"
                                >
                                    <Icons.Close size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !content.trim()}
                        className={`bg-zenith-orange text-black px-6 py-2 text-xs font-bold font-mono tracking-widest uppercase hover:bg-white transition-colors flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isSaving ? 'Transmitting...' : (
                            <>
                                <Icons.Upload size={14} /> Commit Data
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuickCapture;