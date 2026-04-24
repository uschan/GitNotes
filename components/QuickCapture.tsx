import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icon';
import clsx from 'clsx';
import { Repository } from '../types';
// @ts-ignore
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
  onQuickSave: (repoId: string, title: string, content: string) => Promise<void>;
  onCreateRepo: (name: string, description: string, isPrivate: boolean) => Promise<string | null>;
}

const QuickCapture: React.FC<QuickCaptureProps> = ({ isOpen, onClose, repos, onQuickSave, onCreateRepo }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-resize logic
  useEffect(() => {
    if (textAreaRef.current && isOpen) {
        textAreaRef.current.style.height = 'auto';
        textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 400)}px`;
    }
  }, [content, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);

    try {
      let targetRepoId = selectedRepoId;

      if (!targetRepoId && !isCreatingRepo) {
        if (repos.length > 0) {
          targetRepoId = repos[0].id;
        } else {
            const id = await onCreateRepo('general-notes', 'Default repository for quick notes', true);
            if (id) targetRepoId = id;
        }
      }

      if (isCreatingRepo && newRepoName.trim()) {
        const id = await onCreateRepo(newRepoName, 'Created via Quick Capture', true);
        if (id) targetRepoId = id;
      }

      let finalTitle = title.trim();
      if (!finalTitle) {
         const dateStr = new Date().toISOString().split('T')[0];
         const snippet = content.slice(0, 15).replace(/\n/g, ' ').trim();
         finalTitle = snippet ? `${snippet}... (${dateStr}).md` : `note-${dateStr}.md`;
      }
      if (!finalTitle.endsWith('.md')) finalTitle += '.md';

      if (targetRepoId) {
          await onQuickSave(targetRepoId, finalTitle, content);
          setContent('');
          setTitle('');
          setIsCreatingRepo(false);
          setNewRepoName('');
          onClose(); // Close modal on success
      }
    } catch (e) {
        console.error("Capture failed", e);
    } finally {
        setIsSaving(false);
    }
  };

  const insertTextAtCursor = (textToInsert: string) => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const currentText = textAreaRef.current.value;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      
      const newText = before + textToInsert + after;
      setContent(newText);
      
      setTimeout(() => {
          if (textAreaRef.current) {
              textAreaRef.current.focus();
              const newCursorPos = start + textToInsert.length;
              textAreaRef.current.selectionStart = newCursorPos;
              textAreaRef.current.selectionEnd = newCursorPos;
          }
      }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const types = clipboardData.types;

    if (types.includes('text/html')) {
        const html = clipboardData.getData('text/html');
        
        try {
            e.preventDefault(); 

            // Robust Constructor Resolution for Vite/Rollup compatibility
            let ServiceClass = TurndownService;
            // @ts-ignore
            if (typeof ServiceClass !== 'function' && ServiceClass.default) {
                // @ts-ignore
                ServiceClass = ServiceClass.default;
            }

            if (typeof ServiceClass !== 'function') {
                // Fallback if library fails to load, just let default paste happen or insert plain text
                throw new Error("TurndownService constructor not found");
            }

            // @ts-ignore
            const turndownService = new ServiceClass({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                bulletListMarker: '-',
                emDelimiter: '*',
                hr: '***' // Use asterisks for HR to avoid conflict with Frontmatter '---'
            });

            // Try to use GFM plugin
            try {
                if (typeof gfm === 'function') {
                    turndownService.use(gfm);
                }
            } catch (e) {
                console.warn("GFM plugin failed", e);
            }

            // Pure Text Mode: Remove images
            turndownService.remove('img');
            turndownService.remove('picture'); 

            // Custom rule for pre tags
            turndownService.addRule('pre', {
                filter: ['pre'],
                replacement: function (content: string, node: any) {
                     return '\n```\n' + node.textContent + '\n```\n';
                }
            });

            // Force HR rule to be asterisks
            turndownService.addRule('horizontalRule', {
                filter: 'hr',
                replacement: function () {
                    return '\n\n***\n\n';
                }
            });

            let markdown = turndownService.turndown(html);
            
            // --- DATA CLEANUP PIPELINE ---
            // 1. Unescape common markdown structures at start of line
            markdown = markdown.replace(/^\\(#+)/gm, '$1'); // \# -> #
            markdown = markdown.replace(/^\\>/gm, '>');     // \> -> >
            markdown = markdown.replace(/^\\([-*+])/gm, '$1'); // \- -> -
            
            // 2. Unescape specific patterns
            markdown = markdown.replace(/^(\\\*){3,}$/gm, '***'); // \*\*\* -> ***
            markdown = markdown.replace(/\\([\[\]])/g, '$1');     // \[Link\] -> [Link]
            
            // 3. Remove artifacts
            markdown = markdown.replace(/↩︎/g, ''); // Remove footnote returns

            // 4. Normalize Whitespace (Collapse 3+ newlines to 2)
            markdown = markdown.replace(/\n{3,}/g, '\n\n');

            setConversionStatus("SMART PASTE: CLEANED");
            setTimeout(() => setConversionStatus(null), 3000);

            insertTextAtCursor(markdown);

        } catch (err) {
            console.error("Paste Error:", err);
            const plainText = clipboardData.getData('text/plain');
            insertTextAtCursor(plainText);
            
            setConversionStatus("PASTE: PLAIN TEXT");
            setTimeout(() => setConversionStatus(null), 3000);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <div 
        ref={modalRef}
        className="bg-black/60 backdrop-blur-xl border border-zenith-orange/40 w-full max-w-2xl shadow-[0_0_50px_rgba(255,77,0,0.15)] animate-in zoom-in-95 fade-in duration-200 relative p-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zenith-muted hover:text-white transition-colors"
        >
          <Icons.X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8 px-6 py-4 border-b border-white/5">
          <Icons.Zap size={18} className="text-zenith-orange" />
          <h2 className="text-[10px] font-bold tracking-[0.4em] text-zenith-orange uppercase">Live Uplink</h2>
        </div>

        <div className="space-y-6 px-6 pb-6">
          <div className="relative">
            <textarea
              ref={textAreaRef}
              autoFocus
              className="w-full h-48 bg-[#0a0a0a] border border-white/10 focus:border-zenith-orange/50 p-6 text-sm font-mono text-white placeholder:text-zenith-muted outline-none transition-all resize-none leading-relaxed"
              placeholder="Enter raw data stream... (Auto-converts to clean Markdown, images removed)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#0a0a0a] border border-white/10 focus:border-zenith-orange/50 px-5 py-3 text-xs font-mono text-white placeholder:text-zenith-muted outline-none transition-all"
                placeholder="Filename (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="relative">
              {!isCreatingRepo ? (
                <>
                  <select
                    className="w-full bg-[#0a0a0a] border border-white/10 focus:border-zenith-orange/50 px-5 py-3 text-xs font-mono text-white outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                    value={selectedRepoId}
                    onChange={(e) => {
                       if(e.target.value === 'NEW') {
                           setIsCreatingRepo(true);
                       } else {
                           setSelectedRepoId(e.target.value);
                       }
                    }}
                  >
                    <option value="" className="bg-[#0a0a0a]">Select Target Module</option>
                    {repos.map(repo => (
                      <option key={repo.id} value={repo.id} className="bg-[#0a0a0a]">{repo.name.toUpperCase()}</option>
                    ))}
                    <option value="NEW" className="bg-[#0a0a0a] text-zenith-orange">[+] INITIALIZE NEW</option>
                  </select>
                  <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zenith-muted pointer-events-none" size={14} />
                </>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-black border border-zenith-orange px-5 py-3 text-xs font-mono text-zenith-orange placeholder:text-zenith-orange/30 outline-none"
                    placeholder="NEW-SECTOR-ID"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                  />
                  <button 
                    onClick={() => setIsCreatingRepo(false)}
                    className="px-3 border border-zenith-border text-zenith-muted hover:text-white transition-colors"
                  >
                    <Icons.Close size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim() || (!selectedRepoId && !isCreatingRepo)}
              className={clsx(
                "px-8 py-3 font-bold text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                content.trim() && (selectedRepoId || (isCreatingRepo && newRepoName.trim()))
                  ? "bg-zenith-orange text-black hover:scale-105 shadow-[0_0_20px_rgba(255,77,0,0.3)]" 
                  : "bg-zenith-surface text-zenith-muted opacity-50 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>UPLOADING...</>
              ) : (
                <>
                  <Icons.Upload size={14} />
                  Commit Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCapture;