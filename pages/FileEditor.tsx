import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

interface FileEditorProps {
  repos: Repository[];
  onUpdateFile: (repoId: string, fileId: string, newContent: string) => void;
  onDeleteFile: (repoId: string, fileId: string) => void;
  isAuthenticated: boolean;
}

const FileEditor: React.FC<FileEditorProps> = ({ repos, onUpdateFile, onDeleteFile, isAuthenticated }) => {
  const { repoId, fileId } = useParams<{ repoId: string; fileId: string }>();
  const navigate = useNavigate();
  
  const repo = repos.find(r => r.id === repoId);
  const file = repo?.files.find(f => f.id === fileId);

  // Default to rendering mode for visitors
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      // Auto-switch to edit mode only for authenticated users upon opening
      if (isAuthenticated) {
          setIsEditing(false); // keep false initially to encourage reading first
      }
    }
  }, [file, isAuthenticated]);

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

  const lineCount = content.split('\n').length;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-zenith-bg">
      
      {/* File Toolbar */}
      <div className="h-14 border-b border-zenith-border bg-zenith-bg flex items-center justify-between px-6 shrink-0">
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
                    onClick={() => setIsEditing(true)}
                    className={`px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all ${isEditing ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                 >
                    Write
                 </button>
                 <button 
                    onClick={() => setIsEditing(false)}
                    className={`px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all ${!isEditing ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                 >
                    Render
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
         
         {/* Line Numbers (Dynamic) */}
         <div className="hidden md:block w-12 bg-zenith-surface border-r border-zenith-border text-right py-6 pr-3 font-mono text-xs text-zenith-border select-none overflow-hidden">
             {Array.from({length: Math.max(lineCount, 20)}).map((_, i) => <div key={i}>{i+1}</div>)}
         </div>

         <div className="flex-1 relative overflow-auto">
             {isEditing ? (
                 <textarea
                    readOnly={!isAuthenticated}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className={`w-full h-full bg-zenith-bg text-zenith-text font-mono text-sm p-6 resize-none outline-none transition-colors leading-relaxed ${!isAuthenticated ? 'cursor-not-allowed text-zenith-muted' : 'focus:bg-[#050505]'}`}
                    spellCheck={false}
                    placeholder={!isAuthenticated ? "Editing is disabled in visitor mode." : "Start typing..."}
                 />
             ) : (
                 <div className="p-8 max-w-4xl mx-auto">
                     <MarkdownPreview content={content} />
                 </div>
             )}
         </div>

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