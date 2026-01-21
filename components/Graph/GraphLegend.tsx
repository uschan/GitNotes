import React from 'react';
import { Repository } from '../../types';

export const SOVEREIGN_PALETTES = [
    '#FF4D00', // Zenith Orange
    '#00E676', // Matrix Green
    '#2979FF', // Electric Blue
    '#D500F9', // Neon Purple
    '#FFEA00', // Cyber Yellow
    '#00BCD4', // Cyan
    '#FF1744', // Crimson Red
];

interface GraphLegendProps {
  scope: 'local' | 'global';
  repos: Repository[];
  activeRepoId: string;
}

const GraphLegend: React.FC<GraphLegendProps> = ({ scope, repos, activeRepoId }) => {
  return (
    <div className="absolute top-16 right-4 z-50 w-72 bg-black/90 backdrop-blur border border-zenith-border shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
        <h4 className="font-mono text-[10px] text-zenith-muted uppercase tracking-widest mb-4 border-b border-zenith-border pb-2">
            Visual Taxonomy
        </h4>
        
        {scope === 'global' ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-[10px] text-zenith-muted italic mb-2">Galaxy Mode (Context Aware):<br/>Showing active module + direct connections.</div>
                {repos.map((r, idx) => {
                        return (
                        <div key={r.id} className="flex gap-3 items-center">
                            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: SOVEREIGN_PALETTES[idx % SOVEREIGN_PALETTES.length] }}></div>
                            <div className="text-white text-xs font-mono uppercase truncate">
                                {r.name} {r.id !== activeRepoId && <span className="text-zenith-muted opacity-50 ml-1">[EXT]</span>}
                            </div>
                        </div>
                        )
                })}
                </div>
        ) : (
            <div className="space-y-4">
                {/* Sovereign */}
                <div className="flex gap-3 items-start">
                    <div className="w-4 h-4 rounded-sm border-2 border-zenith-orange shadow-[0_0_10px_rgba(255,77,0,0.3)] shrink-0 mt-0.5"></div>
                    <div>
                        <div className="text-white text-xs font-bold uppercase">Sovereign Node</div>
                        <p className="text-[10px] text-zenith-muted leading-tight mt-1">A central topic or "Hub". Inherits a unique color based on its cluster.</p>
                    </div>
                </div>
                {/* Subject */}
                <div className="flex gap-3 items-start">
                    <div className="w-4 h-4 rounded-sm border border-zenith-orange shrink-0 mt-0.5 opacity-70"></div>
                    <div>
                        <div className="text-zenith-text text-xs font-bold uppercase">Subject Node</div>
                        <p className="text-[10px] text-zenith-muted leading-tight mt-1">Exclusively linked to one Sovereign. Inherits the Sovereign's color.</p>
                    </div>
                </div>
                {/* Neutral */}
                <div className="flex gap-3 items-start">
                    <div className="w-4 h-4 rounded-sm border border-dashed border-zenith-muted shrink-0 mt-0.5"></div>
                    <div>
                        <div className="text-zenith-muted text-xs font-bold uppercase">Neutral / Bridge</div>
                        <p className="text-[10px] text-zenith-muted leading-tight mt-1">Connects multiple Sovereigns. Remains grey to avoid color pollution.</p>
                    </div>
                </div>
            </div>
        )}
        
        <div className="h-px bg-zenith-border my-4"></div>

        {/* Edge Styles */}
        <div className="space-y-4">
            <div className="flex gap-3 items-center">
                <div className="w-8 h-0.5 bg-zenith-muted shrink-0"></div>
                <div>
                    <div className="text-white text-xs font-bold uppercase">Solid Line</div>
                    <p className="text-[10px] text-zenith-muted leading-tight">Bi-directional link (Strong bond).</p>
                </div>
            </div>
            <div className="flex gap-3 items-center">
                <div className="w-8 h-0.5 border-t border-dashed border-zenith-muted shrink-0"></div>
                <div>
                    <div className="text-zenith-muted text-xs font-bold uppercase">Dashed Line</div>
                    <p className="text-[10px] text-zenith-muted leading-tight">One-way reference (Weak link).</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GraphLegend;