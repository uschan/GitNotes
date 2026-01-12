import React from 'react';
import { Icons } from './Icon';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
}

const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmText = "Execute"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[150] animate-in fade-in duration-200">
      <div className="bg-zenith-bg border border-zenith-orange w-full max-w-md p-0 shadow-[0_0_30px_rgba(255,77,0,0.15)] relative">
        {/* Tech Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-zenith-orange"></div>
        <div className="absolute top-0 right-0 w-2 h-2 bg-zenith-orange"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-zenith-orange"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-zenith-orange"></div>

        <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-zenith-orange/10 border border-zenith-orange text-zenith-orange rounded-none">
                    <Icons.Zap size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase">{title}</h3>
                    <div className="h-0.5 w-12 bg-zenith-orange mt-2 mb-1"></div>
                </div>
            </div>

            <div className="bg-zenith-surface border border-zenith-border p-4 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-zenith-orange/50"></div>
                <p className="text-zenith-text text-sm font-mono leading-relaxed pl-2">
                    {description}
                </p>
            </div>

            <div className="flex gap-4 justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 border border-zenith-border text-zenith-muted font-mono text-xs uppercase tracking-widest hover:text-white hover:border-white transition-colors"
                >
                    Abort
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className="px-6 py-2 bg-zenith-orange text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_15px_rgba(255,77,0,0.4)] flex items-center gap-2"
                >
                    <Icons.Check size={14} />
                    {confirmText}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmModal;