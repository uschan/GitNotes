import React, { useState, useEffect, useCallback } from 'react';
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

function App() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  
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

  // Initial Auth Check is handled by AccessGate, which calls handleUnlock
  const handleUnlock = (key: string) => {
      setSecretKey(key);
      loadData(key);
  };

  const handleLogout = () => {
      localStorage.removeItem('gitnotes_secret_key');
      setSecretKey(null);
      setRepos([]);
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
    await api.updateRepo(repoId, name, description);
    setRepos(prev => prev.map(r => r.id === repoId ? { ...r, name, description, updatedAt: new Date().toISOString() } : r));
  };

  const handleDeleteRepo = async (repoId: string) => {
      if (!secretKey) return;
      await api.deleteRepo(repoId);
      setRepos(prev => prev.filter(r => r.id !== repoId));
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
    await api.updateFile(fileId, newContent);
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

  const handleDeleteFile = async (repoId: string, fileId: string) => {
      if (!secretKey) return;
      await api.deleteFile(fileId);
      setRepos(prev => prev.map(repo => {
          if (repo.id === repoId) {
              return { ...repo, files: repo.files.filter(f => f.id !== fileId) };
          }
          return repo;
      }));
  }

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
                    isAuthenticated={true} // Always true once Key entered
                />
            } 
          />
          <Route 
            path="/:repoId/:fileId" 
            element={
                <FileEditor 
                    repos={repos} 
                    onUpdateFile={handleUpdateFile} 
                    onDeleteFile={handleDeleteFile}
                    isAuthenticated={true}
                />
            } 
          />
        </Routes>

        <footer className="mt-20 py-12 border-t border-zenith-border flex flex-col items-center gap-8 bg-zenith-bg/50">
            <SocialBar />
            
            <div className="text-[10px] tracking-widest text-zenith-muted font-mono uppercase flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-zenith-green">Produced by WildSalt.Lab</span>
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