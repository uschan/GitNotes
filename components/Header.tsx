import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Icons } from './Icon';
import { isSupabaseConfigured } from '../lib/supabase';
import { Repository } from '../types';

interface HeaderProps {
  onLogoutClick: () => void;
  secretKey: string;
  repos: Repository[];
  toggleMobileSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoutClick, secretKey, repos, toggleMobileSidebar }) => {
  const location = useLocation();
  const { repoId, fileId } = useParams<{ repoId: string; fileId: string }>();

  const copyKey = () => {
      navigator.clipboard.writeText(secretKey);
      alert("Secret Key Copied to Clipboard");
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const crumbs: { label: string; path: string; active?: boolean }[] = [];

    // Root is always Dashboard
    crumbs.push({ label: 'DASHBOARD', path: '/' });

    if (parts.length > 0) {
      if (parts[0] === 'graph') {
        crumbs.push({ label: 'CONSTELLATION', path: '/graph', active: true });
      } else {
        const repo = repos.find(r => r.id === parts[0]);
        if (repo) {
          crumbs.push({ label: repo.name.toUpperCase(), path: `/${repo.id}`, active: parts.length === 1 });
          
          if (parts.length > 1) {
            const file = repo.files.find(f => f.id === parts[1]);
            if (file) {
                crumbs.push({ label: file.name.toUpperCase(), path: `/${repo.id}/${file.id}`, active: true });
            }
          }
        }
      }
    }

    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="bg-zenith-bg border-b border-zenith-border h-14 flex items-center justify-between sticky top-0 z-50 px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3 sm:gap-6 overflow-hidden">
        {/* Mobile Toggle */}
        <button 
          onClick={toggleMobileSidebar}
          className="lg:hidden text-zenith-muted hover:text-white p-1 transition-colors"
        >
          <Icons.Menu size={20} />
        </button>

        <Link to="/" className="group flex items-center gap-3 shrink-0">
          <div className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'bg-zenith-orange shadow-[0_0_8px_rgba(255,77,0,0.5)]' : 'bg-yellow-500'} group-hover:bg-white transition-colors duration-75`}></div>
          <span className="font-mono font-bold text-base tracking-tighter text-white group-hover:text-zenith-orange transition-colors duration-75 hidden sm:inline">
            ZENITH
          </span>
        </Link>

        {crumbs.length > 1 && (
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest overflow-hidden whitespace-nowrap">
                {/* Desktop Breadcrumbs */}
                <div className="hidden md:flex items-center gap-2">
                    {crumbs.map((crumb, i) => (
                        <React.Fragment key={crumb.path}>
                            {i > 0 && <Icons.ChevronRight size={10} className="text-zenith-border shrink-0" />}
                            <Link 
                                to={crumb.path}
                                className={`transition-colors truncate max-w-[150px] ${crumb.active ? 'text-zenith-orange font-bold' : 'text-zenith-muted hover:text-white'}`}
                            >
                                {crumb.label}
                            </Link>
                        </React.Fragment>
                    ))}
                </div>
                {/* Mobile Breadcrumbs (Only last item) */}
                <div className="md:hidden flex items-center gap-2">
                    <Icons.ChevronRight size={10} className="text-zenith-border shrink-0" />
                    <span className="text-zenith-orange font-bold truncate max-w-[120px]">
                        {crumbs[crumbs.length - 1].label}
                    </span>
                </div>
            </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] tracking-widest text-zenith-muted uppercase shrink-0">
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