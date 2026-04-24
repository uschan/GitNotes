import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import clsx from 'clsx';
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

  // Adjust viewMode for mobile automatically
  React.useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768 && viewMode === 'graph') {
            setViewMode('list');
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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
    <div className="flex flex-col h-full bg-zenith-bg overflow-hidden animate-in fade-in duration-500">
      
      <div className="pt-8 pb-10 px-8 lg:px-12 border-b border-zenith-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-zenith-muted uppercase opacity-60">
                <span>ROOT</span>
                <span className="opacity-30">/</span>
                <span className="text-zenith-orange">{repo.id}</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tighter text-white">{repo.name}</h1>
              <p className="text-zenith-muted font-mono text-xs max-w-2xl opacity-70 leading-relaxed">{repo.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex border border-zenith-border rounded-sm overflow-hidden bg-black/40">
                <button 
                   onClick={() => setViewMode('list')}
                   className={clsx("p-2 transition-all group", viewMode === 'list' ? 'bg-white text-black' : 'text-zenith-muted hover:text-white')}
                   title="Index View"
                >
                   <Icons.List size={16} />
                </button>
                <button 
                   onClick={() => setViewMode('graph')}
                   className={clsx("p-2 transition-all border-l border-zenith-border group", viewMode === 'graph' ? 'bg-white text-black' : 'text-zenith-muted hover:text-white')}
                   title="Graph View"
                >
                   <Icons.Network size={16} />
                </button>
              </div>

              <div className="h-4 w-px bg-zenith-border mx-1"></div>

              {isAuthenticated && (
                <>
                  <button 
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="p-2 border border-zenith-border hover:bg-white/5 rounded-sm transition-colors text-zenith-muted hover:text-white"
                      title="Configuration"
                  >
                      <Icons.Settings size={16} />
                  </button>
                  <button 
                      onClick={() => onAddFile(repo.id, 'New File.md')}
                      className="px-4 py-2 bg-white/5 border border-zenith-border hover:border-white transition-all text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2"
                  >
                      <Icons.Plus size={12} /> Add File
                  </button>
                  <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2 border border-zenith-border hover:border-red-500/50 hover:bg-red-500/5 transition-all text-[10px] font-bold uppercase tracking-widest text-zenith-muted hover:text-red-500"
                  >
                      Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'graph' ? (
            <div className="absolute inset-0 z-0 overflow-hidden flex flex-col">
               <div className="flex-1 relative">
                   <GraphViewWrapper 
                      activeRepoId={repo.id}
                      repos={repos}
                      scope={graphScope}
                      onAddFile={() => setShowAddFile(true)}
                      onLinkNodes={handleConnectNodes}
                      onDisconnectNodes={handleDisconnectNodes}
                   />

                   {/* Scope Toggle (Floating inside Graph) */}
                   <div className="absolute top-4 left-4 z-20 flex gap-1 bg-black/80 backdrop-blur-md p-1 border border-zenith-border rounded-lg shadow-2xl">
                      <button 
                         onClick={() => setGraphScope('local')}
                         className={clsx("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-colors", graphScope === 'local' ? 'bg-zenith-orange text-black' : 'text-zenith-muted hover:text-white')}
                      >
                         Local
                      </button>
                      <button 
                         onClick={() => setGraphScope('global')}
                         className={clsx("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-colors", graphScope === 'global' ? 'bg-zenith-green text-black' : 'text-zenith-muted hover:text-white')}
                      >
                         Global
                      </button>
                   </div>
               </div>
            </div>
        ) : (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
              {/* Left Column: File Index */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col overflow-hidden border-r border-zenith-border/50">
                  <div className="px-8 py-4 border-b border-zenith-border/30 bg-black/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] tracking-[0.2em] text-zenith-muted uppercase">File Index</span>
                      </div>
                      <span className="font-mono text-[9px] text-zenith-muted uppercase tracking-widest opacity-50">Count: {repo.files.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-zenith-border/20">
                          {repo.files.length > 0 ? (
                              repo.files.map(file => (
                                  <Link 
                                      key={file.id} 
                                      to={`/${repo.id}/${file.id}`}
                                      className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.02] transition-colors group"
                                  >
                                      <div className="flex items-center gap-4">
                                          <Icons.FileText 
                                              size={16} 
                                              className={clsx(
                                                  "transition-colors",
                                                  file.name.toLowerCase() === 'readme.md' ? "text-zenith-orange" : "text-zenith-muted"
                                              )} 
                                          />
                                          <span className={clsx(
                                              "font-mono text-sm tracking-tight transition-colors",
                                              file.name.toLowerCase() === 'readme.md' ? "text-white font-bold" : "text-zenith-muted group-hover:text-white"
                                          )}>
                                              {file.name}
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-8 shrink-0">
                                          <span className="font-mono text-[10px] text-zenith-muted opacity-40">
                                              {(file.content.length / 1024).toFixed(2)} KB
                                          </span>
                                          <span className="font-mono text-[10px] text-zenith-muted opacity-40 w-20 text-right">
                                              {new Date(file.updatedAt).toLocaleDateString()}
                                          </span>
                                      </div>
                                  </Link>
                              ))
                          ) : (
                              <div className="py-32 text-center flex flex-col items-center justify-center">
                                  <Icons.FolderOpen size={48} className="text-zenith-border mb-4 opacity-20" />
                                  <div className="font-mono text-[10px] text-zenith-muted uppercase tracking-widest opacity-40">Repository is Empty</div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Right Column: README Preview */}
              <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col overflow-hidden bg-black/20">
                  <div className="px-8 py-4 border-b border-zenith-border/30 bg-black/20 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-zenith-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="font-mono text-[10px] tracking-[0.2em] text-zenith-muted uppercase">Preview: README.md</span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                      {readme ? (
                          <div className="prose prose-invert prose-zenith max-w-none">
                              <MarkdownPreview content={readme.content} />
                          </div>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center grayscale">
                              <Icons.FileText size={48} className="mb-4 text-zenith-border" />
                              <p className="font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                                  No Protocol Specification (README.md) Detected in Sector
                              </p>
                          </div>
                      )}
                  </div>
              </div>
            </div>
        )}
      </div>

      {/* Persistence Bar */}
      <div className="h-8 border-t border-zenith-border bg-[#0a0a0a] flex items-center justify-between px-4 font-mono text-[9px] text-zenith-muted uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-3">
              <span className="opacity-40">PERSISTENCE</span>
              <span className="text-zenith-green">READY</span>
          </div>
          <div className="flex items-center gap-3">
              <span className="opacity-40">ALLOCATED</span>
              <span className="text-white font-bold">{repo.files.length} NODES</span>
          </div>
      </div>
      
      {/* Mobile Fallback for Graph Mode Persistence */}
      {viewMode === 'graph' && (
          <div className="md:hidden border border-zenith-border bg-zenith-surface/10 p-8 text-center">
              <div className="text-zenith-orange font-mono text-xs uppercase tracking-widest mb-2">Display Error</div>
              <div className="text-zenith-muted text-xs">Constellation View is not available on mobile interfaces.</div>
              <button 
                onClick={() => setViewMode('list')}
                className="mt-4 bg-zenith-surface border border-zenith-border px-4 py-2 text-xs font-mono text-white hover:border-white uppercase"
              >
                  Return to List View
              </button>
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