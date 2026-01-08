import React, { useState } from 'react';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import { Link } from 'react-router-dom';
import QuickCapture from '../components/QuickCapture';
import ContributionGraph from '../components/ContributionGraph';

interface DashboardProps {
  repos: Repository[];
  onCreateRepo: (name: string, description: string, isPrivate: boolean) => Promise<string | null>;
  onQuickSave: (repoId: string, title: string, content: string) => Promise<void>;
  onSync: () => void;
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ repos, onCreateRepo, onQuickSave, onSync, isLoading }) => {
  const [showNewRepoModal, setShowNewRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    await onCreateRepo(newRepoName, newRepoDesc, true);
    setShowNewRepoModal(false);
    setNewRepoName('');
    setNewRepoDesc('');
  };

  const handleQuickCreateRepo = async (name: string) => {
      return await onCreateRepo(name, 'Quickly created via Dashboard', true);
  }

  return (
    <div className="p-6 md:p-12 max-w-[1600px] mx-auto">
      
      {/* Quick Capture Section */}
      <QuickCapture 
        repos={repos} 
        onQuickSave={onQuickSave} 
        onCreateRepo={handleQuickCreateRepo}
      />

      {/* Control Panel Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zenith-border pb-6">
        <div>
           <div className="font-mono text-[10px] tracking-widest text-zenith-orange mb-2">SECTOR: REPOSITORIES</div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">DATA MODULES</h1>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
              onClick={onSync}
              className="bg-zenith-surface border border-zenith-border text-zenith-muted hover:text-white px-4 py-3 text-xs font-mono tracking-widest uppercase transition-colors duration-75 flex items-center gap-2 group"
              title="Sync with Database"
            >
              <Icons.RefreshCw size={14} className={isLoading ? "animate-spin text-zenith-orange" : "group-hover:text-zenith-orange"} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button 
              onClick={() => setShowNewRepoModal(true)}
              className="bg-zenith-surface border border-zenith-border hover:bg-white hover:text-black text-white px-6 py-3 text-xs font-mono tracking-widest uppercase transition-colors duration-75 flex items-center gap-2 group"
            >
              <Icons.Plus size={14} />
              <span>Initialize New Module</span>
            </button>
        </div>
      </div>

      {isLoading && repos.length === 0 ? (
        <div className="text-center py-20 font-mono text-zenith-orange animate-pulse">ESTABLISHING DATABASE CONNECTION...</div>
      ) : (
          <div className="space-y-8">
            {/* Contribution Graph */}
            <ContributionGraph repos={repos} />

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.map(repo => (
                <Link 
                    key={repo.id} 
                    to={`/${repo.id}`}
                    className="group relative bg-zenith-surface border border-zenith-border p-8 min-h-[240px] flex flex-col justify-between hover:border-zenith-orange transition-colors duration-75 overflow-hidden"
                >
                    {/* Decorative Corner Marks */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-zenith-light group-hover:border-zenith-orange"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-zenith-light group-hover:border-zenith-orange"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-zenith-light group-hover:border-zenith-orange"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-zenith-light group-hover:border-zenith-orange"></div>

                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-mono text-[10px] tracking-widest text-zenith-muted uppercase truncate max-w-[150px]">ID: {repo.id.slice(0,8)}</span>
                            <Icons.GitBranch size={14} className="text-zenith-muted group-hover:text-zenith-orange" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-zenith-orange">{repo.name}</h3>
                        <p className="text-zenith-muted text-sm leading-relaxed line-clamp-2 font-mono">{repo.description || "NO DESCRIPTION DATA"}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between border-t border-zenith-border pt-4 mt-4">
                        <div className="font-mono text-[10px] tracking-widest text-zenith-muted">
                            {new Date(repo.updatedAt).toLocaleDateString().toUpperCase()}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] bg-zenith-border text-white px-2 py-0.5 font-mono flex items-center gap-1">
                                <Icons.File size={10} /> {repo.files.length}
                            </span>
                            <div className="text-[10px] bg-zenith-border text-white px-2 py-0.5 font-mono">
                                {repo.language.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </Link>
                ))}
            </div>
          </div>
      )}

      {/* New Repo Modal */}
      {showNewRepoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zenith-bg border border-zenith-border w-full max-w-lg p-0 relative shadow-2xl shadow-black">
            <div className="bg-zenith-surface border-b border-zenith-border p-4 flex justify-between items-center">
                <span className="font-mono text-xs tracking-widest text-zenith-orange uppercase">Create New Module</span>
                <button onClick={() => setShowNewRepoModal(false)} className="text-zenith-muted hover:text-white"><Icons.Close size={20}/></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block font-mono text-[10px] tracking-widest text-zenith-muted uppercase">Module Designation</label>
                <input 
                  autoFocus
                  required
                  value={newRepoName}
                  onChange={e => setNewRepoName(e.target.value)}
                  className="w-full bg-black border border-zenith-border p-3 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none transition-colors"
                  placeholder="project-alpha"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-mono text-[10px] tracking-widest text-zenith-muted uppercase">Mission Brief</label>
                <textarea 
                  value={newRepoDesc}
                  onChange={e => setNewRepoDesc(e.target.value)}
                  className="w-full bg-black border border-zenith-border p-3 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none transition-colors h-24 resize-none"
                  placeholder="Optional initialization parameters..."
                />
              </div>
              
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-zenith-orange text-black px-6 py-2 text-sm font-bold tracking-widest uppercase hover:bg-white transition-colors duration-75">
                  Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;