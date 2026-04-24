import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icon';

interface EditorToolbarProps {
  onInsert: (prefix: string, suffix?: string) => void;
  onLinkNote?: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert, onLinkNote }) => {
  const [tooltip, setTooltip] = useState<{ label: string, x: number, y: number } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, label: string) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  };

  const ToolButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      onMouseEnter={(e) => handleMouseEnter(e, label)}
      onMouseLeave={() => setTooltip(null)}
      className="shrink-0 p-3 text-zenith-muted hover:text-white hover:bg-white/5 rounded-sm transition-all flex items-center justify-center"
    >
      <Icon size={16} />
    </button>
  );

  return (
    <>
      <div className="h-12 bg-zenith-surface border-b border-zenith-border flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0 select-none">
        <div className="text-[9px] font-mono text-zenith-muted uppercase tracking-[0.2em] mr-2 opacity-50 hidden sm:block">Construct</div>
        
        <ToolButton icon={Icons.File} label="Link Note" onClick={() => onLinkNote && onLinkNote()} />
        <ToolButton icon={Icons.Link} label="Web Link" onClick={() => onInsert('[', '](url)')} />
        <ToolButton icon={Icons.Image} label="Image" onClick={() => onInsert('![Alt Text](', ')')} />
        <ToolButton icon={Icons.Layout} label="Generate Table" onClick={() => onInsert('| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |')} />
        
        <div className="ml-auto flex items-center gap-4">
             <div className="text-[9px] font-mono text-zenith-muted uppercase tracking-tighter opacity-40 hidden md:block">Syntax: MDX 2.0</div>
        </div>
      </div>

      {tooltip && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none flex flex-col items-center"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
        >
             <div className="w-2 h-2 bg-black border-l border-t border-zenith-border rotate-45 mb-[-4px]"></div>
             <div className="bg-black border border-zenith-border text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 shadow-2xl">
                {tooltip.label}
             </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default EditorToolbar;
