import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RepositoryView from './pages/RepositoryView';
import FileEditor from './pages/FileEditor';
import LoginModal from './components/LoginModal';
import SocialBar from './components/SocialBar';
import { loadRepositories, saveRepositories } from './services/storage';
import { Repository } from './types';

const ADMIN_PASSWORD = 'wildsalt3980';

function App() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const data = loadRepositories();
    setRepos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveRepositories(repos);
    }
  }, [repos, loading]);

  const handleLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        return true;
    }
    return false;
  };

  const handleCreateRepo = (name: string, description: string, isPrivate: boolean) => {
    if (!isAuthenticated) return;
    const newRepo: Repository = {
      id: `repo-${uuidv4()}`,
      name,
      description,
      isPrivate,
      updatedAt: new Date().toISOString(),
      stars: 0,
      language: 'MARKDOWN',
      files: [{
        id: `file-${uuidv4()}`,
        name: 'README.md',
        content: `# ${name}\n\n${description}`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 0
      }]
    };
    setRepos([newRepo, ...repos]);
  };

  const handleUpdateRepo = (repoId: string, name: string, description: string) => {
    if (!isAuthenticated) return;
    setRepos(prevRepos => prevRepos.map(repo => {
        if (repo.id === repoId) {
            return {
                ...repo,
                name,
                description,
                updatedAt: new Date().toISOString()
            };
        }
        return repo;
    }));
  };

  const handleAddFile = (repoId: string, filename: string) => {
    if (!isAuthenticated) return;
    setRepos(prevRepos => prevRepos.map(repo => {
      if (repo.id === repoId) {
        return {
          ...repo,
          updatedAt: new Date().toISOString(),
          files: [...repo.files, {
            id: `file-${uuidv4()}`,
            name: filename,
            content: `# ${filename.replace('.md', '')}\n\nNew file created.`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 0
          }]
        };
      }
      return repo;
    }));
  };

  const handleUpdateFile = (repoId: string, fileId: string, newContent: string) => {
    if (!isAuthenticated) return;
    setRepos(prevRepos => prevRepos.map(repo => {
        if (repo.id === repoId) {
            return {
                ...repo,
                updatedAt: new Date().toISOString(),
                files: repo.files.map(file => {
                    if (file.id === fileId) {
                        return {
                            ...file,
                            content: newContent,
                            updatedAt: new Date().toISOString(),
                            size: new Blob([newContent]).size
                        };
                    }
                    return file;
                })
            }
        }
        return repo;
    }));
  };

  const handleDeleteFile = (repoId: string, fileId: string) => {
      if (!isAuthenticated) return;
      setRepos(prevRepos => prevRepos.map(repo => {
          if (repo.id === repoId) {
              return {
                  ...repo,
                  updatedAt: new Date().toISOString(),
                  files: repo.files.filter(f => f.id !== fileId)
              };
          }
          return repo;
      }));
  }

  const handleDeleteRepo = (repoId: string) => {
      if (!isAuthenticated) return;
      setRepos(prevRepos => prevRepos.filter(r => r.id !== repoId));
  }

  if (loading) {
      return <div className="h-screen bg-zenith-bg text-zenith-text flex items-center justify-center font-mono tracking-widest text-xs">INITIALIZING SYSTEM...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-zenith-bg text-zenith-text font-sans selection:bg-zenith-orange selection:text-black">
        <Header 
            isAuthenticated={isAuthenticated} 
            onLoginClick={() => setIsLoginModalOpen(true)}
            onLogoutClick={() => setIsAuthenticated(false)}
        />
        
        <Routes>
          <Route 
            path="/" 
            element={
                <Dashboard 
                    repos={repos} 
                    onCreateRepo={handleCreateRepo} 
                    isAuthenticated={isAuthenticated}
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
                    isAuthenticated={isAuthenticated}
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
                    isAuthenticated={isAuthenticated}
                />
            } 
          />
        </Routes>

        <footer className="mt-20 py-12 border-t border-zenith-border flex flex-col items-center gap-8 bg-zenith-bg/50">
            <SocialBar />
            
            <div className="text-[10px] tracking-widest text-zenith-muted font-mono uppercase flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
                <span className="">System Status: <span className={isAuthenticated ? "text-zenith-orange" : "text-white"}>{isAuthenticated ? 'Admin' : 'Guest'}</span></span>
                <span className="w-px h-3 bg-zenith-muted"></span>
                <span className="">Encrypted: Local</span>
                <span className="w-px h-3 bg-zenith-muted"></span>
                <span className="">Ver: 2.5.0 (Optimized)</span>
            </div>
        </footer>

        <LoginModal 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)}
            onLogin={handleLogin}
        />
      </div>
    </Router>
  );
}

export default App;