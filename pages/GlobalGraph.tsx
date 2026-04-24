import React from 'react';
import { Repository } from '../types';
import GraphViewWrapper from '../components/GraphView';
import { Icons } from '../components/Icon';

interface GlobalGraphProps {
  repos: Repository[];
}

const GlobalGraph: React.FC<GlobalGraphProps> = ({ repos }) => {
  // Use the first repo as tentative active or just center the graph
  const activeRepoId = repos.length > 0 ? repos[0].id : '';

  return (
    <div className="h-screen flex flex-col bg-zenith-bg p-6 md:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zenith-border pb-6">
        <div>
           <div className="font-mono text-[10px] tracking-widest text-zenith-orange mb-2">SECTOR: KNOWLEDGE MAPPING</div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase italic">Constellation</h1>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="font-mono text-[10px] text-zenith-muted uppercase tracking-widest bg-zenith-surface border border-zenith-border px-3 py-1">
                Neural Density: {repos.reduce((acc, r) => acc + r.files.length, 0)} Nodes
            </div>
        </div>
      </div>

      <div className="flex-1 border border-zenith-border bg-zenith-surface/20 relative overflow-hidden shadow-2xl">
          <GraphViewWrapper 
            activeRepoId={activeRepoId}
            repos={repos}
            scope="global"
            onAddFile={() => {}} // Disabled in global view or could open quick capture
          />
          
          {/* Decorative Corner Marks */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-zenith-orange z-10"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-zenith-orange z-10"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-zenith-orange z-10"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-zenith-orange z-10"></div>
      </div>

      <div className="mt-6 flex items-center justify-between font-mono text-[10px] text-zenith-muted">
          <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zenith-orange"></span> Direct Links</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zenith-green"></span> Shared Context</span>
          </div>
          <div>SCANNED ALL ACTIVE MODULES // VERSION 2.1.0</div>
      </div>
    </div>
  );
};

export default GlobalGraph;
