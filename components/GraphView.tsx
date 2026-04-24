import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  ReactFlow, 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionLineType,
  useReactFlow,
  Connection,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import { Repository } from '../types';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { CustomDeleteEdge } from './Graph/CustomEdge';
import GraphLegend from './Graph/GraphLegend';
import { buildGraphData } from './Graph/graphBuilder';

interface GraphViewProps {
  repos: Repository[]; 
  activeRepoId: string; 
  scope: 'local' | 'global';
  onAddFile: () => void;
  onLinkNodes?: (sourceId: string, targetId: string) => void;
  onDisconnectNodes?: (sourceId: string, targetId: string) => void;
}

const flowStyles = {
    background: '#020202',
};

const GraphView: React.FC<GraphViewProps> = ({ repos, activeRepoId, scope, onAddFile, onLinkNodes, onDisconnectNodes }) => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [showLegend, setShowLegend] = useState(false);

  const edgeTypes = useMemo(() => ({
    'custom-delete': CustomDeleteEdge,
  }), []);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- FILTERED NODES ---
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return nodes;
    const lowerSearch = searchTerm.toLowerCase();
    return nodes.map(node => {
        const matches = node.data.label.toLowerCase().includes(lowerSearch);
        return {
            ...node,
            hidden: !matches && !highlightedNeighbors.has(node.id)
        }
    });
  }, [nodes, searchTerm]);

  // To properly filter we need to know who the neighbors are even if hidden
  const highlightedNeighbors = useMemo(() => {
      const neighbors = new Set<string>();
      if (!searchTerm.trim()) return neighbors;
      const lowerSearch = searchTerm.toLowerCase();
      
      const matchingNodeIds = nodes
        .filter(n => n.data.label.toLowerCase().includes(lowerSearch))
        .map(n => n.id);

      edges.forEach(edge => {
          if (matchingNodeIds.includes(edge.source)) neighbors.add(edge.target);
          if (matchingNodeIds.includes(edge.target)) neighbors.add(edge.source);
      });
      return neighbors;
  }, [nodes, edges, searchTerm]);

  // --- HIGHLIGHT LOGIC ---
  const highlightedEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;
    return edges.map(edge => ({
        ...edge,
        animated: edge.source === hoveredNodeId || edge.target === hoveredNodeId,
        style: {
            ...edge.style,
            opacity: (edge.source === hoveredNodeId || edge.target === hoveredNodeId) ? 1 : 0.05,
            stroke: (edge.source === hoveredNodeId || edge.target === hoveredNodeId) ? '#ff4d00' : (edge.style?.stroke || '#27272A'),
            strokeWidth: (edge.source === hoveredNodeId || edge.target === hoveredNodeId) ? 2 : 1,
        }
    }));
  }, [edges, hoveredNodeId]);

  const highlightedNodes = useMemo(() => {
    if (!hoveredNodeId) return nodes;
    
    // Find neighbors
    const neighbors = new Set<string>();
    edges.forEach(edge => {
        if (edge.source === hoveredNodeId) neighbors.add(edge.target);
        if (edge.target === hoveredNodeId) neighbors.add(edge.source);
    });

    return filteredNodes.map(node => {
        const isHovered = node.id === hoveredNodeId;
        const isNeighbor = neighbors.has(node.id);
        
        return {
            ...node,
            style: {
                ...node.style,
                opacity: node.hidden ? 0 : ((isHovered || isNeighbor) ? 1 : (hoveredNodeId ? 0.2 : 1)),
                scale: isHovered ? 1.05 : 1,
                boxShadow: isHovered ? `0 0 30px #ff4d0040` : node.style?.boxShadow,
                filter: (isHovered || isNeighbor || !hoveredNodeId) ? 'none' : 'grayscale(0.8) blur(2px)',
                zIndex: isHovered ? 100 : (isNeighbor ? 50 : 1),
            }
        };
    });
  }, [filteredNodes, edges, hoveredNodeId]);

  const onNodeMouseEnter = (_: any, node: Node) => {
    setHoveredNodeId(node.id);
  };

  const onNodeMouseLeave = () => {
    setHoveredNodeId(null);
  };

  // --- BUILD GRAPH ---
  useEffect(() => {
    if (!repos || repos.length === 0) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = buildGraphData(repos, activeRepoId, scope, onDisconnectNodes);
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    setTimeout(() => {
        window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
    }, 100);

  }, [repos, activeRepoId, scope, setNodes, setEdges, fitView, onDisconnectNodes]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
      // Find which repo this node belongs to for navigation
      let foundRepoId = activeRepoId;
      if (scope === 'global') {
          for (const r of repos) {
              if (r.files.some(f => f.id === node.id)) {
                  foundRepoId = r.id;
                  break;
              }
          }
      }
      navigate(`/${foundRepoId}/${node.id}`);
  };

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && onLinkNodes) {
        onLinkNodes(params.source, params.target);
    }
  }, [onLinkNodes]);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
      if (onDisconnectNodes) {
          deletedEdges.forEach((edge) => {
              onDisconnectNodes(edge.source, edge.target);
          });
      }
  }, [onDisconnectNodes]);

  return (
    <div className="w-full h-full border border-zenith-border bg-zenith-bg relative group overflow-hidden">
        
        {/* Graph Search (Top Left) */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 w-full max-w-xs pointer-events-none sm:pointer-events-auto">
             <div className="relative group/search flex-1 hidden sm:block">
                 <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zenith-muted group-focus-within/search:text-zenith-orange transition-colors" size={14} />
                 <input 
                    type="text"
                    placeholder="Search graph..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-black/60 backdrop-blur-md border border-zenith-border focus:border-zenith-orange px-10 py-2 font-mono text-[10px] text-white outline-none transition-all"
                 />
                 {searchTerm && (
                     <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zenith-muted hover:text-white">
                         <Icons.Close size={12} />
                     </button>
                 )}
             </div>
        </div>

        {/* Graph Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
                onClick={() => setShowLegend(!showLegend)}
                className="bg-zenith-surface border border-zenith-border text-zenith-muted hover:text-white p-2 rounded-sm shadow-lg transition-colors"
                title="Graph Legend"
            >
                <Icons.Help size={16} />
            </button>
            <div className="w-px h-8 bg-zenith-border/50 mx-1"></div>
            <button 
                onClick={onAddFile}
                className="bg-zenith-orange text-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-lg flex items-center gap-2"
            >
                <Icons.Plus size={14} /> Add Node
            </button>
        </div>

        {/* Legend Modal/Overlay */}
        {showLegend && (
            <GraphLegend scope={scope} repos={repos} activeRepoId={activeRepoId} />
        )}

        {/* Empty State */}
        {nodes.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                 <div className="text-center">
                     <div className="text-zenith-muted font-mono text-xs uppercase tracking-widest mb-2">No Data Points Detected</div>
                     <div className="text-zenith-orange/50 font-mono text-[10px]">Add a file to initialize graph</div>
                 </div>
             </div>
        )}

        <ReactFlow
            nodes={highlightedNodes}
            edges={highlightedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete} 
            deleteKeyCode={['Backspace', 'Delete']} 
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.Bezier}
            fitView
            style={flowStyles}
            minZoom={0.1}
            maxZoom={4}
            defaultEdgeOptions={{ 
                type: 'custom-delete',
                markerEnd: { type: MarkerType.ArrowClosed } 
            }}
        >
            <Background color="#27272A" gap={20} size={1} />
            <Controls 
                className="bg-zenith-surface border border-zenith-border fill-white text-white" 
                style={{ borderRadius: 0, padding: 2 }} 
            />
            <MiniMap 
                nodeStrokeColor="#27272A"
                nodeColor="#18181B"
                maskColor="rgba(0,0,0, 0.7)"
                style={{ backgroundColor: '#030303', border: '1px solid #27272A' }}
            />
        </ReactFlow>
        
        {/* HUD Overlay */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="font-mono text-[10px] text-zenith-orange uppercase tracking-widest flex items-center gap-2">
                <Icons.Zap size={10} className="animate-pulse"/>
                PROTOCOL: {scope === 'global' ? 'GALAXY (SMART CONTEXT)' : 'SECTOR (LOCAL)'} // {nodes.length} Nodes
            </div>
            <div className="font-mono text-[10px] text-zenith-muted mt-1">
                {scope === 'global' ? 'Focusing on active module & direct external links.' : 'Nodes colored by Structural Sovereignty.'}
            </div>
        </div>
    </div>
  );
};

const GraphViewWrapper: React.FC<GraphViewProps> = (props) => (
    <div className="w-full h-full">
         <ReactFlowProviderWrapper {...props} />
    </div>
);

const ReactFlowProviderWrapper: React.FC<GraphViewProps> = (props) => {
    return (
        <ReactFlowProvider>
            <GraphView {...props} />
        </ReactFlowProvider>
    );
}

export default GraphViewWrapper;