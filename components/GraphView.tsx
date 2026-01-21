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
  MarkerType,
  ConnectionLineType,
  useReactFlow,
  Connection,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath
} from '@xyflow/react';
// import '@xyflow/react/dist/style.css'; // REMOVED: Injected via index.html for online IDE compatibility
import dagre from 'dagre';
import { Repository } from '../types';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';

interface GraphViewProps {
  repo: Repository;
  onAddFile: () => void;
  onLinkNodes?: (sourceId: string, targetId: string) => void;
  onDisconnectNodes?: (sourceId: string, targetId: string) => void;
}

// Custom Dark Theme styles for React Flow
const flowStyles = {
    background: '#030303',
};

// --- Custom Edge Component with Delete Button & Hover Feedback ---
const CustomDeleteEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent, id: string) => {
    evt.stopPropagation();
    if (data && typeof data.onDelete === 'function') {
        (data.onDelete as () => void)();
    }
  };

  // Dynamic Edge Style
  const activeStyle = {
      ...style,
      stroke: '#ef4444', // Red Warning Color
      strokeWidth: 2,
      filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.6))', // Red Glow
      transition: 'all 0.3s ease',
      zIndex: 100
  };

  const defaultStyle = {
      ...style,
      stroke: '#52525B',
      strokeWidth: 1,
      transition: 'all 0.3s ease',
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={isHovered ? activeStyle : defaultStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group flex flex-col items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Delete Button */}
          <button
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border shadow-lg ${
                isHovered 
                ? 'bg-red-600 text-white border-red-500 scale-110' 
                : 'bg-black text-zenith-muted border-zenith-border opacity-0 group-hover:opacity-100 scale-90 hover:scale-100'
            }`}
            onClick={(event) => onEdgeClick(event, id)}
            title="Sever Connection"
          >
            <span className="leading-none mb-[1px] font-bold">×</span>
          </button>

          {/* Context Tooltip (Only visible on hover) */}
          <div className={`
            absolute top-7 whitespace-nowrap bg-black/90 border border-red-500/30 px-3 py-2 rounded-sm 
            text-[10px] font-mono shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-200 z-50
            flex flex-col items-center gap-1 pointer-events-none
            ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}
          `}>
             <div className="flex items-center gap-2 text-zenith-muted">
                <span className="text-white font-bold truncate max-w-[120px]">
                    {data?.sourceName as string || 'Unknown'}
                </span>
                <Icons.ChevronRight size={10} className="text-red-500" />
                <span className="text-white font-bold truncate max-w-[120px]">
                    {data?.targetName as string || 'Unknown'}
                </span>
             </div>
             <div className="text-[9px] text-red-500 uppercase tracking-wider font-bold">
                Click × to Unlink
             </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const GraphView: React.FC<GraphViewProps> = ({ repo, onAddFile, onLinkNodes, onDisconnectNodes }) => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Define edge types outside of render or useMemo
  const edgeTypes = useMemo(() => ({
    'custom-delete': CustomDeleteEdge,
  }), []);

  // --- 1. Graph Construction Logic ---
  const getLayoutedElements = useCallback((nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 180;
    const nodeHeight = 60;

    dagreGraph.setGraph({ rankdir: 'LR' }); // Left to Right layout

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, []);

  // --- 2. Data Parsing Effect ---
  useEffect(() => {
    if (!repo) return;

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    
    // Map filename to ID for easy edge creation
    const fileMap = new Map<string, string>();
    repo.files.forEach(f => fileMap.set(f.name, f.id));
    repo.files.forEach(f => fileMap.set(f.name.replace('.md', ''), f.id)); 

    // Helper to get name from ID for labels
    const idToName = new Map<string, string>();
    repo.files.forEach(f => idToName.set(f.id, f.name.replace('.md', '')));

    // 1. First Pass: Create Edges (Parse Links)
    repo.files.forEach(sourceFile => {
        // Regex for [[Link]]
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = linkRegex.exec(sourceFile.content)) !== null) {
            const targetName = match[1];
            // Try to find exact match or partial match
            let targetId = fileMap.get(targetName);
            
            // If not found, try adding .md
            if (!targetId) targetId = fileMap.get(targetName + '.md');

            if (targetId && targetId !== sourceFile.id) {
                rawEdges.push({
                    id: `${sourceFile.id}-${targetId}`,
                    source: sourceFile.id,
                    target: targetId,
                    type: 'custom-delete', // Use our custom edge type
                    animated: true,
                    style: { stroke: '#52525B' },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#52525B',
                    },
                    data: {
                        // Pass names for the tooltip
                        sourceName: sourceFile.name.replace('.md', ''),
                        targetName: idToName.get(targetId) || targetName,
                        // Pass the disconnect handler directly to the edge
                        onDelete: () => {
                            if (onDisconnectNodes) {
                                onDisconnectNodes(sourceFile.id, targetId!);
                            }
                        }
                    },
                    selected: false, 
                    focusable: true,
                });
            }
        }
    });

    // 2. Identify Orphans (Nodes with 0 edges)
    const connectedNodeIds = new Set<string>();
    rawEdges.forEach(e => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
    });

    // 3. Second Pass: Create Nodes with Conditional Styling
    repo.files.forEach(file => {
        // Simple sizing based on content length
        const sizeWeight = Math.min(Math.max(file.content.length / 500, 1), 2);
        
        const isOrphan = !connectedNodeIds.has(file.id) && repo.files.length > 1; // Only count as orphan if grid has >1 node
        const isReadme = file.name.toLowerCase() === 'readme.md';

        // ORPHAN STYLE: Dashed red border, red text
        const orphanStyle = {
            background: '#1a0505',
            color: '#ff4d4d',
            border: '1px dashed #ff4d4d',
            boxShadow: '0 0 10px rgba(255, 77, 77, 0.2)'
        };

        // README STYLE: Solid orange, bold
        const readmeStyle = {
            background: '#18181B',
            color: '#FF4D00',
            border: '1px solid #FF4D00',
            fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(255, 77, 0, 0.2)',
        };

        // DEFAULT STYLE
        const defaultStyle = {
            background: '#0F0F11',
            color: '#fff',
            border: '1px solid #27272A',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        };

        rawNodes.push({
            id: file.id,
            data: { 
                label: isOrphan ? `⚠ ${file.name.replace('.md', '')}` : file.name.replace('.md', '') 
            },
            position: { x: 0, y: 0 }, // Position calculated by Dagre later
            // Make nodes connectable
            connectable: true,
            style: { 
                borderRadius: '0px',
                padding: '10px',
                fontSize: '12px',
                fontFamily: 'monospace',
                width: 150 * sizeWeight,
                textAlign: 'center',
                ...defaultStyle,
                ...(isReadme ? readmeStyle : {}),
                ...(isOrphan ? orphanStyle : {})
            },
        });
    });

    // Apply Layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Fit view after a brief delay to allow rendering
    setTimeout(() => {
        window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
    }, 100);

  }, [repo, getLayoutedElements, setNodes, setEdges, fitView, onDisconnectNodes]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
      navigate(`/${repo.id}/${node.id}`);
  };

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && onLinkNodes) {
        onLinkNodes(params.source, params.target);
    }
  }, [onLinkNodes]);

  // Handle Edge Deletion (Backspace/Delete key on selected edge) - Legacy Support
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
      if (onDisconnectNodes) {
          deletedEdges.forEach((edge) => {
              onDisconnectNodes(edge.source, edge.target);
          });
      }
  }, [onDisconnectNodes]);

  // Count orphans for HUD
  const orphanCount = nodes.filter(n => n.style && n.style.border && (n.style.border as string).includes('dashed')).length;

  return (
    <div className="w-full h-[calc(100vh-180px)] border border-zenith-border bg-zenith-bg relative group">
        
        {/* Graph Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
                onClick={onAddFile}
                className="bg-zenith-orange text-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-lg flex items-center gap-2"
            >
                <Icons.Plus size={14} /> Add Node
            </button>
        </div>

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
            onEdgesDelete={onEdgesDelete} // Bind the delete handler
            deleteKeyCode={['Backspace', 'Delete']} // Explicitly allow deletion
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            style={flowStyles}
            minZoom={0.2}
            maxZoom={4}
            // Style handles to be visible
            defaultEdgeOptions={{ 
                style: { stroke: '#52525B' }, 
                markerEnd: { type: MarkerType.ArrowClosed, color: '#52525B' } 
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
                Live Render // {nodes.length} Nodes // {edges.length} Links
            </div>
            <div className="font-mono text-[10px] text-zenith-muted mt-1">
                Drag handles to link nodes | Click '×' on line to unlink
            </div>
            {orphanCount > 0 && (
                <div className="font-mono text-[10px] text-red-500 mt-1 animate-pulse font-bold">
                    ⚠ {orphanCount} ORPHAN SIGNALS DETECTED
                </div>
            )}
        </div>
    </div>
  );
};

// Wrapper to provide ReactFlowContext
const GraphViewWrapper: React.FC<GraphViewProps> = (props) => (
    <div className="w-full h-full">
         <ReactFlowProviderWrapper {...props} />
    </div>
);

// We need a separate component inside the provider to use useReactFlow hooks
const ReactFlowProviderWrapper: React.FC<GraphViewProps> = (props) => {
    return (
        <ReactFlowProvider>
            <GraphView {...props} />
        </ReactFlowProvider>
    );
}

export default GraphViewWrapper;