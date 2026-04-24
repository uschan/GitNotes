import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icon';
import { clsx } from 'clsx';

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
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent, label: string, shortcut?: string) => {
    // Only show tooltips on desktop
    if (window.innerWidth < 768) return;
    
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
    shortcut,
    className
  }: { 
    icon?: any, 
    label: string, 
    onClick: () => void,
    shortcut?: string,
    className?: string
  }) => (
    <button
      onClick={(e) => {
          onClick();
          setIsMoreOpen(false);
      }}
      onMouseEnter={(e) => handleMouseEnter(e, label, shortcut)}
      onMouseLeave={handleMouseLeave}
      className={clsx(
          "group p-2 text-zenith-muted hover:text-white hover:bg-zenith-light/20 rounded-sm transition-colors flex items-center justify-center relative",
          className
      )}
      title={window.innerWidth < 768 ? label : undefined}
    >
      {Icon ? <Icon size={16} /> : <span className="text-xs font-bold font-mono uppercase">{label.includes('Header') ? `H${label.split(' ')[1]}` : label}</span>}
    </button>
  );

  const Separator = ({ className }: { className?: string }) => <div className={clsx("w-px h-5 bg-zenith-border/50 mx-1", className)}></div>;

  return (
    <>
      {/* Toolbar Container */}
      <div className="h-12 bg-zenith-surface border-b border-zenith-border flex items-center px-4 gap-1 overflow-x-auto shrink-0 select-none relative z-20 no-scrollbar">
        
        {/* Core Tools (Always Visible) */}
        <ToolButton icon={Icons.Bold} label="Bold" onClick={() => onInsert('**', '**')} shortcut="B" />
        <ToolButton icon={Icons.Italic} label="Italic" onClick={() => onInsert('*', '*')} shortcut="I" />
        <ToolButton icon={Icons.File} label="Link Note" onClick={() => onLinkNote && onLinkNote()} shortcut="[[" />
        <Separator />
        <ToolButton icon={Icons.List} label="List" onClick={() => onInsert('- ')} />
        <ToolButton icon={Icons.Code} label="Code" onClick={() => onInsert('```\n', '\n```')} />
        
        <Separator className="hidden sm:block" />

        {/* Extended Tools (Hidden on small mobile, shown via "More") */}
        <div className="hidden sm:flex items-center gap-1">
            <ToolButton icon={Icons.Heading} label="Header 1" onClick={() => onInsert('# ')} />
            <ToolButton label="H2" onClick={() => onInsert('## ')} />
            <ToolButton label="H3" onClick={() => onInsert('### ')} />
            <Separator />
            <ToolButton icon={Icons.Quote} label="Quote" onClick={() => onInsert('> ')} />
            <ToolButton icon={Icons.Link} label="Web Link" onClick={() => onInsert('[', '](url)')} />
            <ToolButton icon={Icons.Image} label="Image" onClick={() => onInsert('![Alt Text](', ')')} />
            <ToolButton icon={Icons.Layout} label="Table" onClick={() => onInsert('| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |')} />
        </div>

        {/* Mobile "More" Button */}
        <div className="sm:hidden relative ml-auto">
            <button 
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={clsx(
                    "p-2 transition-colors",
                    isMoreOpen ? "text-zenith-orange" : "text-zenith-muted hover:text-white"
                )}
            >
                <Icons.MoreHorizontal size={20} />
            </button>

            {isMoreOpen && (
                <div className="absolute right-0 top-10 w-48 bg-zenith-surface border border-zenith-border shadow-2xl p-2 grid grid-cols-4 gap-1 z-[100] animate-in slide-in-from-top-2 duration-200">
                    <ToolButton icon={Icons.Heading} label="H1" onClick={() => onInsert('# ')} />
                    <ToolButton label="H2" onClick={() => onInsert('## ')} />
                    <ToolButton label="H3" onClick={() => onInsert('### ')} />
                    <ToolButton icon={Icons.Quote} label="Quote" onClick={() => onInsert('> ')} />
                    <ToolButton icon={Icons.Check} label="Task" onClick={() => onInsert('- [ ] ')} />
                    <ToolButton icon={Icons.Link} label="Link" onClick={() => onInsert('[', '](url)')} />
                    <ToolButton icon={Icons.Image} label="Image" onClick={() => onInsert('![Alt Text](', ')')} />
                    <ToolButton icon={Icons.Layout} label="Table" onClick={() => onInsert('| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |')} />
                </div>
            )}
        </div>

      </div>

      {/* Tooltip Portal */}
      {tooltip && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none flex flex-col items-center"
            style={{ 
                left: tooltip.x, 
                top: tooltip.y,
                transform: 'translateX(-50%)'
            }}
        >
             <div className="w-2 h-2 bg-black border-l border-t border-zenith-border rotate-45 mb-[-4px] relative z-10"></div>
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
