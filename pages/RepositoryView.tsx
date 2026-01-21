import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import MarkdownPreview from '../components/MarkdownPreview';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import RepoSettingsModal from '../components/RepoSettingsModal';
import GraphViewWrapper from '../components/GraphView';

interface RepositoryViewProps {
  repos: Repository[];
  onAddFile: (repoId: string, filename: string) => void;
  onDeleteRepo: (repoId: string) => void;
  onUpdateRepo: (repoId: string, name: string, description: string) => void;
  onUpdateFile: (repoId: string, fileId: string, content: string) => void; // Added for graph connection
  isAuthenticated: boolean;
}

const RepositoryView: React.FC<RepositoryViewProps> = ({ repos, onAddFile, onDeleteRepo, onUpdateRepo, onUpdateFile, isAuthenticated }) => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const repo = repos.find(r => r.id === repoId);
  
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  // View State: 'list' or 'graph'
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // Graph Scope: 'local' or 'global' - Persisted preference
  const [graphScope, setGraphScopeState] = useState<'local' | 'global'>(() => {
      return (localStorage.getItem('gitnotes_graph_scope') as 'local' | 'global') || 'local';
  });

  const setGraphScope = (scope: 'local' | 'global') => {
      setGraphScopeState(scope);
      localStorage.setItem('gitnotes_graph_scope', scope);
  };

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

  const handleConnectNodes = (sourceId: string, targetId: string) => {
      if (!isAuthenticated) return;
      
      // Find files across ALL repos if global, or just local if local logic (though helper keeps it simple)
      let sourceFile = repo.files.find(f => f.id === sourceId);
      let targetFile = repo.files.find(f => f.id === targetId);
      let targetRepoId = repo.id;

      // Global Search for node connection
      if (!sourceFile || !targetFile) {
          repos.forEach(r => {
              const s = r.files.find(f => f.id === sourceId);
              if (s) sourceFile = s;
              const t = r.files.find(f => f.id === targetId);
              if (t) {
                  targetFile = t;
                  targetRepoId = r.id;
              }
          });
      }

      if (sourceFile && targetFile) {
          const linkName = targetFile.name.replace('.md', '');
          // Check if link already exists to prevent duplication
          if (!sourceFile.content.includes(`[[${linkName}]]`)) {
             const newContent = sourceFile.content + `\n\nRelated: [[${linkName}]]`;
             // We need to find the repo ID of the SOURCE file to update it
             const sourceRepo = repos.find(r => r.files.some(f => f.id === sourceId));
             if (sourceRepo) {
                 onUpdateFile(sourceRepo.id, sourceId, newContent);
             }
          }
      }
  };

  const handleDisconnectNodes = (sourceId: string, targetId: string) => {
      if (!isAuthenticated) return;

      let sourceFile = repo.files.find(f => f.id === sourceId);
      let targetFile = repo.files.find(f => f.id === targetId);

      // Global Search
      if (!sourceFile || !targetFile) {
          repos.forEach(r => {
              const s = r.files.find(f => f.id === sourceId);
              if (s) sourceFile = s;
              const t = r.files.find(f => f.id === targetId);
              if (t) targetFile = t;
          });
      }

      if (sourceFile && targetFile) {
          const linkName = targetFile.name.replace('.md', '');
          const escapedLinkName = linkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          const lines = sourceFile.content.split('\n');
          const newLines = lines.filter(line => {
              const linkRegex = new RegExp(`\\[\\[${escapedLinkName}(?:\\.md)?\\]\\]`, 'i');
              if (!linkRegex.test(line)) return true;
              const listItemRegex = new RegExp(`^\\s*(?:[-*+]|\\d+\\.)\\s*\\[\\[${escapedLinkName}(?:\\.md)?\\]\\].*$`, 'i');
              if (listItemRegex.test(line)) return false; 
              const propRegex = new RegExp(`^\\s*(?:Related|Parent|Child|See|Source|Upstream|Ref)\\s*:?\\s*\\[\\[${escapedLinkName}(?:\\.md)?\\]\\].*$`, 'i');
              if (propRegex.test(line)) return false; 
              if (line.trim() === `[[${linkName}]]` || line.trim() === `[[${linkName}.md]]`) return false;
              return true;
          }).map(line => {
              const linkRegex = new RegExp(`\\[\\[(${escapedLinkName})(?:\\.md)?\\]\\]`, 'gi');
              return line.replace(linkRegex, '$1'); 
          });

          let newContent = newLines.join('\n');
          newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();

          const sourceRepo = repos.find(r => r.files.some(f => f.id === sourceId));
          if (sourceRepo) {
            onUpdateFile(sourceRepo.id, sourceId, newContent);
          }
      }
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
              {/* View Toggle */}
              <div className="flex border border-zenith-border p-0.5 bg-zenith-surface mr-4">
                 <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-xs font-mono uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                    title="List View"
                 >
                    <Icons.List size={14} />
                 </button>
                 <button 
                    onClick={() => setViewMode('graph')}
                    className={`px-3 py-2 text-xs font-mono uppercase transition-all flex items-center gap-2 border-l border-zenith-border ${viewMode === 'graph' ? 'bg-white text-black font-bold' : 'text-zenith-muted hover:text-white'}`}
                    title="Constellation View"
                 >
                    <Icons.Network size={14} />
                 </button>
              </div>

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

      {/* Add File Input (Global for this view) */}
      {showAddFile && isAuthenticated && (
        <div className="mb-8 p-6 border border-zenith-orange bg-zenith-surface/50 animate-in slide-in-from-top-2">
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
               <button type="submit" className="text-zenith-orange font-mono text-xs uppercase hover:underline">Execute</button>
               <button type="button" onClick={() => setShowAddFile(false)} className="text-zenith-muted font-mono text-xs uppercase hover:text-white">Cancel</button>
           </form>
        </div>
      )}

      {/* Main Content Switcher */}
      {viewMode === 'graph' ? (
          <div className="border border-zenith-border bg-zenith-surface/20 animate-in fade-in duration-500 relative">
             
             {/* Scope Toggle (Floating inside Graph) */}
             <div className="absolute top-4 left-4 z-20 flex gap-2">
                <button 
                   onClick={() => setGraphScope('local')}
                   className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${graphScope === 'local' ? 'bg-zenith-orange text-black border-zenith-orange' : 'bg-black text-zenith-muted border-zenith-border hover:border-white'}`}
                >
                   Local Sector
                </button>
                <button 
                   onClick={() => setGraphScope('global')}
                   className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${graphScope === 'global' ? 'bg-zenith-green text-black border-zenith-green' : 'bg-black text-zenith-muted border-zenith-border hover:border-white'}`}
                >
                   Galaxy View
                </button>
             </div>

             <GraphViewWrapper 
                activeRepoId={repo.id}
                repos={repos} // Pass ALL repos now
                scope={graphScope}
                onAddFile={() => setShowAddFile(true)}
                onLinkNodes={handleConnectNodes}
                onDisconnectNodes={handleDisconnectNodes}
             />
          </div>
      ) : (
          <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
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
      )}

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