export interface FileItem {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
  language: string;
  size: number;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  updatedAt: string;
  files: FileItem[];
  stars: number;
  language: string;
}

export type ViewMode = 'read' | 'edit';