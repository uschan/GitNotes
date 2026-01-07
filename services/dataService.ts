import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Repository, FileItem } from '../types';
import { INITIAL_REPOS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// --- Types & Mappers ---

// Helper to map DB snake_case to App camelCase
const mapRepo = (r: any): Repository => ({
  id: r.id,
  name: r.name,
  description: r.description,
  isPrivate: r.is_private,
  updatedAt: r.updated_at,
  stars: r.stars,
  language: r.language,
  files: r.files ? r.files.map(mapFile) : []
});

const mapFile = (f: any): FileItem => ({
  id: f.id,
  name: f.name,
  content: f.content,
  language: f.language,
  size: f.size,
  updatedAt: f.updated_at
});

// --- LocalStorage Fallback Implementation ---
const LOCAL_KEY = 'gitnotes_offline_v2';

const localProvider = {
  getData: (): Repository[] => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (!stored) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(INITIAL_REPOS));
        return INITIAL_REPOS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_REPOS;
    }
  },
  
  saveData: (data: Repository[]) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  },

  getRepos: async (): Promise<Repository[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));
    return localProvider.getData();
  },

  createRepo: async (name: string, description: string, isPrivate: boolean): Promise<Repository> => {
    const repos = localProvider.getData();
    const newRepo: Repository = {
      id: uuidv4(),
      name,
      description,
      isPrivate,
      updatedAt: new Date().toISOString(),
      stars: 0,
      language: 'Markdown',
      files: []
    };
    localProvider.saveData([newRepo, ...repos]);
    return newRepo;
  },

  updateRepo: async (repoId: string, name: string, description: string) => {
    const repos = localProvider.getData();
    const updated = repos.map(r => r.id === repoId ? { ...r, name, description, updatedAt: new Date().toISOString() } : r);
    localProvider.saveData(updated);
  },

  deleteRepo: async (repoId: string) => {
    const repos = localProvider.getData();
    localProvider.saveData(repos.filter(r => r.id !== repoId));
  },

  addFile: async (repoId: string, name: string, content: string): Promise<FileItem | null> => {
    const repos = localProvider.getData();
    const repoIndex = repos.findIndex(r => r.id === repoId);
    if (repoIndex === -1) return null;

    const newFile: FileItem = {
      id: uuidv4(),
      name,
      content,
      language: 'markdown',
      size: new Blob([content]).size,
      updatedAt: new Date().toISOString()
    };

    repos[repoIndex].files.unshift(newFile); // Add to top
    repos[repoIndex].updatedAt = new Date().toISOString();
    localProvider.saveData(repos);
    return newFile;
  },

  updateFile: async (fileId: string, content: string) => {
    const repos = localProvider.getData();
    let found = false;
    
    const updatedRepos = repos.map(repo => {
      const fileIndex = repo.files.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        repo.files[fileIndex] = {
          ...repo.files[fileIndex],
          content,
          size: new Blob([content]).size,
          updatedAt: new Date().toISOString()
        };
        repo.updatedAt = new Date().toISOString();
        found = true;
      }
      return repo;
    });

    if (found) localProvider.saveData(updatedRepos);
  },

  deleteFile: async (fileId: string) => {
    const repos = localProvider.getData();
    const updatedRepos = repos.map(repo => ({
      ...repo,
      files: repo.files.filter(f => f.id !== fileId)
    }));
    localProvider.saveData(updatedRepos);
  }
};


// --- Public API ---

export const api = {
  getRepos: async (ownerId: string): Promise<Repository[]> => {
    if (!isSupabaseConfigured || !supabase) return localProvider.getRepos();

    const { data, error } = await supabase
      .from('repositories')
      .select('*, files(*)')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching repos:', error);
      throw error;
    }
    
    const repos = data.map(mapRepo);
    repos.forEach(r => {
        r.files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    
    return repos;
  },

  createRepo: async (ownerId: string, name: string, description: string, isPrivate: boolean): Promise<Repository | null> => {
    if (!isSupabaseConfigured || !supabase) return localProvider.createRepo(name, description, isPrivate);

    const { data, error } = await supabase
      .from('repositories')
      .insert([{ owner_id: ownerId, name, description, is_private: isPrivate }])
      .select()
      .single();

    if (error) throw error;
    return { ...mapRepo(data), files: [] };
  },

  updateRepo: async (repoId: string, name: string, description: string) => {
    if (!isSupabaseConfigured || !supabase) return localProvider.updateRepo(repoId, name, description);

    const { error } = await supabase
      .from('repositories')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', repoId);
    if (error) throw error;
  },

  deleteRepo: async (repoId: string) => {
    if (!isSupabaseConfigured || !supabase) return localProvider.deleteRepo(repoId);

    const { error } = await supabase.from('repositories').delete().eq('id', repoId);
    if (error) throw error;
  },

  addFile: async (ownerId: string, repoId: string, name: string, content: string): Promise<FileItem | null> => {
    if (!isSupabaseConfigured || !supabase) return localProvider.addFile(repoId, name, content);

    const size = new Blob([content]).size;
    const { data, error } = await supabase
      .from('files')
      .insert([{ 
        repo_id: repoId, 
        owner_id: ownerId,
        name, 
        content, 
        size 
      }])
      .select()
      .single();

    if (error) throw error;
    
    await supabase.from('repositories').update({ updated_at: new Date().toISOString() }).eq('id', repoId);
    return mapFile(data);
  },

  updateFile: async (fileId: string, content: string) => {
    if (!isSupabaseConfigured || !supabase) return localProvider.updateFile(fileId, content);

    const size = new Blob([content]).size;
    const { error } = await supabase
      .from('files')
      .update({ content, size, updated_at: new Date().toISOString() })
      .eq('id', fileId);
    if (error) throw error;
  },

  deleteFile: async (fileId: string) => {
    if (!isSupabaseConfigured || !supabase) return localProvider.deleteFile(fileId);

    const { error } = await supabase.from('files').delete().eq('id', fileId);
    if (error) throw error;
  }
};