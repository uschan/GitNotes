import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from './Icon';
import { clsx } from 'clsx';

export interface Tab {
  repoId: string;
  fileId: string;
  name: string;
}

interface TabBarProps {
  tabs: Tab[];
  onCloseTab: (e: React.MouseEvent, fileId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, onCloseTab }) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-zenith-bg border-b border-zenith-border overflow-x-auto custom-scrollbar no-scrollbar">
      {tabs.map((tab) => (
        <NavLink
            key={tab.fileId}
            to={`/${tab.repoId}/${tab.fileId}`}
            className={({ isActive }) => clsx(
                "group flex items-center h-10 px-4 border-r border-zenith-border text-[11px] font-mono tracking-widest uppercase transition-all shrink-0 min-w-[120px] max-w-[200px]",
                isActive 
                    ? "bg-zenith-surface text-zenith-orange border-b-2 border-b-zenith-orange" 
                    : "text-zenith-muted hover:text-white hover:bg-zenith-surface/50"
            )}
        >
            <div className="flex items-center gap-2 truncate flex-1">
                <Icons.FileText size={10} className="shrink-0" />
                <span className="truncate">{tab.name.replace('.md', '')}</span>
            </div>
            <button 
                onClick={(e) => onCloseTab(e, tab.fileId)}
                className="ml-2 p-0.5 rounded hover:bg-zenith-border text-zenith-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Icons.Close size={10} />
            </button>
        </NavLink>
      ))}
    </div>
  );
};

export default TabBar;
