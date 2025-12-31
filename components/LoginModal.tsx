import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icon';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(password)) {
      onClose();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-zenith-bg border border-zenith-orange w-full max-w-sm p-0 shadow-[0_0_30px_rgba(255,77,0,0.1)] relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-zenith-orange"></div>
        <div className="absolute top-0 right-0 w-2 h-2 bg-zenith-orange"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-zenith-orange"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-zenith-orange"></div>

        <div className="bg-zenith-surface border-b border-zenith-border p-4 flex justify-between items-center">
            <span className="font-mono text-xs tracking-widest text-zenith-orange uppercase flex items-center gap-2">
                <Icons.User size={12} />
                Security Clearance
            </span>
            <button onClick={onClose} className="text-zenith-muted hover:text-white transition-colors">
                <Icons.Close size={18}/>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center space-y-2">
             <div className="font-mono text-zenith-text text-sm tracking-wide">AUTHENTICATION REQUIRED</div>
             <div className="text-[10px] text-zenith-muted font-mono uppercase tracking-widest">Enter Access Code</div>
          </div>

          <div className="space-y-2">
            <input 
              ref={inputRef}
              type="password"
              autoFocus
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full bg-black border ${error ? 'border-red-500 animate-pulse' : 'border-zenith-border'} p-3 text-white font-mono text-center text-lg focus:border-zenith-orange focus:outline-none transition-colors tracking-widest`}
              placeholder="••••••••"
            />
            {error && <div className="text-red-500 text-[10px] font-mono text-center tracking-widest pt-2">ACCESS DENIED // INVALID CODE</div>}
          </div>
          
          <button type="submit" className="w-full bg-zenith-orange text-black px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-white transition-colors duration-75 flex items-center justify-center gap-2">
            <Icons.Check size={16} />
            Verify Identity
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;