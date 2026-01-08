import React from 'react';
import { Icons } from './Icon';

interface EditorToolbarProps {
  onInsert: (prefix: string, suffix?: string) => void;
  onLinkNote?: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert, onLinkNote }) => {
  const tools = [
    { icon: Icons.Bold, label: 'Bold', action: () => onInsert('**', '**') },
    { icon: Icons.Italic, label: 'Italic', action: () => onInsert('*', '*') },
    { icon: Icons.Heading, label: 'Heading', action: () => onInsert('## ') },
    { icon: Icons.Quote, label: 'Quote', action: () => onInsert('> ') },
    { icon: Icons.List, label: 'List', action: () => onInsert('- ') },
    { icon: Icons.Code, label: 'Code', action: () => onInsert('```\n', '\n```') },
    { icon: Icons.Link, label: 'Link URL', action: () => onInsert('[', '](url)') },
    { icon: Icons.File, label: 'Link Note', action: () => onLinkNote && onLinkNote() }, // New Button
    { icon: Icons.Check, label: 'Task', action: () => onInsert('- [ ] ') },
  ];

  return (
    <div className="h-10 bg-zenith-surface border-b border-zenith-border flex items-center px-2 gap-1 overflow-x-auto">
      {tools.map((tool, idx) => (
        <button
          key={idx}
          onClick={tool.action}
          className="p-1.5 text-zenith-muted hover:text-white hover:bg-zenith-light/20 rounded transition-colors"
          title={tool.label}
        >
          <tool.icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default EditorToolbar;