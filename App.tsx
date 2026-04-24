import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import FileListPanel from './components/FileListPanel';
import TabBar, { Tab } from './components/TabBar';
import Dashboard from './pages/Dashboard';
import RepositoryView from './pages/RepositoryView';
import FileEditor from './pages/FileEditor';
import GlobalGraph from './pages/GlobalGraph';
import AccessGate from './components/AccessGate';
import SocialBar from './components/SocialBar';
import GlobalSearch from './components/GlobalSearch';
import QuickCapture from './components/QuickCapture';
import SystemSettingsModal from './components/SystemSettingsModal';
import { api } from './services/dataService';
import { Repository } from './types';
import { Icons } from './components/Icon';

type Theme = 'orange' | 'green' | 'blue';

function App() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  
  // Ref to track the art repo ID across async calls/stale closures
  const artRepoIdRef = useRef<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
      return (localStorage.getItem('gitnotes_theme') as Theme) || 'orange';
  });

  const [tabs, setTabs] = useState<Tab[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Manage Tabs based on route
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 2) {
      const [repoId, fileId] = parts;
      const repo = repos.find(r => r.id === repoId);
      const file = repo?.files.find(f => f.id === fileId);
      
      if (file && !tabs.find(t => t.fileId === fileId)) {
        setTabs(prev => [...prev, { repoId, fileId, name: file.name }]);
      }
    }
  }, [location.pathname, repos, tabs]);

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.fileId !== fileId);
    setTabs(newTabs);
    
    // If we closed the active tab, navigate to the last remaining tab or home
    if (location.pathname.includes(fileId)) {
      if (newTabs.length > 0) {
        const lastTab = newTabs[newTabs.length - 1];
        navigate(`/${lastTab.repoId}/${lastTab.fileId}`);
      } else {
        navigate('/');
      }
    }
  };

  // Apply Theme
  useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('gitnotes_theme', theme);
  }, [theme]);
  
  // New Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load Data function
  const loadData = useCallback(async (key: string) => {
      setLoading(true);
      try {
          const data = await api.getRepos(key);
          setRepos(data);
      } catch (e) {
          console.error("Sync failed", e);
      } finally {
          setLoading(false);
      }
  }, []);

  // Sync ref with state when data loads
  useEffect(() => {
      const artRepo = repos.find(r => r.name === 'contribution-art');
      if (artRepo) {
          artRepoIdRef.current = artRepo.id;
      }
  }, [repos]);

  // Initial Auth Check is handled by AccessGate, which calls handleUnlock
  const handleUnlock = (key: string) => {
      setSecretKey(key);
      loadData(key);
  };

  const handleLogout = () => {
      localStorage.removeItem('gitnotes_secret_key');
      setSecretKey(null);
      setRepos([]);
      artRepoIdRef.current = null;
  };

  // Explicit Sync Action for Button
  const handleSync = () => {
      if (secretKey) loadData(secretKey);
  };

  // Global Key Listener for Search & Quick Capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K for Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (secretKey) setIsSearchOpen(true);
      }
      
      // Alt+N for Quick Capture
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        if (secretKey) setIsQuickCaptureOpen(true);
      }

      // Escape to close all modals
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsQuickCaptureOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [secretKey]);

  // Actions wrapped for Supabase
  const handleCreateRepo = async (name: string, description: string, isPrivate: boolean) => {
    if (!secretKey) return null;
    const newRepo = await api.createRepo(secretKey, name, description, isPrivate);
    if (newRepo) {
        setRepos(prev => [newRepo, ...prev]);
        return newRepo.id;
    }
    return null;
  };

  const handleUpdateRepo = async (repoId: string, name: string, description: string) => {
    if (!secretKey) return;
    await api.updateRepo(secretKey, repoId, name, description);
    setRepos(prev => prev.map(r => r.id === repoId ? { ...r, name, description, updatedAt: new Date().toISOString() } : r));
  };

  const handleDeleteRepo = async (repoId: string) => {
      if (!secretKey) return;
      await api.deleteRepo(secretKey, repoId);
      setRepos(prev => prev.filter(r => r.id !== repoId));
      // Clear ref if we deleted the art repo
      if (repoId === artRepoIdRef.current) {
          artRepoIdRef.current = null;
      }
  }

  const handleAddFile = async (repoId: string, filename: string) => {
    if (!secretKey) return;
    const initialContent = `# ${filename.replace('.md', '')}\n\nFile created via Terminal.`;
    const newFile = await api.addFile(secretKey, repoId, filename, initialContent);
    
    if (newFile) {
        setRepos(prev => prev.map(repo => {
            if (repo.id === repoId) {
                return { ...repo, files: [...repo.files, newFile] };
            }
            return repo;
        }));
    }
  };

  const handleQuickSave = async (repoId: string, title: string, content: string) => {
      if (!secretKey) return;
      const newFile = await api.addFile(secretKey, repoId, title, content);
      if (newFile) {
          setRepos(prev => prev.map(repo => {
            if (repo.id === repoId) {
                return { ...repo, files: [newFile, ...repo.files], updatedAt: new Date().toISOString() }; // Add to top
            }
            return repo;
          }));
      }
  }

  const handleUpdateFile = async (repoId: string, fileId: string, newContent: string) => {
    if (!secretKey) return;
    await api.updateFile(secretKey, fileId, newContent);
    setRepos(prev => prev.map(repo => {
        if (repo.id === repoId) {
            return {
                ...repo,
                files: repo.files.map(f => f.id === fileId ? { ...f, content: newContent, updatedAt: new Date().toISOString() } : f)
            }
        }
        return repo;
    }));
  };

  const handleRenameFile = async (repoId: string, fileId: string, newName: string) => {
      if (!secretKey) return;
      
      const repo = repos.find(r => r.id === repoId);
      const file = repo?.files.find(f => f.id === fileId);
      
      if (!repo || !file) return;

      const oldName = file.name;
      const oldLinkName = oldName.replace('.md', '');
      const newLinkName = newName.replace('.md', '');

      // 1. Rename the file itself
      await api.renameFile(secretKey, repoId, fileId, newName);

      // 2. REFACTORING PROTOCOL: Update all other files in the same repo
      // Regex to find [[OldName]] or [[OldName.md]]
      // We escape the old name to prevent regex errors
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
      const linkRegex = new RegExp(`\\[\\[${escapeRegExp(oldLinkName)}(?:\\.md)?\\]\\]`, 'g');

      // Optimistically update state
      setRepos(prev => prev.map(r => {
          if (r.id === repoId) {
             const updatedFiles = r.files.map(f => {
                 // Rename the target file
                 if (f.id === fileId) {
                     return { ...f, name: newName, updatedAt: new Date().toISOString() };
                 }
                 
                 // Refactor links in other files
                 if (linkRegex.test(f.content)) {
                     const newContent = f.content.replace(linkRegex, `[[${newLinkName}]]`);
                     // Fire and forget update for these files to backend
                     api.updateFile(secretKey, f.id, newContent); 
                     return { ...f, content: newContent, updatedAt: new Date().toISOString() };
                 }

                 return f;
             });
             return { ...r, files: updatedFiles, updatedAt: new Date().toISOString() };
          }
          return r;
      }));
  };

  const handleDeleteFile = async (repoId: string, fileId: string) => {
      if (!secretKey) return;
      await api.deleteFile(secretKey, fileId);
      setRepos(prev => prev.map(repo => {
          if (repo.id === repoId) {
              return { ...repo, files: repo.files.filter(f => f.id !== fileId) };
          }
          return repo;
      }));
  }

  const handleImport = (importedRepos: Repository[]) => {
      setRepos(importedRepos);
      // In a real app, you would also sync this to Supabase, 
      // but for now we just update the local state for session persistence.
  };

  // --- Pixel Art Logic ---
  const handlePixelArt = async (date: string) => {
      if (!secretKey) return;

      // 1. Resolve Target Repo ID
      // We use a Ref here because this function is called in a loop (stamp mode)
      // inside ContributionGraph. The closure of this function might have a stale 'repos' state
      // if it was captured before the first repo creation finished.
      // The Ref ensures we always see the ID created in the previous iteration of the loop.
      let targetRepoId = artRepoIdRef.current || repos.find(r => r.name === 'contribution-art')?.id;

      if (!targetRepoId) {
          try {
              // Create hidden repo for art
              const newRepo = await api.createRepo(secretKey, 'contribution-art', 'Automated repository for contribution graph pixel art.', true);
              if (newRepo) {
                  targetRepoId = newRepo.id;
                  artRepoIdRef.current = newRepo.id; // CRITICAL: Update Ref immediately
                  setRepos(prev => [newRepo, ...prev]);
              } else {
                  console.error("Failed to initialize Pixel Art Module.");
                  return;
              }
          } catch (e) {
              console.error("Repo creation failed", e);
              return;
          }
      }

      // 2. Add Dummy File with specific date
      // We append a random ID to allow multiple commits per day (darker colors)
      const dummyName = `pixel-${date}-${Math.floor(Math.random() * 1000)}.md`;
      const dummyContent = `# Pixel Art Entry\n\nAutomated entry for visual data manipulation.\nDate: ${date}`;
      
      const newFile = await api.addFile(secretKey, targetRepoId, dummyName, dummyContent, date);

      if (newFile) {
          // Update local state to reflect change immediately in the graph
          setRepos(prev => prev.map(repo => {
              if (repo.id === targetRepoId) {
                  return { ...repo, files: [newFile, ...repo.files] };
              }
              return repo;
          }));
      }
  };

  // If not authenticated, show the Access Gate
  if (!secretKey) {
      return <AccessGate onUnlock={handleUnlock} />;
  }

  const repoIdInPath = location.pathname.split('/').filter(Boolean)[0];

  return (
    <div className="flex h-screen bg-zenith-bg text-zenith-text font-sans overflow-hidden selection:bg-zenith-orange selection:text-black">
      <LeftSidebar 
          repos={repos} 
          currentRepoId={repoIdInPath || undefined} 
          onCreateRepo={handleCreateRepo}
          onSync={handleSync}
          isLoading={loading}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {repoIdInPath && (
          <FileListPanel 
              repos={repos}
              onAddFile={handleAddFile}
          />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
            secretKey={secretKey}
            onLogoutClick={handleLogout}
            repos={repos}
            toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <TabBar 
            tabs={tabs}
            onCloseTab={handleCloseTab}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Routes>
              <Route 
                path="/" 
                element={
                    <Dashboard 
                        repos={repos} 
                        onCreateRepo={handleCreateRepo} 
                        onQuickSave={handleQuickSave}
                        onSync={handleSync}
                        isLoading={loading}
                        onPixelArt={handlePixelArt}
                    />
                } 
              />
              <Route 
                path="/graph" 
                element={
                    <GlobalGraph 
                        repos={repos} 
                    />
                } 
              />
              <Route 
                path="/:repoId" 
                element={
                    <RepositoryView 
                        repos={repos} 
                        onAddFile={handleAddFile}
                        onDeleteRepo={handleDeleteRepo}
                        onUpdateRepo={handleUpdateRepo}
                        onUpdateFile={handleUpdateFile}
                        isAuthenticated={true} 
                    />
                } 
              />
              <Route 
                path="/:repoId/:fileId" 
                element={
                    <FileEditor 
                        repos={repos} 
                        onUpdateFile={handleUpdateFile}
                        onRenameFile={handleRenameFile} 
                        onDeleteFile={handleDeleteFile}
                        isAuthenticated={true}
                    />
                } 
              />
            </Routes>
        </main>

        {/* Compact Overlay Utility Bar (Theme) */}
        <div className="absolute bottom-6 right-6 flex items-center gap-3 z-30">
          <div className="flex items-center gap-3 bg-zenith-surface/80 backdrop-blur-md border border-zenith-border rounded-full px-3 py-1.5 shadow-xl shadow-black/50">
              <button 
                  onClick={() => setTheme('orange')} 
                  className={`w-2.5 h-2.5 rounded-full bg-[#FF4D00] transition-all ${theme === 'orange' ? 'ring-1 ring-white scale-110' : 'opacity-40 hover:opacity-100'}`}
              ></button>
              <button 
                  onClick={() => setTheme('green')} 
                  className={`w-2.5 h-2.5 rounded-full bg-[#00FF94] transition-all ${theme === 'green' ? 'ring-1 ring-white scale-110' : 'opacity-40 hover:opacity-100'}`}
              ></button>
              <button 
                  onClick={() => setTheme('blue')} 
                  className={`w-2.5 h-2.5 rounded-full bg-[#38BDF8] transition-all ${theme === 'blue' ? 'ring-1 ring-white scale-110' : 'opacity-40 hover:opacity-100'}`}
              ></button>
          </div>
        </div>
      </div>
      
      <GlobalSearch 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          repos={repos}
      />

      <QuickCapture 
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
          repos={repos}
          onQuickSave={handleQuickSave}
          onCreateRepo={handleCreateRepo}
      />

      <SystemSettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          repos={repos}
          onImport={handleImport}
      />
    </div>
  );
}

export default App;