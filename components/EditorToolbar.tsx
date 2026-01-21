import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icon';

interface EditorToolbarProps {
  onInsert: (prefix: string, suffix?: string) => void;
  onLinkNote?: () => void;
}

interface ActiveTooltip {
  label: string;
  shortcut?: string;
  x: number;
  y: number;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert, onLinkNote }) => {
  const [tooltip, setTooltip] = useState<ActiveTooltip | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, label: string, shortcut?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      shortcut,
      x: rect.left + rect.width / 2, 
      y: rect.bottom + 8 
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const ToolButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    shortcut 
  }: { 
    icon: any, 
    label: string, 
    onClick: () => void,
    shortcut?: string 
  }) => (
    <button
      onClick={onClick}
      onMouseEnter={(e) => handleMouseEnter(e, label, shortcut)}
      onMouseLeave={handleMouseLeave}
      className="group p-2 text-zenith-muted hover:text-white hover:bg-zenith-light/20 rounded-sm transition-colors flex items-center justify-center relative"
    >
      <Icon size={16} />
    </button>
  );

  const Separator = () => <div className="w-px h-5 bg-zenith-border/50 mx-1"></div>;

  return (
    <>
      {/* Toolbar Container */}
      <div className="h-12 bg-zenith-surface border-b border-zenith-border flex items-center px-4 gap-1 overflow-x-auto shrink-0 select-none relative z-20 no-scrollbar">
        
        {/* Typography Group */}
        <ToolButton icon={Icons.Heading} label="Header 1" onClick={() => onInsert('# ')} />
        <ToolButton icon={Icons.Bold} label="Header 2" onClick={() => onInsert('## ')} shortcut="H2" />
        <button 
           onClick={() => onInsert('### ')} 
           onMouseEnter={(e) => handleMouseEnter(e, 'Header 3')}
           onMouseLeave={handleMouseLeave}
           className="p-2 text-zenith-muted hover:text-white hover:bg-zenith-light/20 rounded-sm text-xs font-bold font-mono"
        >
           H3
        </button>
        
        <Separator />

        {/* Formatting Group */}
        <ToolButton icon={Icons.Bold} label="Bold" onClick={() => onInsert('**', '**')} shortcut="B" />
        <ToolButton icon={Icons.Italic} label="Italic" onClick={() => onInsert('*', '*')} shortcut="I" />
        <ToolButton icon={Icons.Quote} label="Quote" onClick={() => onInsert('> ')} />
        
        <Separator />

        {/* List Group */}
        <ToolButton icon={Icons.List} label="Bullet List" onClick={() => onInsert('- ')} />
        <ToolButton icon={Icons.Check} label="Task List" onClick={() => onInsert('- [ ] ')} />
        
        <Separator />
        
        {/* Insert Group */}
        <ToolButton icon={Icons.Code} label="Code Block" onClick={() => onInsert('```\n', '\n```')} />
        <ToolButton icon={Icons.Link} label="Web Link" onClick={() => onInsert('[', '](url)')} />
        <ToolButton icon={Icons.File} label="Link Note" onClick={() => onLinkNote && onLinkNote()} shortcut="[[" />
        <ToolButton icon={Icons.Image} label="Image" onClick={() => onInsert('![Alt Text](', ')')} />
        
        <Separator />
        
        {/* Structure Group */}
        <ToolButton icon={Icons.Layout} label="Table" onClick={() => onInsert('| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |')} />
        <button 
            onClick={() => onInsert('\n---\n')} 
            onMouseEnter={(e) => handleMouseEnter(e, 'Divider')}
            onMouseLeave={handleMouseLeave}
            className="p-2 text-zenith-muted hover:text-white hover:bg-zenith-light/20 rounded-sm flex items-center justify-center"
        >
            <div className="w-4 h-px bg-current"></div>
        </button>

      </div>

      {/* PORTAL RENDER: Injects tooltip into body to escape all clipping contexts */}
      {tooltip && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none flex flex-col items-center"
            style={{ 
                left: tooltip.x, 
                top: tooltip.y,
                transform: 'translateX(-50%)'
            }}
        >
             {/* Arrow */}
             <div className="w-2 h-2 bg-black border-l border-t border-zenith-border rotate-45 mb-[-4px] relative z-10"></div>
             {/* Content */}
             <div className="bg-black border border-zenith-border text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)] whitespace-nowrap">
                {tooltip.label} {tooltip.shortcut && <span className="text-zenith-orange ml-1">[{tooltip.shortcut}]</span>}
             </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default EditorToolbar;