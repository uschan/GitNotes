import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from './Icon';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  onLogoutClick: () => void;
  secretKey: string;
}

const Header: React.FC<HeaderProps> = ({ onLogoutClick, secretKey }) => {
  const copyKey = () => {
      navigator.clipboard.writeText(secretKey);
      alert("Secret Key Copied to Clipboard");
  };

  return (
    <header className="bg-zenith-bg border-b border-zenith-border h-14 flex items-center justify-between sticky top-0 z-50 px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className={`w-4 h-4 ${isSupabaseConfigured ? 'bg-zenith-orange' : 'bg-yellow-500'} group-hover:bg-white transition-colors duration-75`}></div>
          <span className="font-mono font-bold text-lg tracking-tighter text-white group-hover:text-zenith-orange transition-colors duration-75">
            GITNOTES <span className="text-zenith-muted font-normal text-xs tracking-widest ml-1 opacity-50"> // {isSupabaseConfigured ? 'CLOUD' : 'LOCAL'}</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-6 font-mono text-[10px] tracking-widest text-zenith-muted uppercase">
        <div className="hidden md:flex items-center gap-2">
           <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-zenith-green' : 'bg-yellow-500'} animate-pulse`}></span>
           <span>{isSupabaseConfigured ? 'Uplink Active' : 'Offline Mode'}</span>
        </div>
        <div className="h-4 w-px bg-zenith-border"></div>
        
        <button onClick={copyKey} className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors duration-75 px-2 py-1" title="Copy Secret Key">
           <Icons.User size={12} />
           <span className="hidden sm:inline">MY KEY</span>
        </button>

        <button onClick={onLogoutClick} className="text-zenith-muted hover:text-red-500 transition-colors">
            <Icons.Close size={12} />
        </button>
      </div>
    </header>
  );
};

export default Header;