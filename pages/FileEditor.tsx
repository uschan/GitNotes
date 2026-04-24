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
import { clsx } from 'clsx';

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

      {/* File Toolbar */}
      <div className="min-h-[3.5rem] border-b border-zenith-border bg-zenith-bg flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 shrink-0 relative z-10 gap-4 py-3 md:py-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full md:w-auto">
              {isRenaming && isAuthenticated ? (
                  <div className="flex items-center gap-2 w-full max-w-sm">
                      <input 
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                        className="bg-black border border-zenith-orange text-white font-mono text-sm font-bold tracking-wide px-2 py-1 outline-none w-full"
                      />
                  </div>
              ) : (
                  <div className="flex items-center gap-2 group cursor-pointer min-w-0" onClick={() => isAuthenticated && setIsRenaming(true)}>
                    <span className="font-mono text-sm text-white font-bold tracking-wide truncate group-hover:text-zenith-orange transition-colors" title={file.name}>
                        {file.name}
                    </span>
                    {isAuthenticated && <Icons.Edit size={12} className="text-zenith-border group-hover:text-zenith-orange opacity-0 group-hover:opacity-100 transition-all shrink-0"/>}
                  </div>
              )}

              {hasChanges && <span className="text-[9px] bg-zenith-orange text-black px-1.5 py-0.5 font-bold font-mono shrink-0">UNSAVED</span>}
              {!isAuthenticated && <span className="text-[10px] border border-zenith-border text-zenith-muted px-2 py-0.5 font-mono uppercase shrink-0 hidden sm:block">Read Only</span>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
             <div className="flex border border-zenith-border p-0.5 bg-zenith-surface rounded overflow-hidden">
                  <button 
                     onClick={() => setViewMode('write')}
                     className={clsx(
                         "px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2",
                         viewMode === 'write' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'
                     )}
                     title="Write Mode"
                  >
                     <Icons.Edit size={12} /> <span className="hidden sm:inline">Write</span>
                  </button>
                  <button 
                     onClick={() => setViewMode('split')}
                     className={clsx(
                         "hidden lg:flex px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2 border-l border-r border-zenith-border",
                         viewMode === 'split' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'
                     )}
                     title="Split View"
                  >
                     <Icons.Layout size={12} /> <span className="hidden sm:inline">Split</span>
                  </button>
                  <button 
                     onClick={() => setViewMode('preview')}
                     className={clsx(
                         "px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2",
                         viewMode === 'preview' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white',
                         (viewMode === 'split') && "lg:border-l-0 border-l border-zenith-border"
                     )}
                     title="Preview Mode"
                  >
                     <Icons.File size={12} /> <span className="hidden sm:inline">Render</span>
                  </button>
              </div>

              {isAuthenticated && (
                 <div className="flex items-center gap-2">
                  <button 
                     onClick={() => setIsMetaOpen(!isMetaOpen)}
                     className={clsx(
                         "p-2 transition-colors",
                         isMetaOpen ? 'text-zenith-orange' : 'text-zenith-muted hover:text-white'
                     )}
                     title="Toggle Information Panel"
                  >
                     <Icons.Info size={16} />
                  </button>
                  <div className="h-4 w-px bg-zenith-border mx-1 hidden sm:block"></div>
                  <button 
                     onClick={handleSave}
                     disabled={!hasChanges || isAutoSaving}
                     className={clsx(
                         "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border text-[9px] sm:text-[10px] font-mono tracking-widest uppercase transition-colors shrink-0",
                         hasChanges ? 'border-zenith-orange text-zenith-orange hover:bg-zenith-orange hover:text-black shadow-[0_0_10px_rgba(255,77,0,0.2)]' : 'border-zenith-border text-zenith-muted cursor-not-allowed'
                     )}
                  >
                     {isAutoSaving ? (
                        <>
                            <Icons.RefreshCw size={12} className="animate-spin" /> <span className="hidden xs:inline">Syncing</span>
                        </>
                     ) : (
                        <>
                            <Icons.Save size={14} /> <span>{hasChanges ? 'Commit' : 'Synced'}</span>
                        </>
                     )}
                  </button>
                  <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-zenith-muted hover:text-red-600 transition-colors hidden sm:block"><Icons.Trash size={16} /></button>
                 </div>
              )}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row z-0">
         {(viewMode === 'write' || viewMode === 'split') && (
           <div className={clsx(
               "flex flex-col border-r border-zenith-border",
               viewMode === 'split' ? 'lg:w-1/2 w-full' : 'w-full',
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
                    repoName={repo.name}
                    backlinks={backlinks}
                    onClose={() => setIsMetaOpen(false)}
                />
             </>
         )}
      </div>
      
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
