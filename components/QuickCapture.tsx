import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icon';
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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[150] p-0 sm:p-4">
      <div 
        ref={modalRef}
        className="bg-zenith-bg border-0 sm:border border-zenith-orange w-full h-full sm:h-auto sm:max-w-2xl shadow-[0_0_50px_rgba(255,77,0,0.2)] animate-in zoom-in-95 fade-in duration-200 overflow-y-auto"
      >
        {/* Toast Notification */}
        {conversionStatus && (
            <div className="absolute top-4 right-4 z-[160] animate-in slide-in-from-top-2 duration-300">
                <div className="bg-zenith-surface border border-zenith-orange px-3 py-1.5 shadow-lg flex items-center gap-2">
                    <div className="bg-zenith-orange text-black p-0.5">
                        <Icons.Zap size={10} />
                    </div>
                    <span className="font-mono text-white font-bold text-[10px] tracking-widest uppercase">
                        {conversionStatus}
                    </span>
                </div>
            </div>
        )}

        <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between mb-6 border-b border-zenith-border pb-4">
                <div className="flex flex-col">
                    <span className="font-mono text-xs text-zenith-orange tracking-widest uppercase flex items-center gap-2">
                        <Icons.Zap size={12} className="animate-pulse" /> Mobile Inject
                    </span>
                    <span className="font-mono text-[9px] text-zenith-muted mt-1 uppercase">Fragment Uplink Protocol</span>
                </div>
                <button onClick={onClose} className="text-zenith-muted hover:text-white p-2 transition-colors">
                    <Icons.Close size={24} />
                </button>
            </div>

            <div className="space-y-6">
                <div className="relative">
                    <textarea 
                        ref={textAreaRef}
                        autoFocus
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="INPUT RAW DATA..."
                        className="w-full bg-black border border-zenith-border p-4 text-white font-mono text-base focus:border-zenith-orange focus:outline-none min-h-[40vh] sm:min-h-[200px] max-h-[60vh] overflow-y-auto resize-none leading-relaxed transition-colors"
                        style={{ height: 'auto' }}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1">
                        <label className="font-mono text-[9px] text-zenith-muted uppercase ml-1">Sector Destination</label>
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
                                        className="flex-1 bg-black border border-zenith-border p-3.5 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>SELECT SECTOR</option>
                                        {repos.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                                        <option value="NEW" className="text-zenith-orange font-bold font-mono">[+] INITIALIZE NEW</option>
                                    </select>
                                    <div className="absolute right-3 top-4 pointer-events-none text-zenith-muted">
                                        <Icons.ChevronDown size={14} />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newRepoName}
                                        onChange={e => setNewRepoName(e.target.value)}
                                        placeholder="NEW-SECTOR-ID"
                                        className="flex-1 bg-black border border-zenith-orange p-3.5 text-zenith-orange font-mono text-sm focus:outline-none placeholder:text-zenith-orange/30"
                                    />
                                    <button 
                                        onClick={() => setIsCreatingRepo(false)}
                                        className="px-4 border border-zenith-border text-zenith-muted hover:text-white transition-colors"
                                    >
                                        <Icons.Close size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-6 border-t border-zenith-border">
                    <div className="font-mono text-[9px] text-zenith-muted text-center sm:text-left opacity-60">
                        ZENITH CLOUD SYNC ACTIVE
                    </div>
                    <div className="flex w-full sm:w-auto gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3.5 border border-zenith-border text-zenith-muted font-mono text-xs uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || !content.trim()}
                            className={`flex-1 sm:flex-none bg-zenith-orange text-black px-10 py-3.5 text-xs font-bold font-mono tracking-widest uppercase hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,77,0,0.3)] ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {isSaving ? 'UPLOADING...' : (
                                <>
                                    <Icons.Upload size={14} /> TRANSMIT
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCapture;