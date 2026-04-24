import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview, { generateSlug } from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EditorToolbar from '../components/EditorToolbar';
import LinkSelectorModal from '../components/LinkSelectorModal';
import { convertHtmlToMarkdown } from '../utils/markdownPaste';
import PropertiesPanel from '../components/Editor/PropertiesPanel';
import TableOfContents, { TocItem } from '../components/Editor/TableOfContents';
import clsx from 'clsx';

interface FileEditorProps {
  repos: Repository[];
  onUpdateFile: (repoId: string, fileId: string, newContent: string) => void;
  onRenameFile: (repoId: string, fileId: string, newName: string) => void;
  onDeleteFile: (repoId: string, fileId: string) => void;
  isAuthenticated: boolean;
}

type ViewMode = 'write' | 'preview' | 'split';

const FileEditor: React.FC<FileEditorProps> = ({ repos, onUpdateFile, onRenameFile, onDeleteFile, isAuthenticated }) => {
  const { repoId, fileId } = useParams<{ repoId: string; fileId: string }>();
  const navigate = useNavigate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const repo = repos.find(r => r.id === repoId);
  const file = repo?.files.find(f => f.id === fileId);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const [isMetaOpen, setIsMetaOpen] = useState(window.innerWidth >= 1024);

  // Renaming State
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setRenameValue(file.name);
    }
  }, [file]);

  // Adjust viewMode for mobile automatically
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024 && viewMode === 'split') {
            setViewMode('write');
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // --- Auto-save Logic ---
  useEffect(() => {
    if (!hasChanges || !isAuthenticated) return;
    
    setIsAutoSaving(true);
    const timer = setTimeout(() => {
      onUpdateFile(repoId!, fileId!, content);
      setHasChanges(false);
      setIsAutoSaving(false);
      
      // Feedback
      setConversionStatus("RECORDS SYNCED");
      setTimeout(() => setConversionStatus(null), 2000);
    }, 4000);

    return () => {
      clearTimeout(timer);
      setIsAutoSaving(false);
    };
  }, [content, hasChanges, isAuthenticated, repoId, fileId, onUpdateFile]);

  // --- Backlinks Logic ---
  const backlinks = useMemo(() => {
    if (!repoId || !fileId) return [];
    const targetLink = `/${repoId}/${fileId}`;
    const links: any[] = [];

    repos.forEach(r => {
        r.files.forEach(f => {
            if (f.id === fileId) return;
            if (f.content.includes(targetLink)) {
                const lines = f.content.split('\n');
                const matchLine = lines.find(l => l.includes(targetLink)) || "Link found in document";
                const cleanContext = matchLine.replace(/\[(.*?)\]\(.*?\)/g, '$1').trim();

                links.push({
                    fileId: f.id,
                    fileName: f.name,
                    repoId: r.id,
                    repoName: r.name,
                    context: cleanContext.length > 60 ? cleanContext.substring(0, 60) + "..." : cleanContext
                });
            }
        })
    });
    return links;
  }, [repos, repoId, fileId]);

  // --- Table of Contents Logic ---
  const toc: TocItem[] = useMemo(() => {
    if (!content) return [];
    const items: TocItem[] = [];
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

  // --- Outgoing Links Logic ---
  const outgoingLinks = useMemo(() => {
    if (!content) return [];
    const links: any[] = [];
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    const markdownLinkRegex = /\[(.*?)\]\(\/(.*?)\/(.*?)\)/g;

    let match;
    // Wikilinks
    while ((match = wikiLinkRegex.exec(content)) !== null) {
        const targetName = match[1];
        // Find file with this name (approximate)
        repos.forEach(r => {
            r.files.forEach(f => {
                if (f.name.replace('.md', '').toLowerCase() === targetName.toLowerCase()) {
                    links.push({
                        fileId: f.id,
                        fileName: f.name,
                        repoId: r.id,
                        repoName: r.name,
                        type: 'internal'
                    });
                }
            });
        });
    }
    // Markdown links to internal files
    while ((match = markdownLinkRegex.exec(content)) !== null) {
        const repoId = match[2];
        const fileId = match[3];
        const r = repos.find(rp => rp.id === repoId);
        const f = r?.files.find(fl => fl.id === fileId);
        if (f) {
            links.push({
                fileId: f.id,
                fileName: f.name,
                repoId: r!.id,
                repoName: r!.name,
                type: 'direct'
            });
        }
    }

    // Deduplicate
    return links.filter((link, index, self) =>
        index === self.findIndex((t) => t.fileId === link.fileId)
    );
  }, [content, repos]);

  if (!repo || !file) {
    return <div className="h-screen flex items-center justify-center font-mono text-zenith-orange uppercase tracking-widest">Error: Access Denied or Missing Record</div>;
  }

  const handleSave = () => {
    if (!isAuthenticated) return;
    onUpdateFile(repoId!, fileId!, content);
    setHasChanges(false);
  };

  const handleRenameSubmit = () => {
    if (!isAuthenticated) return;
    if (renameValue.trim() && renameValue.trim() !== file.name) {
        let name = renameValue.trim();
        if (!name.endsWith('.md')) name += '.md';
        onRenameFile(repoId!, fileId!, name);
        setConversionStatus("REFACTORING LINKS...");
        setTimeout(() => setConversionStatus(null), 2000);
    }
    setIsRenaming(false);
  };

  const handleContentChange = (val: string) => {
      setContent(val);
      setHasChanges(val !== file.content);
      if (val.endsWith('[[')) setIsLinkSelectorOpen(true);
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
    const newText = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
    
    setContent(newText);
    setHasChanges(true);
    
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
      const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
      
      setContent(newText);
      setHasChanges(true);
      
      setTimeout(() => {
          if (textAreaRef.current) {
              textAreaRef.current.focus();
              const newCursorPos = start + textToInsert.length;
              textAreaRef.current.selectionStart = newCursorPos;
              textAreaRef.current.selectionEnd = newCursorPos;
          }
      }, 0);
  };

  const handleLinkSelect = (targetRepoId: string, targetFileId: string, targetName: string) => {
      if (textAreaRef.current) {
         const val = textAreaRef.current.value;
         const end = textAreaRef.current.selectionEnd;
         if (val.substring(end - 2, end) === '[[') {
             const before = val.substring(0, end - 2);
             const after = val.substring(end);
             const linkMd = `[[${targetName.replace('.md', '')}]]`;
             const newText = before + linkMd + after;
             setContent(newText);
             setHasChanges(true);
             setTimeout(() => {
                 if(textAreaRef.current) {
                     textAreaRef.current.focus();
                     textAreaRef.current.selectionStart = before.length + linkMd.length;
                     textAreaRef.current.selectionEnd = before.length + linkMd.length;
                 }
             }, 0);
             return;
         }
      }
      const linkMd = `[[${targetName.replace('.md', '')}]]`;
      insertTextAtCursor(linkMd);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isAuthenticated) return;
    const clipboardData = e.clipboardData;
    if (clipboardData.types.includes('text/html')) {
        e.preventDefault();
        try {
            const html = clipboardData.getData('text/html');
            const markdown = convertHtmlToMarkdown(html);
            insertTextAtCursor(markdown);
            setConversionStatus("SMART PASTE: CLEANED");
            setTimeout(() => setConversionStatus(null), 3000);
        } catch (err) {
            const plainText = clipboardData.getData('text/plain');
            insertTextAtCursor(plainText);
            setConversionStatus("PASTE FALLBACK: PLAIN TEXT");
            setTimeout(() => setConversionStatus(null), 3000);
        }
    }
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] lg:h-[calc(100vh-56px)] bg-zenith-bg relative overflow-hidden">
      
      {/* Toast Notification */}
      {conversionStatus && (
          <div className="fixed bottom-12 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
              <div className="bg-zenith-surface border border-zenith-orange px-4 py-3 shadow-[0_0_15px_rgba(255,77,0,0.2)] flex items-center gap-3">
                  <div className="bg-zenith-orange text-black p-1">
                      <Icons.Zap size={14} />
                  </div>
                  <span className="font-mono text-white font-bold text-xs tracking-widest uppercase">{conversionStatus}</span>
              </div>
          </div>
      )}

      {/* File Toolbar / Breadcrumb Header */}
      <div className="h-14 border-b border-zenith-border bg-zenith-bg/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          {/* Left: Breadcrumbs & Stats */}
          <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 text-zenith-muted text-[13px] font-medium shrink-0">
                  <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate(`/${repoId}`)}>{repo.name}</span>
                  <Icons.ChevronRight size={14} className="opacity-40" />
              </div>
              
              <div className="flex items-center gap-2 min-w-0">
                  {isRenaming && isAuthenticated ? (
                      <input 
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                        className="bg-black border border-zenith-orange text-white font-bold text-base px-2 py-0.5 outline-none w-48"
                      />
                  ) : (
                      <div className="flex items-center gap-2 group cursor-pointer min-w-0" onClick={() => isAuthenticated && setIsRenaming(true)}>
                        <h1 className="text-white font-bold text-base truncate group-hover:text-zenith-orange transition-colors">
                            {file.name.replace('.md', '')}
                        </h1>
                      </div>
                  )}
              </div>

              <div className="h-4 w-px bg-zenith-border mx-1 hidden sm:block"></div>
              
              <div className="hidden md:flex items-center gap-3 text-[11px] text-zenith-muted font-mono opacity-60 italic shrink-0">
                  <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
              </div>
          </div>

          {/* Right: Actions Cluster */}
          <div className="flex items-center gap-1 sm:gap-2">
              {/* Sync Status */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-zenith-border rounded-md mr-2">
                  {isAutoSaving ? (
                      <Icons.RefreshCw size={14} className="text-zenith-orange animate-spin" />
                  ) : (
                      <Icons.Check size={14} className="text-zenith-green" />
                  )}
                  <span className="text-[10px] font-bold font-mono text-zenith-muted uppercase tracking-widest leading-none">
                      {isAutoSaving ? 'Saving' : 'Synced'}
                  </span>
              </div>

          {/* Action Icons */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                  <button 
                    onClick={() => {
                        if (viewMode === 'split') setViewMode('write');
                        else if (viewMode === 'write') setViewMode('preview');
                        else setViewMode('split');
                    }} 
                    className={clsx(
                        "p-2 transition-all rounded-md flex items-center gap-2",
                        "text-zenith-muted hover:text-white hover:bg-white/5"
                    )}
                    title={`View Mode: ${viewMode.toUpperCase()} (Click to cycle)`}
                  >
                      {viewMode === 'split' && <Icons.Columns size={18} className="text-zenith-orange" />}
                      {viewMode === 'write' && <Icons.Edit size={18} className="text-zenith-orange" />}
                      {viewMode === 'preview' && <Icons.Eye size={18} className="text-zenith-orange" />}
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest hidden lg:inline opacity-60">
                        {viewMode === 'split' ? 'Split' : viewMode === 'write' ? 'Write' : 'View'}
                      </span>
                  </button>
                  <button 
                    onClick={() => setIsMetaOpen(!isMetaOpen)} 
                    className={clsx("p-2 transition-colors rounded-md", isMetaOpen ? 'text-zenith-orange bg-zenith-orange/10' : 'text-zenith-muted hover:text-white hover:bg-white/5')}
                    title="Properties Panel"
                  >
                      <Icons.MoreVertical size={18} />
                  </button>
                  <div className="w-px h-6 bg-zenith-border mx-1"></div>
                  <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-zenith-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all" title="Delete File">
                      <Icons.Trash size={18} />
                  </button>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row z-0">
         {(viewMode === 'write' || viewMode === 'split') && (
           <div className={clsx(
               "flex flex-col border-r border-zenith-border h-full min-w-0 flex-1",
               viewMode === 'split' && 'max-lg:hidden'
           )}>
             {isAuthenticated && <EditorToolbar onInsert={handleInsert} onLinkNote={() => setIsLinkSelectorOpen(true)} />}
             <div className="flex-1 flex overflow-hidden">
                <div className="hidden md:block w-10 bg-zenith-surface border-r border-zenith-border text-right py-4 pr-2 font-mono text-xs text-zenith-border select-none overflow-hidden shrink-0">
                    {Array.from({length: Math.max(lineCount, 20)}).map((_, i) => <div key={i}>{i+1}</div>)}
                </div>
                <textarea
                    ref={textAreaRef}
                    readOnly={!isAuthenticated}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onPaste={handlePaste}
                    className={`w-full h-full bg-zenith-bg text-zenith-text font-mono text-base sm:text-sm p-6 sm:p-4 resize-none outline-none transition-colors leading-relaxed ${!isAuthenticated ? 'cursor-not-allowed text-zenith-muted' : 'focus:bg-[#050505]'}`}
                    spellCheck={false}
                    placeholder={!isAuthenticated ? "Editing is disabled in visitor mode." : "Start typing... Tip: Type '[[' to link another note."}
                />
             </div>
           </div>
         )}

         {(viewMode === 'preview' || viewMode === 'split') && (
           <div className={clsx(
               "flex flex-1 overflow-hidden bg-zenith-bg",
               viewMode === 'split' ? 'bg-[#080808]' : '',
               viewMode === 'split' && 'max-lg:w-full'
           )}>
               <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                   <div className={clsx("p-6 sm:p-8 mx-auto", viewMode === 'split' ? 'p-6' : 'max-w-4xl')}>
                       <MarkdownPreview content={content} />
                   </div>
                   <div className="h-32"></div>
               </div>
               {viewMode === 'preview' && !isMetaOpen && <div className="hidden lg:block"><TableOfContents items={toc} /></div>}
           </div>
         )}

         {isMetaOpen && (
             <>
                {/* Mobile Backdrop */}
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[55] lg:hidden animate-in fade-in duration-300" 
                    onClick={() => setIsMetaOpen(false)}
                />
                <PropertiesPanel 
                    file={file}
                    repoId={repoId!}
                    repoName={repo.name}
                    backlinks={backlinks}
                    outgoingLinks={outgoingLinks}
                    onClose={() => setIsMetaOpen(false)}
                />
             </>
         )}
      </div>
      
      <div className="h-8 border-t border-zenith-border bg-[#0a0a0a] flex items-center justify-between px-4 font-mono text-[9px] text-zenith-muted uppercase tracking-[0.2em] shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="opacity-40">POS</span>
                <span className="text-white font-bold">{lineCount} : {content.length}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="opacity-40">WORD</span>
                <span className="text-white font-bold">{content.trim() ? content.trim().split(/\s+/).length : 0}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
                <span className="opacity-40">ROOT</span>
                <span className="text-zenith-orange font-bold uppercase tracking-widest">{repo.name}</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-zenith-green shadow-[0_0_5px_#4ade80]' : 'bg-zenith-muted'}`}></div>
                <span>{isAuthenticated ? 'Live Environment' : 'Safe View'}</span>
            </div>
            <div className="hidden md:block opacity-30 select-none">UTF-8 / MD</div>
         </div>
      </div>

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        itemName={file.name}
      />
      
      <LinkSelectorModal
        isOpen={isLinkSelectorOpen}
        onClose={() => setIsLinkSelectorOpen(false)}
        repos={repos}
        onSelect={handleLinkSelect}
      />
    </div>
  );
};

export default FileEditor;
