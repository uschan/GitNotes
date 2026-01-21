import React from 'react';
import { Icons } from '../Icon';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="hidden xl:flex w-72 flex-col border-l border-zenith-border bg-zenith-bg/50 backdrop-blur-sm">
        <div className="p-4 border-b border-zenith-border font-mono text-[10px] tracking-widest text-zenith-muted uppercase flex items-center gap-2">
            <Icons.List size={12} />
            <span>Document Outline</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {items.map((item, idx) => (
                <a 
                    key={`${item.id}-${idx}`}
                    href={`#${item.id}`}
                    onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`
                        block text-xs font-mono py-1.5 transition-colors duration-200 border-l-2 border-transparent hover:border-zenith-orange pl-3
                        ${item.level === 1 ? 'text-white font-bold' : 'text-zenith-muted hover:text-zenith-text'}
                        ${item.level === 2 ? 'ml-2' : ''}
                        ${item.level === 3 ? 'ml-4' : ''}
                    `}
                >
                    {item.text}
                </a>
            ))}
        </div>
    </div>
  );
};

export default TableOfContents;