import React from 'react';
import { Icons } from './Icon';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  warningText?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  itemName,
  warningText = "This action cannot be undone. Data will be permanently lost."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[110]">
      <div className="bg-zenith-bg border border-zenith-orange w-full max-w-md p-0 shadow-[0_0_50px_rgba(255,77,0,0.2)] relative">
        {/* Danger Stripes */}
        <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#FF4D00,#FF4D00_10px,#000_10px,#000_20px)] opacity-50"></div>

        <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-zenith-orange/10 border border-zenith-orange text-zenith-orange rounded-none">
                    <Icons.Alert size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase">{title}</h3>
                    <p className="font-mono text-zenith-orange text-xs mt-1 tracking-widest uppercase">Target: {itemName}</p>
                </div>
            </div>

            <div className="bg-zenith-surface border border-zenith-border p-4 mb-8">
                <p className="text-zenith-muted text-sm font-mono leading-relaxed">
                    WARNING: {warningText}
                </p>
            </div>

            <div className="flex gap-4 justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 border border-zenith-border text-zenith-muted font-mono text-xs uppercase tracking-widest hover:text-white hover:border-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className="px-6 py-2 bg-zenith-orange text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-white transition-colors"
                >
                    Confirm Deletion
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;