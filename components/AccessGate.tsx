import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Icons } from './Icon';
import { isSupabaseConfigured } from '../lib/supabase';

interface AccessGateProps {
  onUnlock: (key: string) => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onUnlock }) => {
  const [keyInput, setKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  // Check if key exists in local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('gitnotes_secret_key');
    if (stored) {
        onUnlock(stored);
    }
  }, [onUnlock]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    localStorage.setItem('gitnotes_secret_key', keyInput.trim());
    onUnlock(keyInput.trim());
  };

  const handleGenerate = () => {
    const newKey = uuidv4();
    setGeneratedKey(newKey);
    setKeyInput(newKey);
  };

  return (
    <div className="fixed inset-0 bg-zenith-bg flex items-center justify-center z-[200]">
      <div className="w-full max-w-md p-8 relative">
         {/* Sci-Fi Decorative Borders */}
         <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-zenith-orange"></div>
         <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-zenith-orange"></div>
         
         <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-zenith-surface border border-zenith-border flex items-center justify-center rounded-full animate-pulse">
                    <Icons.User size={32} className="text-zenith-orange" />
                </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-[0.2em] mb-2">IDENTITY VERIFICATION</h1>
            <p className="text-zenith-muted font-mono text-xs uppercase">Zenith Secure Protocol // V3.0</p>
            {!isSupabaseConfigured && (
                 <div className="mt-4 inline-block bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-3 py-1 text-[10px] font-mono uppercase tracking-widest">
                    ⚠ Uplink Offline: Local Demo Mode
                 </div>
            )}
         </div>

         <div className="bg-zenith-surface border border-zenith-border p-6 mb-6">
            {!generatedKey ? (
                <>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] text-zenith-orange font-mono uppercase tracking-widest block">Existing Users</label>
                            <input 
                                type="text"
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                placeholder="Paste your Secret Key..."
                                className="w-full bg-black border border-zenith-border p-3 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none transition-colors"
                            />
                        </div>
                        <button type="submit" className="w-full bg-white text-black py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-zenith-orange transition-colors">
                            Authenticate
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zenith-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-zenith-surface px-2 text-zenith-muted font-mono">OR</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <button onClick={handleGenerate} className="text-zenith-muted hover:text-white font-mono text-xs uppercase border-b border-zenith-muted hover:border-white pb-1 transition-colors">
                            Generate New Identity
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center space-y-4">
                    <div className="text-zenith-green font-mono text-xs uppercase tracking-widest">
                        <Icons.Check className="inline mr-2" size={14}/> 
                        Identity Generated
                    </div>
                    <div className="bg-black border border-zenith-border p-4 break-all font-mono text-sm text-white select-all">
                        {generatedKey}
                    </div>
                    <p className="text-[10px] text-zenith-orange font-mono leading-relaxed">
                        CRITICAL: Copy this key immediately. It is your only way to access data on other devices.
                    </p>
                    <button 
                        onClick={(e) => handleLogin(e)}
                        className="w-full bg-zenith-orange text-black py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors mt-4"
                    >
                        Enter System
                    </button>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AccessGate;