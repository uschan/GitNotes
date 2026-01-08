import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview, { generateSlug } from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EditorToolbar from '../components/EditorToolbar';
// Use default import for Turndown, but handle 'default' property at runtime if needed
// @ts-ignore
import TurndownService from 'turndown';
// Use named import for gfm plugin
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

interface FileEditorProps {
  repos: Repository[];
  onUpdateFile: (repoId: string, fileId: string, newContent: string) => void;
  onDeleteFile: (repoId: string, fileId: string) => void;
  isAuthenticated: boolean;
}

type ViewMode = 'write' | 'preview' | 'split';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const FileEditor: React.FC<FileEditorProps> = ({ repos, onUpdateFile, onDeleteFile, isAuthenticated }) => {
  const { repoId, fileId } = useParams<{ repoId: string; fileId: string }>();
  const navigate = useNavigate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const repo = repos.find(r => r.id === repoId);
  const file = repo?.files.find(f => f.id === fileId);

  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setContent(file.content);
    }
  }, [file]);

  // --- Table of Contents Logic ---
  const toc = useMemo(() => {
    if (!content) return [];
    
    // Regex to match # Heading, ## Heading etc.
    // Handles simple markdown headers
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    // We need to work on a version without code blocks to avoid false positives in code
    // This is a simplified parser; for perfect accuracy one would need AST, but regex is usually fast/enough for basic usage
    // To respect code blocks, we simple strip lines starting with ``` for the search context, but keeping it simple for now:
    
    const lines = content.split('\n');
    let inCodeBlock = false;

    lines.forEach(line => {
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            return;
        }
        if (inCodeBlock) return;

        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            // Remove markdown links or bold from TOC text if present
            const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/(\*\*|__)(.*?)\1/g, '$2');
            
            items.push({
                id: generateSlug(cleanText),
                text: cleanText,
                level
            });
        }
    });

    return items;
  }, [content]);

  if (!repo || !file) {
    return <div className="h-screen flex items-center justify-center font-mono text-zenith-orange">ERROR: FILE DATA CORRUPTED OR MISSING</div>;
  }

  const handleSave = () => {
    if (!isAuthenticated) return;
    onUpdateFile(repoId!, fileId!, content);
    setHasChanges(false);
  };

  const handleContentChange = (val: string) => {
      setContent(val);
      setHasChanges(val !== file.content);
  }

  const handleDeleteConfirm = () => {
      if (!isAuthenticated) return;
      onDeleteFile(repoId!, fileId!);
      navigate(`/${repoId}`);
  }

  const handleInsert = (prefix: string, suffix: string = '') => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = textAreaRef.current.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    handleContentChange(newText);
    
    // Defer focus to allow React render
    setTimeout(() => {
      if(textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.selectionStart = start + prefix.length;
        textAreaRef.current.selectionEnd = end + prefix.length;
      }
    }, 0);
  };

  const insertTextAtCursor = (textToInsert: string) => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const currentText = textAreaRef.current.value;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      
      const newText = before + textToInsert + after;
      handleContentChange(newText);
      
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
    if (!isAuthenticated) return;

    const clipboardData = e.clipboardData;
    const types = clipboardData.types;
    
    // Check for HTML content
    if (types.includes('text/html')) {
        const html = clipboardData.getData('text/html');
        
        try {
            e.preventDefault(); 

            // 1. Robust Constructor Resolution
            let ServiceClass = TurndownService;
            // @ts-ignore
            if (typeof ServiceClass !== 'function' && ServiceClass.default) {
                // @ts-ignore
                ServiceClass = ServiceClass.default;
            }

            if (typeof ServiceClass !== 'function') {
                throw new Error("Could not find TurndownService constructor.");
            }

            // 2. Initialize Service
            // @ts-ignore
            const turndownService = new ServiceClass({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                bulletListMarker: '-',
                emDelimiter: '*'
            });

            // 3. Robust Plugin Loading (Fail-safe)
            try {
                if (typeof gfm === 'function') {
                    turndownService.use(gfm);
                } else {
                    console.warn("GitNotes Warning: GFM plugin not available, skipping tables support.");
                }
            } catch (pluginErr) {
                console.warn("GitNotes Warning: Error applying GFM plugin, continuing with basic markdown.", pluginErr);
            }

            // Pure Text Mode: Remove images
            turndownService.remove('img');
            turndownService.remove('picture');

            // 4. Custom Rules
            turndownService.addRule('pre', {
                filter: ['pre'],
                replacement: function (content: string, node: any) {
                     return '\n```\n' + node.textContent + '\n```\n';
                }
            });

            // 5. Execute Conversion
            const markdown = turndownService.turndown(html);
            
            // Visual Feedback
            setConversionStatus("SMART PASTE: TEXT ONLY");
            setTimeout(() => setConversionStatus(null), 3000);

            insertTextAtCursor(markdown);

        } catch (err) {
            console.error("GitNotes Paste Error:", err);
            
            // Fallback: manually insert the plain text since we prevented default
            const plainText = clipboardData.getData('text/plain');
            insertTextAtCursor(plainText);
            
            setConversionStatus("PASTE FALLBACK: PLAIN TEXT");
            setTimeout(() => setConversionStatus(null), 3000);
        }
        return;
    }
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-zenith-bg relative">
      
      {/* Toast Notification (Fixed Position) */}
      {conversionStatus && (
          <div className="fixed bottom-12 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
              <div className="bg-zenith-surface border border-zenith-orange px-4 py-3 shadow-[0_0_15px_rgba(255,77,0,0.2)] flex items-center gap-3">
                  <div className="bg-zenith-orange text-black p-1">
                      <Icons.Zap size={14} />
                  </div>
                  <span className="font-mono text-white font-bold text-xs tracking-widest uppercase">
                      {conversionStatus}
                  </span>
              </div>
          </div>
      )}

      {/* File Toolbar */}
      <div className="h-14 border-b border-zenith-border bg-zenith-bg flex items-center justify-between px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
              <Link to={`/${repoId}`} className="text-zenith-muted hover:text-white transition-colors">
                  <Icons.ChevronRight className="rotate-180" size={18} />
              </Link>
              <div className="h-6 w-px bg-zenith-border"></div>
              <span className="font-mono text-sm text-white font-bold tracking-wide">{file.name}</span>
              {hasChanges && <span className="text-[10px] bg-zenith-orange text-black px-2 py-0.5 font-bold font-mono">UNSAVED</span>}
              {!isAuthenticated && <span className="text-[10px] border border-zenith-border text-zenith-muted px-2 py-0.5 font-mono uppercase">Read Only</span>}
          </div>

          <div className="flex items-center gap-3">
             {/* Mode Switcher */}
             <div className="flex border border-zenith-border p-0.5 bg-zenith-surface">
                 <button 
                    onClick={() => setViewMode('write')}
                    className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2 ${viewMode === 'write' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                    title="Write Mode"
                 >
                    <Icons.Edit size={12} /> <span className="hidden sm:inline">Write</span>
                 </button>
                 <button 
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2 border-l border-r border-zenith-border ${viewMode === 'split' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                    title="Split View"
                 >
                    <Icons.Layout size={12} /> <span className="hidden sm:inline">Split</span>
                 </button>
                 <button 
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                    title="Preview Mode"
                 >
                    <Icons.File size={12} /> <span className="hidden sm:inline">Render</span>
                 </button>
             </div>

             {isAuthenticated && (
                <>
                 <button 
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`flex items-center gap-2 px-4 py-2 border text-xs font-mono tracking-widest uppercase transition-colors ${hasChanges ? 'border-zenith-orange text-zenith-orange hover:bg-zenith-orange hover:text-black' : 'border-zenith-border text-zenith-muted cursor-not-allowed'}`}
                 >
                    <Icons.Save size={14} /> Save
                 </button>
                 
                 <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-zenith-muted hover:text-red-600 transition-colors">
                     <Icons.Trash size={16} />
                 </button>
                </>
             )}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex z-0">
         
         {/* Write Panel */}
         {(viewMode === 'write' || viewMode === 'split') && (
           <div className={`flex flex-col border-r border-zenith-border ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
             {isAuthenticated && <EditorToolbar onInsert={handleInsert} />}
             <div className="flex flex-1 overflow-hidden">
                {/* Line Numbers */}
                <div className="hidden sm:block w-10 bg-zenith-surface border-r border-zenith-border text-right py-4 pr-2 font-mono text-xs text-zenith-border select-none overflow-hidden shrink-0">
                    {Array.from({length: Math.max(lineCount, 20)}).map((_, i) => <div key={i}>{i+1}</div>)}
                </div>
                
                <textarea
                    ref={textAreaRef}
                    readOnly={!isAuthenticated}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onPaste={handlePaste}
                    className={`w-full h-full bg-zenith-bg text-zenith-text font-mono text-sm p-4 resize-none outline-none transition-colors leading-relaxed ${!isAuthenticated ? 'cursor-not-allowed text-zenith-muted' : 'focus:bg-[#050505]'}`}
                    spellCheck={false}
                    placeholder={!isAuthenticated ? "Editing is disabled in visitor mode." : "Start typing... (Rich text pasted here will be auto-converted to Markdown)"}
                />
             </div>
           </div>
         )}

         {/* Preview Panel Wrapper (Now Flex for Sidebar) */}
         {(viewMode === 'preview' || viewMode === 'split') && (
           <div className={`flex flex-1 overflow-hidden bg-zenith-bg ${viewMode === 'split' ? 'bg-[#080808]' : ''}`}>
               
               {/* Actual Preview Content */}
               <div className="flex-1 overflow-y-auto overflow-x-hidden">
                   <div className={`p-8 mx-auto ${viewMode === 'split' ? 'max-w-none' : 'max-w-4xl'}`}>
                       <MarkdownPreview content={content} />
                   </div>
                   {/* Bottom Spacer for comfortable reading */}
                   <div className="h-32"></div>
               </div>

                {/* Outline Sidebar (Visible in Preview Mode mainly, or Split if room permits) */}
                {viewMode === 'preview' && toc.length > 0 && (
                    <div className="hidden xl:flex w-72 flex-col border-l border-zenith-border bg-zenith-bg/50 backdrop-blur-sm">
                        <div className="p-4 border-b border-zenith-border font-mono text-[10px] tracking-widest text-zenith-muted uppercase flex items-center gap-2">
                            <Icons.List size={12} />
                            <span>Document Outline</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {toc.map((item, idx) => (
                                <a 
                                    key={`${item.id}-${idx}`}
                                    href={`#${item.id}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`
                                        block text-xs font-mono py-1.5 transition-colors duration-200 border-l-2 border-transparent hover:border-zenith-orange pl-3
                                        ${item.level === 1 ? 'text-white font-bold' : 'text-zenith-muted hover:text-zenith-text'}
                                        ${item.level === 2 ? 'ml-2' : ''}
                                        ${item.level === 3 ? 'ml-4' : ''}
                                    `}
                                >
                                    {item.text}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
           </div>
         )}

      </div>
      
      {/* Footer Info */}
      <div className="h-8 border-t border-zenith-border bg-zenith-surface flex items-center justify-between px-4 font-mono text-[10px] text-zenith-muted uppercase tracking-widest shrink-0">
         <div>Ln {lineCount}, Col {content.length}</div>
         <div>{isAuthenticated ? 'Markdown Environment' : 'Visitor View'}</div>
      </div>

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        itemName={file.name}
      />
    </div>
  );
};

export default FileEditor;