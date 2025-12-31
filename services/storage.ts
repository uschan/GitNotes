import { Repository } from '../types';
import { INITIAL_REPOS } from '../constants';

const STORAGE_KEY = 'gitnotes_data_v1';

export const loadRepositories = (): Repository[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // Initialize if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPOS));
    return INITIAL_REPOS;
  } catch (error) {
    console.error('Failed to load repositories', error);
    return INITIAL_REPOS;
  }
};

export const saveRepositories = (repos: Repository[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
  } catch (error) {
    console.error('Failed to save repositories', error);
  }
};