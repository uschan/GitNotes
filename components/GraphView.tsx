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

const flowStyles = {
    background: '#030303',
};

// --- COLOR PALETTES FOR SOVEREIGNS ---
const CLUSTER_PALETTES = [
    '#FF4D00', // Zenith Orange
    '#00E676', // Matrix Green
    '#2979FF', // Electric Blue
    '#D500F9', // Neon Purple
    '#FFEA00', // Cyber Yellow
    '#00BCD4', // Cyan
    '#FF1744', // Crimson Red
];

// --- Custom Edge Component ---
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
  
  // Clean Aesthetic: Default edge is strictly Neutral
  const edgeColor = '#27272A'; // Zinc-800 - Very subtle
  
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

  const markerEndSafe = typeof markerEnd === 'object' ? markerEnd : {};

  // Delete State (Red)
  const activeStyle = {
      ...style,
      stroke: '#ef4444', 
      strokeWidth: 2,
      filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.6))',
      transition: 'all 0.3s ease',
      zIndex: 100
  };

  // Normal State (Grey)
  const defaultStyle = {
      ...style,
      stroke: edgeColor, 
      opacity: 0.8,
      strokeWidth: 1,
      transition: 'all 0.3s ease',
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={{...markerEndSafe, color: isHovered ? '#ef4444' : edgeColor} as any} style={isHovered ? activeStyle : defaultStyle} />
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
          {/* Interaction Zone - Only visible on hover */}
          <button
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border shadow-lg ${
                isHovered 
                ? 'bg-red-600 text-white border-red-500 scale-110 opacity-100' 
                : 'bg-black border-zenith-border opacity-0 group-hover:opacity-100 scale-90'
            }`}
            style={{ color: isHovered ? 'white' : edgeColor }}
            onClick={(event) => onEdgeClick(event, id)}
            title="Sever Connection"
          >
            <span className="leading-none mb-[1px] font-bold">×</span>
          </button>
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

  const edgeTypes = useMemo(() => ({
    'custom-delete': CustomDeleteEdge,
  }), []);

  // --- 1. Layout Engine ---
  const getLayoutedElements = useCallback((nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ 
        rankdir: 'LR', 
        align: 'DL',
        nodesep: 60,
        ranksep: 100 
    });

    nodes.forEach((node) => {
      const w = node.style?.width ? parseInt(node.style.width.toString()) : 180;
      const h = 60; 
      dagreGraph.setNode(node.id, { width: w, height: h });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const x = nodeWithPosition ? nodeWithPosition.x : 0;
      const y = nodeWithPosition ? nodeWithPosition.y : 0;
      const w = node.style?.width ? parseInt(node.style.width.toString()) : 180;
      
      return {
        ...node,
        position: {
          x: x - w / 2,
          y: y - 30,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, []);

  // --- 2. SOVEREIGNTY ALGORITHM ---
  useEffect(() => {
    if (!repo) return;

    // A. Build Graph Data
    const fileMap = new Map<string, string>();
    repo.files.forEach(f => fileMap.set(f.name, f.id));
    repo.files.forEach(f => fileMap.set(f.name.replace('.md', ''), f.id)); 
    const idToName = new Map<string, string>();
    repo.files.forEach(f => idToName.set(f.id, f.name.replace('.md', '')));

    const adjacency = new Map<string, string[]>(); // Neighbors
    const degree = new Map<string, number>();

    repo.files.forEach(f => {
        adjacency.set(f.id, []);
        degree.set(f.id, 0);
    });

    const rawEdges: any[] = [];
    repo.files.forEach(sourceFile => {
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = linkRegex.exec(sourceFile.content)) !== null) {
            const targetName = match[1];
            let targetId = fileMap.get(targetName);
            if (!targetId) targetId = fileMap.get(targetName + '.md');

            if (targetId && targetId !== sourceFile.id) {
                // Undirected Adjacency for Clustering calculation
                adjacency.get(sourceFile.id)?.push(targetId);
                adjacency.get(targetId)?.push(sourceFile.id);
                
                // Increase degree (Popularity)
                degree.set(sourceFile.id, (degree.get(sourceFile.id) || 0) + 1);
                degree.set(targetId, (degree.get(targetId) || 0) + 1);

                rawEdges.push({
                    id: `${sourceFile.id}-${targetId}`,
                    source: sourceFile.id,
                    target: targetId,
                    type: 'custom-delete', 
                    animated: false,
                    style: { strokeWidth: 1 }, 
                    markerEnd: { type: MarkerType.ArrowClosed },
                    data: {
                        sourceName: sourceFile.name.replace('.md', ''),
                        targetName: idToName.get(targetId) || targetName,
                        onDelete: () => {
                            if (onDisconnectNodes) onDisconnectNodes(sourceFile.id, targetId!);
                        }
                    },
                });
            }
        }
    });

    // B. Identify SOVEREIGNS (Mother Nodes)
    // Rule: A Sovereign is a node that is a local maximum of connectivity (or manually significant like README)
    // We sort all nodes by Degree.
    const sortedNodes = [...repo.files].sort((a, b) => {
        const degA = degree.get(a.id) || 0;
        const degB = degree.get(b.id) || 0;
        // README is always Emperor
        if (a.name.toLowerCase() === 'readme.md') return -1;
        if (b.name.toLowerCase() === 'readme.md') return 1;
        return degB - degA; 
    });

    const sovereigns = new Set<string>();
    const nodeColorMap = new Map<string, string>();

    // We pick the top N nodes as "Potential Sovereigns", but they must be somewhat distant from each other
    // to avoid coloring a cluster with 5 different colors.
    let colorIdx = 0;
    
    // First pass: README is always a sovereign
    const readme = repo.files.find(f => f.name.toLowerCase() === 'readme.md');
    if (readme) {
        sovereigns.add(readme.id);
        nodeColorMap.set(readme.id, CLUSTER_PALETTES[colorIdx % CLUSTER_PALETTES.length]);
        colorIdx++;
    }

    // Second pass: Find other dense hubs
    sortedNodes.forEach(node => {
        if (sovereigns.has(node.id)) return;
        const myDegree = degree.get(node.id) || 0;
        if (myDegree < 2) return; // Ignore weak nodes

        // Check if I am connected to an existing Sovereign?
        const neighbors = adjacency.get(node.id) || [];
        const connectedToSovereign = neighbors.some(n => sovereigns.has(n));

        // If I am NOT connected to an existing Sovereign, I start a new Kingdom
        if (!connectedToSovereign) {
             sovereigns.add(node.id);
             nodeColorMap.set(node.id, CLUSTER_PALETTES[colorIdx % CLUSTER_PALETTES.length]);
             colorIdx++;
        }
    });

    // C. Assign Subjects and Neutrals
    // Iterate non-sovereign nodes.
    repo.files.forEach(node => {
        if (sovereigns.has(node.id)) return;

        const neighbors = adjacency.get(node.id) || [];
        
        // Find which Sovereigns this node is connected to (distance 1)
        const rulingSovereigns = new Set<string>();
        neighbors.forEach(n => {
            if (sovereigns.has(n)) rulingSovereigns.add(n);
            // Also check neighbors of neighbors (distance 2) for gravity? 
            // No, keep it simple. Direct connection matters most.
        });

        if (rulingSovereigns.size === 1) {
            // EXCLUSIVE LOYALTY -> Inherit Color
            const kingId = Array.from(rulingSovereigns)[0];
            nodeColorMap.set(node.id, nodeColorMap.get(kingId)!);
        } else if (rulingSovereigns.size > 1) {
            // CONFLICT OF INTEREST -> NEUTRAL (Grey)
            // This is the "Bridge" node.
            nodeColorMap.set(node.id, '#52525B'); // Zinc-600
        } else {
            // ORPHAN or Distant -> Neutral
            nodeColorMap.set(node.id, '#52525B');
        }
    });

    // D. Construct Visual Nodes
    const rawNodes: Node[] = [];
    const NEUTRAL_COLOR = '#52525B';

    repo.files.forEach(file => {
        const isSovereign = sovereigns.has(file.id);
        const myColor = nodeColorMap.get(file.id) || NEUTRAL_COLOR;
        const isNeutral = myColor === NEUTRAL_COLOR;
        const deg = degree.get(file.id) || 0;

        let width = 160;
        let fontSize = 12;
        let zIndex = 1;

        if (isSovereign) {
            width = 180 + (Math.min(deg, 10) * 5);
            fontSize = 14;
            zIndex = 10;
        } else {
            width = 140;
        }

        let style: React.CSSProperties = {
            background: '#030303',
            color: isSovereign ? '#fff' : '#A1A1AA', // Sovereigns are White text, others Grey
            border: `1px solid ${myColor}`,
            boxShadow: `0 4px 10px -2px rgba(0, 0, 0, 0.8)`,
            borderRadius: '2px',
            padding: '12px',
            fontFamily: 'monospace',
            textAlign: 'center',
            width: width,
            fontSize: `${fontSize}px`,
            transition: 'all 0.3s ease',
            zIndex
        };

        if (isSovereign) {
            style = {
                ...style,
                borderWidth: '2px',
                fontWeight: 'bold',
                boxShadow: `0 0 15px ${myColor}30`, // Soft glow for Sovereigns
            };
        } else if (isNeutral) {
            // Bridge Nodes get dashed lines to signify "Connection/Transit"
            style = {
                ...style,
                borderStyle: 'dashed',
                opacity: 0.8
            }
        }

        rawNodes.push({
            id: file.id,
            data: { label: file.name.replace('.md', '') },
            position: { x: 0, y: 0 },
            connectable: true,
            style
        });
    });

    // E. Edges are strictly neutral unless interacting
    const finalEdges = rawEdges.map(edge => ({
        ...edge,
        style: { ...edge.style, stroke: '#27272A' }, 
        markerEnd: { ...edge.markerEnd, color: '#27272A' }
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, finalEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

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
                PROTOCOL: Sovereignty & Neutrality // {nodes.length} Nodes
            </div>
            <div className="font-mono text-[10px] text-zenith-muted mt-1">
                Bridges are Neutral (Dashed). Sovereigns are Colored.
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