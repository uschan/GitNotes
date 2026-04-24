import React, { useState, useMemo } from 'react';
import { Repository } from '../types';
import { Icons } from '../components/Icon';
import { Link, useNavigate } from 'react-router-dom';
import QuickCapture from '../components/QuickCapture';
import ContributionGraph from '../components/ContributionGraph';

interface DashboardProps {
  repos: Repository[];
  onCreateRepo: (name: string, description: string, isPrivate: boolean) => Promise<string | null>;
  onQuickSave: (repoId: string, title: string, content: string) => Promise<void>;
  onSync: () => void;
  onQuickCaptureOpen: () => void;
  isLoading: boolean;
  // We need to access api to perform the specialized addFile with date, 
  // but since we are props-drilling, we'll just expose a special prop or reuse onQuickSave if we modify App.tsx. 
  // Actually, easiest is to pass a specialized handler from App.tsx. 
  // BUT, since we didn't update App.tsx to pass a new prop, we can implement the logic here if we had access to API, 
  // or better, let's update App.tsx to pass 'onPixelArt'. 
  // WAITING: I will assume I can modify App.tsx next.
  onPixelArt?: (date: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ repos, onCreateRepo, onQuickSave, onSync, onQuickCaptureOpen, isLoading, onPixelArt }) => {
  const [showNewRepoModal, setShowNewRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const navigate = useNavigate();

  const recentFiles = useMemo(() => {
    const allFiles: any[] = [];
    repos.forEach(repo => {
        repo.files.forEach(file => {
            allFiles.push({
                ...file,
                repoId: repo.id,
                repoName: repo.name
            });
        });
    });
    return allFiles
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);
  }, [repos]);

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
      
      {/* Control Panel Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zenith-border pb-6">
        <div>
           <div className="font-mono text-[10px] tracking-widest text-zenith-orange mb-2">SECTOR: REPOSITORIES</div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">DATA MODULES</h1>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={onQuickCaptureOpen} 
                className="bg-zenith-orange/10 border border-zenith-orange/30 text-zenith-orange hover:bg-zenith-orange hover:text-black px-6 py-3 text-xs font-bold font-mono tracking-widest uppercase transition-all flex items-center gap-3 group shadow-[0_0_20px_rgba(255,77,0,0.1)]"
            >
                <Icons.Zap size={14} className="animate-pulse" />
                <span>Quick Inject</span>
            </button>

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
        <div className="text-center py-20 font-mono text-zenith-orange animate-pulse uppercase tracking-[0.3em]">Establishing Database Uplink...</div>
      ) : (
          <div className="space-y-12">
            {/* Contribution Graph with Pixel Art Hook (Hidden on Mobile) */}
            <section className="hidden md:block">
                <div className="font-mono text-[10px] tracking-widest text-zenith-muted mb-4 uppercase">Neural Activity Graph</div>
                <ContributionGraph repos={repos} onDrawPixel={onPixelArt} />
            </section>

            {/* Recent Files Section */}
            {recentFiles.length > 0 && (
                <section>
                    <div className="font-mono text-[10px] tracking-widest text-zenith-muted mb-4 uppercase">Recent Telemetry</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentFiles.map(file => (
                            <Link 
                                key={`${file.repoId}-${file.id}`}
                                to={`/${file.repoId}/${file.id}`}
                                className="group bg-zenith-surface/30 border border-zenith-border p-4 hover:border-zenith-orange transition-all flex items-center gap-4"
                            >
                                <div className="p-2 bg-zenith-bg border border-zenith-border group-hover:border-zenith-orange/30 transition-colors">
                                    <Icons.FileText size={18} className="text-zenith-muted group-hover:text-zenith-orange transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-mono text-sm font-bold text-white truncate group-hover:text-zenith-orange transition-colors">{file.name}</div>
                                    <div className="font-mono text-[9px] text-zenith-muted uppercase tracking-tighter truncate opacity-60">Sector: {file.repoName}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Modules Overview */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="font-mono text-[10px] tracking-widest text-zenith-muted uppercase">Active System Modules</div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {repos.map(repo => (
                    <Link 
                        key={repo.id} 
                        to={`/${repo.id}`}
                        className="group relative bg-zenith-surface border border-zenith-border p-6 hover:border-zenith-orange transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-zenith-orange transition-colors">{repo.name}</h3>
                            <Icons.Terminal size={14} className="text-zenith-muted group-hover:text-zenith-orange transition-colors" />
                        </div>
                        <p className="text-zenith-muted text-xs leading-relaxed line-clamp-2 font-mono mb-4">{repo.description || "NO METADATA AVAILABLE"}</p>
                        
                        <div className="flex items-center gap-3 pt-4 border-t border-zenith-border/50">
                            <span className="text-[9px] bg-zenith-light/20 text-white px-2 py-0.5 font-mono flex items-center gap-1 uppercase">
                                <Icons.File size={10} /> {repo.files.length} Records
                            </span>
                            <span className="text-[9px] text-zenith-muted font-mono uppercase tracking-tighter">
                                Updated {new Date(repo.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </Link>
                    ))}
                    
                    <button 
                        onClick={() => setShowNewRepoModal(true)}
                        className="group relative bg-transparent border border-zenith-border border-dashed p-6 flex flex-col items-center justify-center gap-3 hover:border-zenith-orange transition-all duration-300 min-h-[160px]"
                    >
                        <Icons.Plus size={24} className="text-zenith-muted group-hover:text-zenith-orange transition-all group-hover:scale-110" />
                        <span className="font-mono text-[10px] tracking-widest text-zenith-muted uppercase group-hover:text-white">Initialize New Module</span>
                    </button>
                </div>
            </section>
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