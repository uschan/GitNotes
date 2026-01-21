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
    background: '#030303',
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
    <div className="w-full h-[calc(100vh-180px)] border border-zenith-border bg-zenith-bg relative group">
        
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
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete} 
            deleteKeyCode={['Backspace', 'Delete']} 
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            style={flowStyles}
            minZoom={0.2}
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