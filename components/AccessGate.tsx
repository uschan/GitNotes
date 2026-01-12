import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Icons } from './Icon';
import { isSupabaseConfigured } from '../lib/supabase';

interface AccessGateProps {
  onUnlock: (key: string) => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onUnlock }) => {
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'generate'>('landing');
  const [keyInput, setKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Auto-login check
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
    setViewMode('generate');
  };

  const copyKey = () => {
      navigator.clipboard.writeText(generatedKey);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col relative overflow-hidden font-sans selection:bg-zenith-orange selection:text-black">
      
      {/* --- Background Effects --- */}
      {/* Grid Floor */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{
               backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
               backgroundSize: '40px 40px',
               maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
           }}>
      </div>
      {/* Ambient Glow */}
      <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-zenith-orange/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      {/* --- Header / Status Bar --- */}
      <header className="relative z-10 border-b border-zenith-border/50 bg-[#030303]/80 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-zenith-orange animate-pulse"></div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-zenith-muted uppercase">Zenith Systems // Secure Uplink</span>
          </div>
          <div className="font-mono text-[10px] text-zenith-muted uppercase hidden sm:block">
              SYS.VER.3.1.0
          </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {/* LANDING VIEW */}
        {viewMode === 'landing' && (
            <div className="max-w-4xl w-full text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Hero Typography */}
                <div className="space-y-6">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none">
                        GIT<span className="text-zenith-orange">NOTES</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zenith-muted font-mono max-w-2xl mx-auto leading-relaxed">
                        The serverless, privacy-first knowledge base.<br className="hidden md:block"/>
                        Deployed on the edge. Controlled by you.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
                    <div className="bg-zenith-surface/50 border border-zenith-border p-5 hover:border-zenith-orange/50 transition-colors group">
                        <Icons.Database className="text-zenith-muted group-hover:text-zenith-orange mb-3" size={24} />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Edge Persistence</h3>
                        <p className="text-zenith-muted text-xs leading-5">Zero maintenance. Powered by Vercel & Supabase for infinite scale and zero cost.</p>
                    </div>
                    <div className="bg-zenith-surface/50 border border-zenith-border p-5 hover:border-zenith-orange/50 transition-colors group">
                        <Icons.Lock className="text-zenith-muted group-hover:text-zenith-orange mb-3" size={24} />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Anonymous Auth</h3>
                        <p className="text-zenith-muted text-xs leading-5">No emails. No passwords. Identify via a unique cryptographically generated key.</p>
                    </div>
                    <div className="bg-zenith-surface/50 border border-zenith-border p-5 hover:border-zenith-orange/50 transition-colors group">
                        <Icons.Zap className="text-zenith-muted group-hover:text-zenith-orange mb-3" size={24} />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Time Travel</h3>
                        <p className="text-zenith-muted text-xs leading-5">Hack your contribution graph. Leave pixel art in your commit history.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                    <button 
                        onClick={handleGenerate}
                        className="w-full sm:w-auto px-8 py-4 bg-zenith-orange text-black font-bold font-mono text-sm uppercase tracking-widest hover:bg-white transition-all duration-200 shadow-[0_0_20px_rgba(255,77,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    >
                        Initialize Identity
                    </button>
                    <button 
                        onClick={() => setViewMode('login')}
                        className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zenith-border text-white font-bold font-mono text-sm uppercase tracking-widest hover:border-white hover:bg-white/5 transition-all duration-200"
                    >
                        Access System
                    </button>
                </div>
            </div>
        )}

        {/* LOGIN VIEW (ENTER KEY) */}
        {viewMode === 'login' && (
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-zenith-surface border border-zenith-border p-8 relative shadow-2xl">
                    <button onClick={() => setViewMode('landing')} className="absolute top-4 right-4 text-zenith-muted hover:text-white">
                        <Icons.Close size={20} />
                    </button>
                    
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white tracking-tight uppercase mb-2">Access Terminal</h2>
                        <p className="text-zenith-muted font-mono text-xs">Enter your identity key to synchronize.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] text-zenith-orange font-mono uppercase tracking-widest block">Secret Key</label>
                            <input 
                                autoFocus
                                type="text"
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className="w-full bg-black border border-zenith-border p-4 text-white font-mono text-sm focus:border-zenith-orange focus:outline-none transition-colors"
                            />
                        </div>
                        <button type="submit" className="w-full bg-white text-black py-4 font-mono text-xs font-bold uppercase tracking-widest hover:bg-zenith-orange transition-colors">
                            Decrypt & Enter
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                         <span className="text-[10px] text-zenith-muted font-mono">LOST KEYS CANNOT BE RECOVERED.</span>
                    </div>
                </div>
            </div>
        )}

        {/* GENERATE VIEW (NEW KEY) */}
        {viewMode === 'generate' && (
            <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-zenith-surface border border-zenith-orange p-1 relative shadow-[0_0_50px_rgba(255,77,0,0.15)]">
                     <div className="bg-[#050505] p-8 border border-zenith-orange/20">
                        <button onClick={() => setViewMode('landing')} className="absolute top-6 right-6 text-zenith-muted hover:text-white">
                            <Icons.Close size={20} />
                        </button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-12 h-12 rounded-full bg-zenith-green/10 flex items-center justify-center text-zenith-green mb-4 border border-zenith-green/30">
                                <Icons.Check size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Identity Created</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-zenith-surface border border-zenith-border p-4">
                                <label className="text-[10px] text-zenith-muted font-mono uppercase tracking-widest block mb-2">Your Unique Secret Key</label>
                                <div className="font-mono text-lg text-white break-all select-all tracking-wide leading-relaxed">
                                    {generatedKey}
                                </div>
                            </div>
                            
                            <button 
                                onClick={copyKey}
                                className={`w-full py-3 font-mono text-xs font-bold uppercase tracking-widest border transition-colors flex items-center justify-center gap-2 ${showCopySuccess ? 'border-zenith-green text-zenith-green bg-zenith-green/10' : 'border-zenith-border text-zenith-muted hover:text-white hover:border-white'}`}
                            >
                                {showCopySuccess ? <><Icons.Check size={14}/> Copied to Clipboard</> : <><Icons.Copy size={14}/> Copy Key</>}
                            </button>

                            <div className="p-3 bg-red-900/10 border border-red-900/30">
                                <p className="text-red-500 text-[10px] font-mono leading-relaxed uppercase">
                                    <span className="font-bold">Warning:</span> Save this key securely immediately. If you lose this key, you lose access to all your data forever. We do not store a backup.
                                </p>
                            </div>

                            <button 
                                onClick={(e) => handleLogin(e)}
                                className="w-full bg-zenith-orange text-black py-4 font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
                            >
                                I have saved my key, Enter
                            </button>
                        </div>
                     </div>
                </div>
            </div>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className="relative z-10 p-6 flex justify-between items-end pointer-events-none">
          <div className="flex flex-col gap-1">
             <div className="w-px h-12 bg-zenith-border"></div>
             <span className="font-mono text-[10px] text-zenith-muted uppercase tracking-widest">Designed by WildSalt</span>
          </div>
          <div className="flex gap-2">
             {!isSupabaseConfigured && (
                 <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1 text-[10px] font-mono uppercase border border-yellow-500/20">
                    Demo Mode
                 </div>
             )}
             <div className="bg-zenith-green/10 text-zenith-green px-2 py-1 text-[10px] font-mono uppercase border border-zenith-green/20 animate-pulse">
                System Online
             </div>
          </div>
      </footer>

    </div>
  );
};

export default AccessGate;