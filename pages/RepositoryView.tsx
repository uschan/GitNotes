import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import RepoSettingsModal from '../components/RepoSettingsModal';

interface RepositoryViewProps {
  repos: Repository[];
  onAddFile: (repoId: string, filename: string) => void;
  onDeleteRepo: (repoId: string) => void;
  onUpdateRepo: (repoId: string, name: string, description: string) => void;
  isAuthenticated: boolean;
}

const RepositoryView: React.FC<RepositoryViewProps> = ({ repos, onAddFile, onDeleteRepo, onUpdateRepo, isAuthenticated }) => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const repo = repos.find(r => r.id === repoId);
  
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  if (!repo) {
    return <div className="h-screen flex items-center justify-center font-mono text-zenith-orange">ERROR: MODULE NOT FOUND</div>;
  }

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.endsWith('.md')) name += '.md';
    
    onAddFile(repo.id, name);
    setShowAddFile(false);
    setNewFileName('');
  };

  const handleDeleteConfirm = () => {
    onDeleteRepo(repo.id);
    navigate('/');
  };

  // Find README for preview
  const readme = repo.files.find(f => f.name.toLowerCase() === 'readme.md');

  return (
    <div className="min-h-screen bg-zenith-bg p-6 md:p-12 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-zenith-border pb-6">
        <div>
            <div className="flex items-center gap-2 font-mono text-xs text-zenith-muted mb-2">
                <Link to="/" className="hover:text-zenith-orange">ROOT</Link>
                <span>/</span>
                <span className="text-white">{repo.id.toUpperCase()}</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{repo.name}</h1>
            <p className="text-zenith-muted font-mono text-sm max-w-2xl">{repo.description}</p>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
              <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="bg-zenith-surface border border-zenith-border text-zenith-muted px-3 py-2 text-xs font-mono uppercase hover:text-white hover:border-white transition-colors duration-75 flex items-center gap-2"
                  title="Configure Module"
              >
                  <Icons.Settings size={14} />
              </button>
              <div className="w-px h-6 bg-zenith-border"></div>
              <button 
                  onClick={() => setShowAddFile(true)}
                  className="bg-zenith-surface border border-zenith-border text-white px-4 py-2 text-xs font-mono tracking-widest uppercase hover:bg-white hover:text-black transition-colors duration-75 flex items-center gap-2"
              >
                  <Icons.Plus size={14} /> Add File
              </button>
              <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="border border-zenith-border text-zenith-muted px-4 py-2 text-xs font-mono tracking-widest uppercase hover:border-zenith-orange hover:text-zenith-orange transition-colors duration-75"
              >
                  Delete
              </button>
          </div>
        )}
      </div>

      {/* Add File Input */}
      {showAddFile && isAuthenticated && (
        <div className="mb-8 p-6 border border-zenith-orange bg-zenith-surface/50">
           <form onSubmit={handleAddFile} className="flex gap-4 items-center">
               <span className="font-mono text-zenith-orange text-lg">/</span>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="filename.md" 
                 className="bg-transparent border-b border-zenith-border text-white p-2 font-mono text-sm flex-1 outline-none focus:border-zenith-orange"
                 value={newFileName}
                 onChange={e => setNewFileName(e.target.value)}
               />
               <button type="submit" className="text-zenith-orange font-mono text-xs uppercase hover:underline">Create</button>
               <button type="button" onClick={() => setShowAddFile(false)} className="text-zenith-muted font-mono text-xs uppercase hover:text-white">Cancel</button>
           </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
          {/* File List Table */}
          <div className="lg:col-span-2">
             <div className="border border-zenith-border">
                <div className="bg-zenith-surface border-b border-zenith-border px-4 py-2 font-mono text-[10px] tracking-widest text-zenith-muted uppercase flex justify-between">
                    <span>File Index</span>
                    <span>Count: {repo.files.length}</span>
                </div>
                
                <div className="divide-y divide-zenith-border bg-black">
                    {repo.files.map(file => (
                        <div key={file.id} className="group flex items-center justify-between p-4 hover:bg-zenith-surface transition-colors duration-75">
                            <div className="flex items-center gap-4">
                                <Icons.File size={16} className="text-zenith-muted group-hover:text-zenith-orange" />
                                <Link to={`/${repo.id}/${file.id}`} className="font-mono text-sm text-zenith-text group-hover:text-white group-hover:underline decoration-zenith-orange underline-offset-4">
                                    {file.name}
                                </Link>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="font-mono text-[10px] text-zenith-muted hidden sm:block">
                                    {(file.size / 1024).toFixed(2)} KB
                                </span>
                                <span className="font-mono text-[10px] text-zenith-muted">
                                    {new Date(file.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {repo.files.length === 0 && (
                        <div className="p-8 text-center font-mono text-xs text-zenith-muted uppercase">
                            No files detected in sector
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* README Preview Panel */}
          <div className="lg:col-span-1">
             {readme ? (
                 <div className="border border-zenith-border sticky top-20">
                    <div className="bg-zenith-surface border-b border-zenith-border px-4 py-2 font-mono text-[10px] tracking-widest text-zenith-muted uppercase flex items-center gap-2">
                        <div className="w-2 h-2 bg-zenith-green rounded-full"></div>
                        <span>Preview: README.md</span>
                    </div>
                    <div className="p-6 bg-zenith-bg max-h-[calc(100vh-200px)] overflow-y-auto">
                        <MarkdownPreview content={readme.content} />
                    </div>
                 </div>
             ) : (
                 <div className="border border-zenith-border border-dashed p-8 text-center">
                     <span className="font-mono text-xs text-zenith-muted">NO README DETECTED</span>
                 </div>
             )}
          </div>
      </div>

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Module"
        itemName={repo.name}
        warningText="Deleting this repository will permanently erase all contained files and version history. This action cannot be reversed."
      />

      <RepoSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={(name, desc) => onUpdateRepo(repo.id, name, desc)}
        initialName={repo.name}
        initialDesc={repo.description}
      />
    </div>
  );
};

export default RepositoryView;