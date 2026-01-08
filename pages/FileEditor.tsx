import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EditorToolbar from '../components/EditorToolbar';
import TurndownService from 'turndown';
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
      // Auto-switch to preview mode for visitors, write for admin if desired, 
      // but 'preview' is a safe default for reading.
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Only intervene if authenticated and we have HTML content
    if (!isAuthenticated) return;

    const clipboardData = e.clipboardData;
    const types = clipboardData.types;

    // Check if HTML exists in clipboard
    if (types.includes('text/html')) {
        const html = clipboardData.getData('text/html');
        
        // Basic check to see if it's worth converting (contains tags)
        if (/<[a-z][\s\S]*>/i.test(html)) {
            e.preventDefault();
            
            try {
                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    codeBlockStyle: 'fenced',
                    bulletListMarker: '-',
                    emDelimiter: '*'
                });
                
                // Add GFM plugin (tables, strikethrough, etc)
                turndownService.use(gfm);

                // Custom rules if needed, e.g., to handle pre tags better
                turndownService.addRule('pre', {
                    filter: ['pre'],
                    replacement: function (content, node) {
                        return '```\n' + node.textContent + '\n```';
                    }
                });

                const markdown = turndownService.turndown(html);
                
                // Show status feedback
                setConversionStatus("DETECTED RICH TEXT: AUTO-CONVERTING TO MARKDOWN...");
                setTimeout(() => setConversionStatus(null), 3000);

                // Insert the converted markdown
                if (!textAreaRef.current) return;
                const start = textAreaRef.current.selectionStart;
                const end = textAreaRef.current.selectionEnd;
                const text = textAreaRef.current.value;
                const before = text.substring(0, start);
                const after = text.substring(end);
                
                const newText = before + markdown + after;
                handleContentChange(newText);
                
                // Update cursor
                setTimeout(() => {
                    if (textAreaRef.current) {
                        textAreaRef.current.focus();
                        const newCursorPos = start + markdown.length;
                        textAreaRef.current.selectionStart = newCursorPos;
                        textAreaRef.current.selectionEnd = newCursorPos;
                    }
                }, 0);

            } catch (err) {
                console.error("Paste conversion failed", err);
                // Fallback to default paste if conversion errors
                // We do nothing here, let the event propagate? 
                // Since we called preventDefault, we must manually insert plain text if it fails, 
                // but usually preventDefault is called early. 
                // For safety, if error, we might just insert plain text.
                const plainText = clipboardData.getData('text/plain');
                if (!textAreaRef.current) return;
                 const start = textAreaRef.current.selectionStart;
                const end = textAreaRef.current.selectionEnd;
                const text = textAreaRef.current.value;
                const before = text.substring(0, start);
                const after = text.substring(end);
                handleContentChange(before + plainText + after);
            }
        }
    }
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-zenith-bg">
      
      {/* File Toolbar */}
      <div className="h-14 border-b border-zenith-border bg-zenith-bg flex items-center justify-between px-6 shrink-0 relative">
          
          {/* Status Overlay for Paste */}
          {conversionStatus && (
              <div className="absolute inset-0 bg-zenith-orange/90 flex items-center justify-center z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="font-mono text-black font-bold text-xs tracking-widest flex items-center gap-2">
                      <Icons.Zap size={14} /> {conversionStatus}
                  </span>
              </div>
          )}

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
      <div className="flex-1 overflow-hidden relative flex">
         
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
                    placeholder={!isAuthenticated ? "Editing is disabled in visitor mode." : "Start typing... (Paste rich text to auto-convert to Markdown)"}
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
      <div className="h-8 border-t border-zenith-border bg-zenith-surface flex items-center justify-between px-4 font-mono text-[10px] text-zenith-muted uppercase tracking-widest">
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