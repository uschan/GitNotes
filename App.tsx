import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RepositoryView from './pages/RepositoryView';
import FileEditor from './pages/FileEditor';
import AccessGate from './components/AccessGate';
import SocialBar from './components/SocialBar';
import GlobalSearch from './components/GlobalSearch';
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

  // Apply Theme
  useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('gitnotes_theme', theme);
  }, [theme]);
  
  // New Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Global Key Listener for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (secretKey) setIsSearchOpen(true);
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

  return (
    <Router>
      <div className="min-h-screen bg-zenith-bg text-zenith-text font-sans selection:bg-zenith-orange selection:text-black">
        <Header 
            secretKey={secretKey}
            onLogoutClick={handleLogout}
        />
        
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

        <footer className="mt-20 py-12 border-t border-zenith-border flex flex-col items-center gap-6 bg-zenith-bg/50">
            <SocialBar />

            {/* Theme Switcher */}
            <div className="flex items-center gap-4 bg-zenith-surface border border-zenith-border rounded-full px-4 py-2">
                <button 
                    onClick={() => setTheme('orange')} 
                    className={`w-3 h-3 rounded-full bg-[#FF4D00] transition-all duration-300 ${theme === 'orange' ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_#FF4D00]' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                    title="Zenith Orange"
                ></button>
                <button 
                    onClick={() => setTheme('green')} 
                    className={`w-3 h-3 rounded-full bg-[#00FF94] transition-all duration-300 ${theme === 'green' ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_#00FF94]' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                    title="Matrix Green"
                ></button>
                <button 
                    onClick={() => setTheme('blue')} 
                    className={`w-3 h-3 rounded-full bg-[#38BDF8] transition-all duration-300 ${theme === 'blue' ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_#38BDF8]' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                    title="Holo Blue"
                ></button>
            </div>
            
            <div className="text-[10px] tracking-widest text-zenith-muted font-mono uppercase flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-zenith-green">WildSalt.Lab</span>
                <span className="w-px h-3 bg-zenith-muted"></span>
                <button onClick={() => setIsSearchOpen(true)} className="hover:text-white flex items-center gap-1"><Icons.Command size={10}/> CMD+K</button>
                <span className="w-px h-3 bg-zenith-muted"></span>
                <span className="">Ver: 3.1.0</span>
            </div>
        </footer>
        
        <GlobalSearch 
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            repos={repos}
        />
      </div>
    </Router>
  );
}

export default App;