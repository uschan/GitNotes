import { supabase, getAuthenticatedClient, isSupabaseConfigured } from '../lib/supabase';
import { Repository, FileItem } from '../types';
import { INITIAL_REPOS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// --- Types & Mappers ---

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

  addFile: async (repoId: string, name: string, content: string, customDate?: string): Promise<FileItem | null> => {
    const repos = localProvider.getData();
    const repoIndex = repos.findIndex(r => r.id === repoId);
    if (repoIndex === -1) return null;

    const timestamp = customDate ? new Date(customDate).toISOString() : new Date().toISOString();

    const newFile: FileItem = {
      id: uuidv4(),
      name,
      content,
      language: 'markdown',
      size: new Blob([content]).size,
      updatedAt: timestamp
    };

    repos[repoIndex].files.unshift(newFile);
    // Also update repo timestamp to match the latest file if it's newer, 
    // but for pixel art (backdating), we usually don't want to bring the repo to the top of the list if it's old.
    // However, simplicity sake, we update repo timestamp if it's a current action.
    if (!customDate) {
        repos[repoIndex].updatedAt = timestamp;
    }
    
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
  getRepos: async (secretKey: string): Promise<Repository[]> => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.getRepos();

    // Use secretKey as ownerId
    const { data, error } = await client
      .from('repositories')
      .select('*, files(*)')
      .eq('owner_id', secretKey)
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

  createRepo: async (secretKey: string, name: string, description: string, isPrivate: boolean): Promise<Repository | null> => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.createRepo(name, description, isPrivate);

    const { data, error } = await client
      .from('repositories')
      .insert([{ owner_id: secretKey, name, description, is_private: isPrivate }])
      .select()
      .single();

    if (error) throw error;
    return { ...mapRepo(data), files: [] };
  },

  updateRepo: async (secretKey: string, repoId: string, name: string, description: string) => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.updateRepo(repoId, name, description);

    const { error } = await client
      .from('repositories')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', repoId); // RLS will implicitly check owner_id via header
    if (error) throw error;
  },

  deleteRepo: async (secretKey: string, repoId: string) => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.deleteRepo(repoId);

    const { error } = await client.from('repositories').delete().eq('id', repoId);
    if (error) throw error;
  },

  addFile: async (secretKey: string, repoId: string, name: string, content: string, customDate?: string): Promise<FileItem | null> => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.addFile(repoId, name, content, customDate);

    const size = new Blob([content]).size;
    const timestamp = customDate ? new Date(customDate).toISOString() : new Date().toISOString();

    const { data, error } = await client
      .from('files')
      .insert([{ 
        repo_id: repoId, 
        owner_id: secretKey,
        name, 
        content, 
        size,
        updated_at: timestamp 
      }])
      .select()
      .single();

    if (error) throw error;
    
    // We only update the repo's 'updated_at' if this is a NEW file (now), 
    // we don't want backdated pixel art to bring the repo to the top of the list in the dashboard
    if (!customDate) {
        await client.from('repositories').update({ updated_at: new Date().toISOString() }).eq('id', repoId);
    }
    
    return mapFile(data);
  },

  updateFile: async (secretKey: string, fileId: string, content: string) => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.updateFile(fileId, content);

    const size = new Blob([content]).size;
    const { error } = await client
      .from('files')
      .update({ content, size, updated_at: new Date().toISOString() })
      .eq('id', fileId);
    if (error) throw error;
  },

  deleteFile: async (secretKey: string, fileId: string) => {
    const client = getAuthenticatedClient(secretKey);
    if (!client) return localProvider.deleteFile(fileId);

    const { error } = await client.from('files').delete().eq('id', fileId);
    if (error) throw error;
  }
};