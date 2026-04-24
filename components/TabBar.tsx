import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from './Icon';
import clsx from 'clsx';

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
    <div className="flex items-center bg-zenith-bg border-b border-zenith-border overflow-x-auto no-scrollbar h-11 px-2 shrink-0">
      <div className="flex items-center gap-1 px-3 mr-2 text-zenith-muted shrink-0 border-r border-zenith-border h-6 my-auto">
         <Icons.ChevronRight size={14} className="opacity-40 rotate-180 hover:text-white cursor-pointer transition-colors" />
         <Icons.ChevronRight size={14} className="opacity-40 hover:text-white cursor-pointer transition-colors" />
      </div>
      
      {tabs.map((tab) => (
        <NavLink
            key={tab.fileId}
            to={`/${tab.repoId}/${tab.fileId}`}
            className={({ isActive }) => clsx(
                "group flex items-center h-full px-4 text-[12px] font-medium transition-all shrink-0 min-w-[120px] max-w-[200px] relative border-r border-zenith-border/10",
                isActive 
                    ? "text-white bg-white/[0.03]" 
                    : "text-zenith-muted hover:text-white hover:bg-white/[0.01]"
            )}
        >
            <div className="flex items-center gap-2.5 truncate flex-1">
                <Icons.FileText size={10} className="shrink-0 opacity-40 group-[.active]:text-zenith-orange group-[.active]:opacity-100" />
                <span className="truncate">{tab.name.replace('.md', '')}</span>
            </div>
            
            <button 
                onClick={(e) => onCloseTab(e, tab.fileId)}
                className="ml-2 p-1 rounded-md hover:bg-white/10 text-zenith-muted hover:text-white opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
            >
                <Icons.Close size={12} />
            </button>

            {/* Active Indicator Line */}
            <div className={clsx(
                "absolute bottom-0 left-0 right-0 h-[1.5px] transition-all duration-300",
                "bg-zenith-orange shadow-[0_0_8px_rgba(255,87,34,0.5)] opacity-0",
                "group-[.active]:opacity-100"
            )}></div>
        </NavLink>
      ))}


    </div>
  );
};

export default TabBar;
