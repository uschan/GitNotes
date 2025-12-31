import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from './Icon';

interface HeaderProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLoginClick, onLogoutClick }) => {
  return (
    <header className="bg-zenith-bg border-b border-zenith-border h-14 flex items-center justify-between sticky top-0 z-50 px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className={`w-4 h-4 ${isAuthenticated ? 'bg-zenith-orange' : 'bg-zenith-muted'} group-hover:bg-white transition-colors duration-75`}></div>
          <span className="font-mono font-bold text-lg tracking-tighter text-white group-hover:text-zenith-orange transition-colors duration-75">
            GITNOTES <span className="text-zenith-muted font-normal text-xs tracking-widest ml-1 opacity-50"> // TERMINAL</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-6 font-mono text-[10px] tracking-widest text-zenith-muted uppercase">
        <div className="hidden md:flex items-center gap-2">
           <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-zenith-green animate-pulse' : 'bg-zenith-muted'} `}></span>
           <span>{isAuthenticated ? 'System Online' : 'Read Only Mode'}</span>
        </div>
        <div className="h-4 w-px bg-zenith-border"></div>
        
        {isAuthenticated ? (
            <button onClick={onLogoutClick} className="flex items-center gap-2 text-zenith-orange hover:text-white cursor-pointer transition-colors duration-75 border border-transparent hover:border-zenith-border px-2 py-1">
               <Icons.User size={12} />
               <span>ADMIN ACCESS</span>
            </button>
        ) : (
            <button onClick={onLoginClick} className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors duration-75 border border-transparent hover:border-zenith-border px-2 py-1">
               <Icons.User size={12} />
               <span>VISITOR MODE</span>
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;