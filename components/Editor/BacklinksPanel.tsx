import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icon';

interface Backlink {
  fileId: string;
  fileName: string;
  repoId: string;
  repoName: string;
  context: string;
}

interface BacklinksPanelProps {
  backlinks: Backlink[];
}

const BacklinksPanel: React.FC<BacklinksPanelProps> = ({ backlinks }) => {
  const navigate = useNavigate();

  if (backlinks.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-zenith-border">
        <h3 className="text-sm font-mono font-bold text-zenith-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Icons.GitBranch size={14} /> Linked Mentions
        </h3>
        <div className="grid grid-cols-1 gap-3">
            {backlinks.map((link, idx) => (
                <div 
                    key={idx}
                    onClick={() => navigate(`/${link.repoId}/${link.fileId}`)}
                    className="group bg-zenith-surface border border-zenith-border p-4 cursor-pointer hover:border-zenith-orange transition-colors"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-sm group-hover:text-zenith-orange transition-colors">
                            {link.fileName}
                        </span>
                        <span className="text-[10px] text-zenith-muted font-mono bg-zenith-bg px-2 py-0.5 border border-zenith-border">
                            {link.repoName}
                        </span>
                    </div>
                    <div className="text-zenith-muted text-xs font-mono line-clamp-2 border-l-2 border-zenith-border pl-2 group-hover:border-zenith-orange">
                        "...{link.context}..."
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default BacklinksPanel;