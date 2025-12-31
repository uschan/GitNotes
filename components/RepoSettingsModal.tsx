import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';

interface RepoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  initialName: string;
  initialDesc: string;
}

const RepoSettingsModal: React.FC<RepoSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialName, 
  initialDesc 
}) => {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDesc);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDesc(initialDesc);
    }
  }, [isOpen, initialName, initialDesc]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, desc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-zenith-bg border border-zenith-border w-full max-w-lg p-0 shadow-2xl relative">
        <div className="bg-zenith-surface border-b border-zenith-border p-4 flex justify-between items-center">
            <span className="font-mono text-xs tracking-widest text-zenith-orange uppercase flex items-center gap-2">
                <Icons.Settings size={14} />
                Module Configuration
            </span>
            <button onClick={onClose} className="text-zenith-muted hover:text-white transition-colors">
                <Icons.Close size={18}/>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block font-mono text-[10px] tracking-widest text-zenith-muted uppercase">Module Designation</label>
            <input 
              autoFocus
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-black border border-zenith-border p-3 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-mono text-[10px] tracking-widest text-zenith-muted uppercase">Mission Brief</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-black border border-zenith-border p-3 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none transition-colors h-24 resize-none"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-4">
             <button 
                type="button"
                onClick={onClose}
                className="text-zenith-muted font-mono text-xs uppercase tracking-widest hover:text-white"
            >
                Cancel
            </button>
            <button type="submit" className="bg-zenith-orange text-black px-6 py-2 text-sm font-bold tracking-widest uppercase hover:bg-white transition-colors duration-75">
              Update Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepoSettingsModal;