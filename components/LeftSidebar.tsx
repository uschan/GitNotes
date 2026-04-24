import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Repository, FileItem } from '../types';
import { Icons } from './Icon';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface LeftSidebarProps {
  repos: Repository[];
  currentRepoId?: string;
  onCreateRepo: (name: string, description: string) => Promise<string | null>;
  onSync: () => void;
  onQuickCaptureOpen: () => void;
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
  onQuickCaptureOpen,
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
              <div className="w-3.5 h-3.5 bg-zenith-orange shadow-[0_0_10px_rgba(255,87,34,0.3)]"></div>
              <span className="font-mono font-bold text-xs tracking-[0.2em] text-white uppercase">GITNOTES</span>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden text-zenith-muted hover:text-white">
              <Icons.Close size={18} />
            </button>
          )}
        </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Global Access */}
        <div className="px-3 pt-4 pb-1 space-y-0.5">
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zenith-muted hover:text-white hover:bg-white/5 transition-all group"
            >
                <Icons.Search size={14} className="group-hover:text-zenith-orange transition-colors" />
                <span className="text-[12px] font-medium">Global Search</span>
                <span className="ml-auto text-[9px] font-mono opacity-30">⌘K</span>
            </button>

            <button 
                onClick={onQuickCaptureOpen}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zenith-orange bg-zenith-orange/5 border border-zenith-orange/10 hover:bg-zenith-orange/10 transition-all group"
            >
                <Icons.Zap size={14} />
                <span className="text-[12px] font-bold uppercase tracking-wider">Quick Inject</span>
            </button>

            <NavLink to="/" className={({ isActive }) => clsx(
                "flex items-center justify-between px-3 py-2 rounded-md transition-all mt-2",
                isActive ? "bg-white/5 text-white" : "text-zenith-muted hover:text-white hover:bg-white/5"
            )}>
                <div className="flex items-center gap-3">
                    <Icons.Layout size={14} className={isActive ? "text-zenith-orange" : ""} />
                    <span className="text-[12px] font-medium">Dashboard</span>
                </div>
            </NavLink>
        </div>

        {/* Modules Section */}
        <div className="mt-6">
            <div className="px-6 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zenith-muted uppercase tracking-[0.2em]">Modules</span>
                <button onClick={onSync} className={clsx("text-zenith-muted hover:text-zenith-orange transition-colors", isLoading && "animate-spin")}>
                    <Icons.RefreshCw size={10} />
                </button>
            </div>
            
            <div className="space-y-0.5 px-3">
                {repos.map(repo => (
                    <NavLink 
                        key={repo.id}
                        to={`/${repo.id}`}
                        className={({ isActive }) => clsx(
                            "flex items-center justify-between px-3 py-2 rounded-md text-[12px] transition-all group",
                            isActive ? "bg-white/5 text-white font-bold" : "text-zenith-muted hover:text-white hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Icons.Database 
                                size={12} 
                                className={clsx("transition-colors", isRepoActive(repo.id) ? "text-zenith-orange" : "text-zenith-muted opacity-40 group-hover:opacity-100")} 
                            />
                            <span className="truncate">{repo.name}</span>
                        </div>
                        <span className="text-[10px] opacity-30 tabular-nums group-hover:opacity-60">{repo.files.length}</span>
                    </NavLink>
                ))}
            </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-zenith-border bg-[#050505]">
          <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-3 text-zenith-muted">
                  <Icons.Settings size={14} onClick={() => setIsSettingsOpen(true)} className="hover:text-white cursor-pointer transition-colors" />
                  <Icons.Bell size={14} className="hover:text-white cursor-pointer transition-colors" />
              </div>
              <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-zenith-green animate-pulse"></div>
                  <span className="text-[9px] font-mono text-zenith-muted uppercase tracking-widest">Vault Sync</span>
              </div>
          </div>
      </div>
    </aside>
    </>
  );
};

export default LeftSidebar;
