import React, { useState, useRef } from 'react';
import { Icons } from './Icon';
import { Repository } from '../types';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
  onImport: (repos: Repository[]) => void;
}

const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ isOpen, onClose, repos, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  // Calculate Storage Size
  const jsonString = JSON.stringify(repos);
  const bytes = new Blob([jsonString]).size;
  const megaBytes = (bytes / (1024 * 1024)).toFixed(2);
  const percent = Math.min((bytes / (5 * 1024 * 1024)) * 100, 100).toFixed(1);

  const handleExport = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitnotes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
            // Basic validation
            onImport(parsed);
            onClose();
        } else {
            setImportError('Invalid JSON structure.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[120]">
      <div className="bg-zenith-bg border border-zenith-border w-full max-w-lg p-0 shadow-2xl relative">
        <div className="bg-zenith-surface border-b border-zenith-border p-4 flex justify-between items-center">
            <span className="font-mono text-xs tracking-widest text-zenith-orange uppercase flex items-center gap-2">
                <Icons.Database size={14} />
                System Maintenance
            </span>
            <button onClick={onClose} className="text-zenith-muted hover:text-white transition-colors">
                <Icons.Close size={18}/>
            </button>
        </div>
        
        <div className="p-8 space-y-8">
            
            {/* Storage Status */}
            <div>
                <h4 className="text-white font-bold font-mono text-sm uppercase mb-4 flex items-center gap-2">
                    <Icons.LayoutTemplate size={14} /> Storage Status
                </h4>
                <div className="bg-zenith-surface border border-zenith-border p-4">
                    <div className="flex justify-between text-xs font-mono text-zenith-muted mb-2">
                        <span>Local Storage Usage</span>
                        <span>{megaBytes} MB / 5.00 MB</span>
                    </div>
                    <div className="w-full h-2 bg-black border border-zenith-border">
                        <div 
                            className={`h-full ${Number(percent) > 80 ? 'bg-red-500' : 'bg-zenith-green'}`} 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Backup & Restore */}
            <div>
                <h4 className="text-white font-bold font-mono text-sm uppercase mb-4 flex items-center gap-2">
                    <Icons.Save size={14} /> Data Management
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleExport}
                        className="flex flex-col items-center justify-center gap-2 p-6 border border-zenith-border hover:border-zenith-orange hover:bg-zenith-surface transition-all group"
                    >
                        <Icons.Download size={24} className="text-zenith-muted group-hover:text-zenith-orange" />
                        <span className="font-mono text-xs uppercase tracking-widest text-zenith-text">Export Backup</span>
                    </button>

                    <button 
                         onClick={handleImportClick}
                        className="flex flex-col items-center justify-center gap-2 p-6 border border-zenith-border hover:border-white hover:bg-zenith-surface transition-all group"
                    >
                        <Icons.Upload size={24} className="text-zenith-muted group-hover:text-white" />
                        <span className="font-mono text-xs uppercase tracking-widest text-zenith-text">Restore Data</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json"
                        onChange={handleFileChange}
                    />
                </div>
                {importError && (
                    <div className="mt-4 p-2 border border-red-500/50 bg-red-500/10 text-red-500 text-xs font-mono text-center">
                        ERROR: {importError}
                    </div>
                )}
            </div>

            <div className="text-[10px] text-zenith-muted font-mono leading-relaxed border-t border-zenith-border pt-4">
                NOTE: Data is stored exclusively in your browser (LocalStorage). Exporting backups regularly is recommended to prevent data loss.
            </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModal;