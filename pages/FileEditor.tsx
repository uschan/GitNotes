import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EditorToolbar from '../components/EditorToolbar';
// Import Turndown generically to handle both CJS and ESM environments in Vite
// @ts-ignore
import * as TurndownServiceModule from 'turndown';
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
    
    console.log("GitNotes Paste Debug: Available Types ->", types);

    // Check for HTML content presence regardless of tags (to catch edge cases)
    if (types.includes('text/html')) {
        const html = clipboardData.getData('text/html');
        console.log("GitNotes Paste Debug: HTML content found. Length:", html.length);
        console.log("GitNotes Paste Debug: HTML snippet:", html.substring(0, 100));
        
        // We will attempt conversion whenever HTML is present, skipping the regex check
        // because sometimes simple bold/italic text or code blocks won't have complex tags structure
        // that matches a strict regex.
        
        try {
            console.log("GitNotes Paste Debug: Attempting Turndown conversion...");
            e.preventDefault(); // Stop default plain text paste immediately

            // Robustly resolve the Turndown constructor
            // Vite/Rollup can sometimes bundle CJS modules as `default` export or flat exports.
            // @ts-ignore
            const TurndownService = TurndownServiceModule.default || TurndownServiceModule;
            
            if (typeof TurndownService !== 'function') {
                throw new Error(`TurndownService is not a constructor. It is type: ${typeof TurndownService}`);
            }

            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                bulletListMarker: '-',
                emDelimiter: '*'
            });
            
            // Apply GFM plugin if available
            if (typeof gfm === 'function') {
                 try {
                     turndownService.use(gfm);
                 } catch (pluginError) {
                     console.warn("GitNotes Warning: Failed to apply GFM plugin", pluginError);
                 }
            } else {
                console.warn("GitNotes Warning: GFM plugin is not a function:", gfm);
            }

            // Custom rule for pre tags to ensure code blocks work well
            turndownService.addRule('pre', {
                filter: ['pre'],
                replacement: function (content, node) {
                     return '\n```\n' + node.textContent + '\n```\n';
                }
            });

            const markdown = turndownService.turndown(html);
            console.log("GitNotes Paste Debug: Conversion success. MD Length:", markdown.length);
            
            // Visual Feedback
            setConversionStatus("RICH TEXT CONVERTED");
            setTimeout(() => setConversionStatus(null), 3000);

            insertTextAtCursor(markdown);

        } catch (err) {
            console.error("GitNotes Error: Paste conversion failed:", err);
            
            // Fallback: insert the plain text
            const plainText = clipboardData.getData('text/plain');
            insertTextAtCursor(plainText);
            
            setConversionStatus("CONVERSION FAILED - PLAIN TEXT");
            setTimeout(() => setConversionStatus(null), 3000);
        }
        return;
    }
    
    console.log("GitNotes Paste Debug: No HTML type found, default paste.");
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

         {/* Preview Panel */}
         {(viewMode === 'preview' || viewMode === 'split') && (
           <div className={`flex-1 overflow-auto bg-zenith-bg ${viewMode === 'split' ? 'bg-[#080808]' : ''}`}>
               <div className={`p-8 mx-auto ${viewMode === 'split' ? 'max-w-none' : 'max-w-4xl'}`}>
                   <MarkdownPreview content={content} />
               </div>
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