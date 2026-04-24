import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Repository, FileItem } from '../types';
import { Icons } from './Icon';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface LeftSidebarProps {
  repos: Repository[];
  currentRepoId?: string;
  onCreateRepo: (name: string, description: string) => Promise<string | null>;
  onSync: () => void;
  isLoading: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  repos, 
  currentRepoId, 
  onCreateRepo, 
  onSync, 
  isLoading, 
  setIsSearchOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [expandedRepos, setExpandedRepos] = useState<Record<string, boolean>>({});

  const toggleRepo = (repoId: string) => {
    setExpandedRepos(prev => ({
      ...prev,
      [repoId]: !prev[repoId]
    }));
  };

  // Helper to check if a file or repo is active
  const isActive = (path: string) => pathname === path;
  const isRepoActive = (repoId: string) => pathname.startsWith(`/${repoId}`);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] lg:hidden transition-all duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside className={clsx(
        "fixed inset-y-0 left-0 lg:relative z-[100] w-64 bg-zenith-surface border-r border-zenith-border flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-out",
        !isMobileOpen && "-translate-x-full lg:translate-x-0"
      )}>
        {/* Top Bar / Branding */}
        <div className="h-14 border-b border-zenith-border flex items-center px-4 shrink-0 justify-between">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-zenith-orange"></div>
              <span className="font-mono font-bold text-sm tracking-widest text-white uppercase">Zenith // Core</span>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden text-zenith-muted hover:text-white">
              <Icons.Close size={18} />
            </button>
          )}
        </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto pt-4 space-y-1 custom-scrollbar">
        <div className="px-3 mb-2 space-y-1">
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-zenith-surface border border-zenith-border rounded group hover:border-zenith-orange transition-all mb-2"
            >
                <div className="flex items-center gap-3 text-zenith-muted group-hover:text-white transition-colors">
                    <Icons.Search size={14} />
                    <span className="font-mono text-[10px] tracking-widest uppercase">Global Scan</span>
                </div>
                <div className="font-mono text-[9px] text-zenith-border group-hover:text-zenith-orange border border-zenith-border px-1.5 py-0.5 rounded leading-none transition-colors">
                    ^K
                </div>
            </button>

            <NavLink 
                to="/" 
                className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2 text-xs font-mono tracking-widest uppercase rounded transition-colors group",
                    isActive ? "bg-zenith-orange text-black font-bold" : "text-zenith-muted hover:text-white hover:bg-zenith-light/20"
                )}
            >
                <Icons.Layout size={14} />
                <span>Dashboard</span>
            </NavLink>
            <NavLink 
                to="/graph" 
                className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2 text-xs font-mono tracking-widest uppercase rounded transition-colors group",
                    isActive ? "bg-zenith-orange text-black font-bold" : "text-zenith-muted hover:text-white hover:bg-zenith-light/20"
                )}
            >
                <Icons.Network size={14} />
                <span>Constellation</span>
            </NavLink>

            {/* Quick Capture Trigger */}
            <button 
                onClick={() => {
                   const event = new KeyboardEvent('keydown', { key: 'n', altKey: true });
                   window.dispatchEvent(event);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono tracking-widest uppercase text-zenith-muted hover:text-white hover:bg-zenith-orange/10 rounded transition-colors group border border-transparent hover:border-zenith-orange/30"
            >
                <div className="flex items-center gap-3">
                    <Icons.Zap size={14} className="text-zenith-orange animate-pulse" />
                    <span>Quick Inject</span>
                </div>
                <span className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity">ALT+N</span>
            </button>
        </div>

        <div className="px-3 py-2 flex items-center justify-between text-[10px] tracking-[0.2em] text-zenith-muted uppercase font-bold border-t border-zenith-border mt-6 mb-2 pt-4">
            <span>Modules</span>
            <button 
                onClick={onSync}
                className={clsx("hover:text-zenith-orange transition-colors", isLoading && "animate-spin")}
            >
                <Icons.RefreshCw size={10} />
            </button>
        </div>

        {repos.map(repo => (
          <div key={repo.id} className="px-3 space-y-0.5">
            <div 
              className={clsx(
                "group flex items-center justify-between px-3 py-2 text-xs font-mono rounded cursor-pointer transition-colors",
                isRepoActive(repo.id) ? "text-zenith-orange bg-zenith-orange/5" : "text-zenith-muted hover:text-white hover:bg-zenith-light/10"
              )}
              onClick={() => toggleRepo(repo.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icons.ChevronRight 
                    size={12} 
                    className={clsx("transition-transform duration-200 shrink-0", expandedRepos[repo.id] && "rotate-90")} 
                />
                <span className="truncate">{repo.name}</span>
              </div>
              <span className="text-[10px] opacity-40 group-hover:opacity-100">{repo.files.length}</span>
            </div>

            <AnimatePresence initial={false}>
              {expandedRepos[repo.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden bg-black/20 ml-2 border-l border-zenith-border"
                >
                  {repo.files.length === 0 ? (
                    <div className="px-6 py-2 text-[10px] text-zenith-muted italic">No records found</div>
                  ) : (
                    repo.files.map(file => (
                      <NavLink
                        key={file.id}
                        to={`/${repo.id}/${file.id}`}
                        className={({ isActive }) => clsx(
                          "block px-6 py-1.5 text-[11px] font-mono transition-colors border-l-2",
                          isActive 
                            ? "border-zenith-orange text-white bg-zenith-orange/10" 
                            : "border-transparent text-zenith-muted hover:text-white hover:border-zenith-light"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                           <Icons.FileText size={10} className="shrink-0" />
                           <span className="truncate">{file.name.replace('.md', '')}</span>
                        </div>
                      </NavLink>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zenith-border bg-zenith-bg/50">
        <div className="text-[9px] font-mono text-zenith-muted uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Uplink Status</span>
            <span className="text-zenith-green">Secure</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center justify-center gap-2 px-2 py-2 bg-zenith-surface border border-zenith-border rounded text-[10px] font-mono hover:bg-white hover:text-black transition-colors uppercase tracking-wider"
            >
                <Icons.Settings size={12} />
            </button>
            <button 
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-2 py-2 bg-zenith-surface border border-zenith-border rounded text-[10px] font-mono hover:bg-white hover:text-black transition-colors uppercase tracking-wider"
            >
                <Icons.Home size={12} />
            </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default LeftSidebar;
