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
  // We respect the style passed from the parent (which determines solid vs dashed)
  const baseColor = style.stroke?.toString() || '#27272A';
  
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
      strokeDasharray: 'none', // Force solid on hover for clarity
      filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.6))',
      transition: 'all 0.3s ease',
      zIndex: 100
  };

  // Normal State
  const defaultStyle = {
      ...style,
      // Stroke is handled by parent style (solid/dashed)
      // We just ensure opacity and transitions here
      opacity: 0.8,
      transition: 'all 0.3s ease',
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={{...markerEndSafe, color: isHovered ? '#ef4444' : baseColor} as any} style={isHovered ? activeStyle : defaultStyle} />
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
            style={{ color: isHovered ? 'white' : baseColor }}
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
  
  // Legend State
  const [showLegend, setShowLegend] = useState(false);

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

  // --- 2. SOVEREIGNTY & CONNECTION ALGORITHM ---
  useEffect(() => {
    if (!repo) return;

    // A. Init Data Structures
    const fileMap = new Map<string, string>();
    repo.files.forEach(f => fileMap.set(f.name, f.id));
    repo.files.forEach(f => fileMap.set(f.name.replace('.md', ''), f.id)); 
    const idToName = new Map<string, string>();
    repo.files.forEach(f => idToName.set(f.id, f.name.replace('.md', '')));

    const adjacency = new Map<string, string[]>(); // Neighbors for layout/clustering
    const degree = new Map<string, number>();
    
    // Registry to track directional links: "sourceId|targetId"
    const connectionRegistry = new Set<string>();
    // List to iterate for edge creation
    const rawConnections: { source: string, target: string, targetName: string }[] = [];

    repo.files.forEach(f => {
        adjacency.set(f.id, []);
        degree.set(f.id, 0);
    });

    // B. Parse Content & Build Link Registry
    repo.files.forEach(sourceFile => {
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        // Use a set to avoid duplicate edges from the same file to the same target (e.g. multiple links)
        const fileLinks = new Set<string>();

        while ((match = linkRegex.exec(sourceFile.content)) !== null) {
            const targetName = match[1];
            let targetId = fileMap.get(targetName);
            if (!targetId) targetId = fileMap.get(targetName + '.md');

            if (targetId && targetId !== sourceFile.id) {
                if (!fileLinks.has(targetId)) {
                    fileLinks.add(targetId);
                    
                    // Register the directional link
                    connectionRegistry.add(`${sourceFile.id}|${targetId}`);
                    rawConnections.push({
                        source: sourceFile.id,
                        target: targetId,
                        targetName: idToName.get(targetId) || targetName
                    });

                    // Build Undirected stats for Clustering
                    adjacency.get(sourceFile.id)?.push(targetId);
                    adjacency.get(targetId)?.push(sourceFile.id);
                    
                    degree.set(sourceFile.id, (degree.get(sourceFile.id) || 0) + 1);
                    degree.set(targetId, (degree.get(targetId) || 0) + 1);
                }
            }
        }
    });

    // C. Identify SOVEREIGNS (Mother Nodes)
    // Rule: A Sovereign is a node that is a local maximum of connectivity
    const sortedNodes = [...repo.files].sort((a, b) => {
        const degA = degree.get(a.id) || 0;
        const degB = degree.get(b.id) || 0;
        if (a.name.toLowerCase() === 'readme.md') return -1;
        if (b.name.toLowerCase() === 'readme.md') return 1;
        return degB - degA; 
    });

    const sovereigns = new Set<string>();
    const nodeColorMap = new Map<string, string>();
    let colorIdx = 0;
    
    // 1. README
    const readme = repo.files.find(f => f.name.toLowerCase() === 'readme.md');
    if (readme) {
        sovereigns.add(readme.id);
        nodeColorMap.set(readme.id, CLUSTER_PALETTES[colorIdx % CLUSTER_PALETTES.length]);
        colorIdx++;
    }

    // 2. Hubs
    sortedNodes.forEach(node => {
        if (sovereigns.has(node.id)) return;
        const myDegree = degree.get(node.id) || 0;
        if (myDegree < 2) return;

        const neighbors = adjacency.get(node.id) || [];
        const connectedToSovereign = neighbors.some(n => sovereigns.has(n));

        if (!connectedToSovereign) {
             sovereigns.add(node.id);
             nodeColorMap.set(node.id, CLUSTER_PALETTES[colorIdx % CLUSTER_PALETTES.length]);
             colorIdx++;
        }
    });

    // D. Assign Subjects and Neutrals
    const NEUTRAL_COLOR = '#52525B';
    repo.files.forEach(node => {
        if (sovereigns.has(node.id)) return;

        const neighbors = adjacency.get(node.id) || [];
        const rulingSovereigns = new Set<string>();
        neighbors.forEach(n => {
            if (sovereigns.has(n)) rulingSovereigns.add(n);
        });

        if (rulingSovereigns.size === 1) {
            const kingId = Array.from(rulingSovereigns)[0];
            nodeColorMap.set(node.id, nodeColorMap.get(kingId)!);
        } else {
            nodeColorMap.set(node.id, NEUTRAL_COLOR);
        }
    });

    // E. Construct Visual Nodes
    const rawNodes: Node[] = [];

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
            color: isSovereign ? '#fff' : '#A1A1AA',
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
                boxShadow: `0 0 15px ${myColor}30`,
            };
        } else if (isNeutral) {
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

    // F. Construct Visual Edges with Directionality Check
    const finalEdges = rawConnections.map(conn => {
        // Check Reciprocity
        // Does target also link to source?
        const isBiDirectional = connectionRegistry.has(`${conn.target}|${conn.source}`);
        
        return {
            id: `${conn.source}-${conn.target}`,
            source: conn.source,
            target: conn.target,
            type: 'custom-delete', 
            animated: false,
            // Styling Logic based on Directionality
            style: { 
                strokeWidth: 1,
                // SOLID if Bi-Directional, DASHED if Uni-Directional
                strokeDasharray: isBiDirectional ? 'none' : '4 4',
                // Slightly darker for dashed to push them to background
                stroke: isBiDirectional ? '#52525B' : '#27272A', 
            }, 
            markerEnd: { 
                type: MarkerType.ArrowClosed,
                color: isBiDirectional ? '#52525B' : '#27272A',
            },
            data: {
                sourceName: idToName.get(conn.source),
                targetName: conn.targetName,
                onDelete: () => {
                    if (onDisconnectNodes) onDisconnectNodes(conn.source, conn.target);
                }
            },
        };
    });

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
            <div className="absolute top-16 right-4 z-50 w-72 bg-black/90 backdrop-blur border border-zenith-border shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="font-mono text-[10px] text-zenith-muted uppercase tracking-widest mb-4 border-b border-zenith-border pb-2">
                    Visual Taxonomy
                </h4>
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
                    
                    <div className="h-px bg-zenith-border my-2"></div>

                    {/* Edge Styles */}
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
                PROTOCOL: Sovereignty & Neutrality // {nodes.length} Nodes
            </div>
            <div className="font-mono text-[10px] text-zenith-muted mt-1">
                Solid lines = Mutual Links. Dashed = Single Reference.
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