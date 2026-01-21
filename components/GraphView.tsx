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

// --- COLOR PALETTES ---
const SOVEREIGN_PALETTES = [
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
      strokeDasharray: 'none', 
      filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.6))',
      transition: 'all 0.3s ease',
      zIndex: 100
  };

  // Normal State
  const defaultStyle = {
      ...style,
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

const GraphView: React.FC<GraphViewProps> = ({ repos, activeRepoId, scope, onAddFile, onLinkNodes, onDisconnectNodes }) => {
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

  // --- 2. GRAPH ALGORITHM ---
  useEffect(() => {
    if (!repos || repos.length === 0) return;

    // A. PRE-PROCESSING: Build the "Universe"
    // We need to know about ALL files to resolve links, even if we don't display them all.
    const allFiles = repos.flatMap(r => r.files.map(f => ({ ...f, _repoId: r.id, _repoName: r.name })));
    
    // Quick Lookup Maps
    const globalNameMap = new Map<string, string>(); // Name -> ID
    const globalNodeDataMap = new Map<string, { name: string, repoId: string, repoName: string }>(); 
    
    allFiles.forEach(f => {
        globalNameMap.set(f.name, f.id);
        globalNameMap.set(f.name.replace('.md', ''), f.id);
        globalNodeDataMap.set(f.id, { name: f.name.replace('.md', ''), repoId: f._repoId, repoName: f._repoName });
    });

    // B. BUILD GLOBAL ADJACENCY LIST
    // We scan EVERYTHING first to establish the full network. 
    // This allows us to find incoming links from "invisible" repos.
    const globalAdjacency = new Map<string, Set<string>>(); // sourceId -> Set<targetId>
    const globalIncoming = new Map<string, Set<string>>();  // targetId -> Set<sourceId>
    
    allFiles.forEach(f => {
        if (!globalAdjacency.has(f.id)) globalAdjacency.set(f.id, new Set());
        if (!globalIncoming.has(f.id)) globalIncoming.set(f.id, new Set());
    });

    const connectionRegistry = new Set<string>(); // "source|target" for bi-directional check

    allFiles.forEach(sourceFile => {
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = linkRegex.exec(sourceFile.content)) !== null) {
            const targetName = match[1];
            let targetId = globalNameMap.get(targetName);
            if (!targetId) targetId = globalNameMap.get(targetName + '.md');

            if (targetId && targetId !== sourceFile.id) {
                // Register valid connection
                globalAdjacency.get(sourceFile.id)?.add(targetId);
                globalIncoming.get(targetId)?.add(sourceFile.id);
                connectionRegistry.add(`${sourceFile.id}|${targetId}`);
            }
        }
    });

    // C. FILTERING (SMART CONTEXT)
    const filesToRenderSet = new Set<string>();

    if (scope === 'local') {
        // Simple: Only active repo files
        const activeRepoFiles = repos.find(r => r.id === activeRepoId)?.files || [];
        activeRepoFiles.forEach(f => filesToRenderSet.add(f.id));
    } else {
        // GALAXY (Smart Context):
        // 1. Add ALL files from Active Repo
        // 2. Add ANY file from OTHER Repos that is DIRECTLY connected (Incoming OR Outgoing) to Active Repo files
        
        const activeRepoFiles = repos.find(r => r.id === activeRepoId)?.files || [];
        const activeRepoFileIds = new Set(activeRepoFiles.map(f => f.id));

        // Add Active Repo Files
        activeRepoFileIds.forEach(id => filesToRenderSet.add(id));

        // Add Neighbors (Incoming/Outgoing)
        activeRepoFileIds.forEach(rootId => {
            // Outgoing neighbors
            const outgoing = globalAdjacency.get(rootId);
            if (outgoing) {
                outgoing.forEach(targetId => filesToRenderSet.add(targetId));
            }

            // Incoming neighbors (Critical for "Explosion" prevention: we scan the inverse map)
            const incoming = globalIncoming.get(rootId);
            if (incoming) {
                incoming.forEach(sourceId => filesToRenderSet.add(sourceId));
            }
        });
    }

    // D. FINALIZE NODE LIST
    // Convert Set back to Array of File objects
    const targetFiles = allFiles.filter(f => filesToRenderSet.has(f.id));

    // Calculate local degree for sizing (based on filtered view)
    const viewDegree = new Map<string, number>();
    targetFiles.forEach(f => viewDegree.set(f.id, 0));
    
    const finalConnections: { source: string, target: string }[] = [];

    // Re-scan connections ONLY among the filtered nodes
    targetFiles.forEach(sourceFile => {
        const outgoing = globalAdjacency.get(sourceFile.id);
        if (outgoing) {
            outgoing.forEach(targetId => {
                if (filesToRenderSet.has(targetId)) {
                    finalConnections.push({ source: sourceFile.id, target: targetId });
                    
                    viewDegree.set(sourceFile.id, (viewDegree.get(sourceFile.id) || 0) + 1);
                    viewDegree.set(targetId, (viewDegree.get(targetId) || 0) + 1);
                }
            });
        }
    });


    // E. ASSIGN COLORS
    const nodeColorMap = new Map<string, string>();
    const NEUTRAL_COLOR = '#52525B';

    if (scope === 'global') {
        // --- GALAXY MODE: Color by REPOSITORY ---
        repos.forEach((repo, idx) => {
            const repoColor = SOVEREIGN_PALETTES[idx % SOVEREIGN_PALETTES.length];
            repo.files.forEach(f => {
                nodeColorMap.set(f.id, repoColor);
            });
        });
    } else {
        // --- LOCAL MODE: Color by SOVEREIGNTY ---
        // (Existing Local Logic)
        const sortedNodes = [...targetFiles].sort((a, b) => {
            const degA = viewDegree.get(a.id) || 0;
            const degB = viewDegree.get(b.id) || 0;
            if (a.name.toLowerCase() === 'readme.md') return -1;
            if (b.name.toLowerCase() === 'readme.md') return 1;
            return degB - degA; 
        });

        const sovereigns = new Set<string>();
        let colorIdx = 0;
        
        const readme = targetFiles.find(f => f.name.toLowerCase() === 'readme.md');
        if (readme) {
            sovereigns.add(readme.id);
            nodeColorMap.set(readme.id, SOVEREIGN_PALETTES[colorIdx % SOVEREIGN_PALETTES.length]);
            colorIdx++;
        }

        sortedNodes.forEach(node => {
            if (sovereigns.has(node.id)) return;
            const myDegree = viewDegree.get(node.id) || 0;
            if (myDegree < 2) return;

            // Simplified Cluster check for local
            sovereigns.add(node.id);
            nodeColorMap.set(node.id, SOVEREIGN_PALETTES[colorIdx % SOVEREIGN_PALETTES.length]);
            colorIdx++;
        });

        targetFiles.forEach(node => {
            if (!nodeColorMap.has(node.id)) nodeColorMap.set(node.id, NEUTRAL_COLOR);
        });
    }

    // F. CONSTRUCT NODES
    const rawNodes: Node[] = targetFiles.map(file => {
        const myColor = nodeColorMap.get(file.id) || NEUTRAL_COLOR;
        const deg = viewDegree.get(file.id) || 0;
        const isNeutral = myColor === NEUTRAL_COLOR;
        const isExternal = file._repoId !== activeRepoId;

        // Size calculation
        let baseWidth = scope === 'global' ? 140 : 160;
        let width = baseWidth;
        let fontSize = 12;
        let zIndex = 1;

        const isImportant = deg > 2 || (scope === 'global' && isExternal);

        if (isImportant) {
            width = baseWidth + (Math.min(deg, 15) * 4);
            zIndex = 10;
        }

        let style: React.CSSProperties = {
            background: '#030303',
            color: isImportant ? '#fff' : '#A1A1AA',
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

        if (isImportant) {
            style = {
                ...style,
                borderWidth: '2px',
                fontWeight: 'bold',
                boxShadow: `0 0 15px ${myColor}30`,
            };
        } else if (isNeutral && scope === 'local') {
            style = {
                ...style,
                borderStyle: 'dashed',
                opacity: 0.8
            }
        }

        return {
            id: file.id,
            data: { label: file.name.replace('.md', '') },
            position: { x: 0, y: 0 },
            connectable: true,
            style
        };
    });

    // G. CONSTRUCT EDGES
    const finalEdges = finalConnections.map(conn => {
        const isBiDirectional = connectionRegistry.has(`${conn.target}|${conn.source}`);
        const targetData = globalNodeDataMap.get(conn.target);
        const sourceData = globalNodeDataMap.get(conn.source);
        
        return {
            id: `${conn.source}-${conn.target}`,
            source: conn.source,
            target: conn.target,
            type: 'custom-delete', 
            animated: false,
            style: { 
                strokeWidth: 1,
                strokeDasharray: isBiDirectional ? 'none' : '4 4',
                stroke: isBiDirectional ? '#52525B' : '#27272A', 
            }, 
            markerEnd: { 
                type: MarkerType.ArrowClosed,
                color: isBiDirectional ? '#52525B' : '#27272A',
            },
            data: {
                sourceName: sourceData?.name,
                targetName: targetData?.name,
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

  }, [repos, activeRepoId, scope, getLayoutedElements, setNodes, setEdges, fitView, onDisconnectNodes]);

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
            <div className="absolute top-16 right-4 z-50 w-72 bg-black/90 backdrop-blur border border-zenith-border shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="font-mono text-[10px] text-zenith-muted uppercase tracking-widest mb-4 border-b border-zenith-border pb-2">
                    Visual Taxonomy
                </h4>
                
                {scope === 'global' ? (
                     <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-[10px] text-zenith-muted italic mb-2">Galaxy Mode (Context Aware):<br/>Showing active module + direct connections.</div>
                        {repos.map((r, idx) => {
                             // Simple check if this repo is visible in current graph
                             const isVisible = nodes.some(n => {
                                 // We don't have direct repo access in node data easily here without map, 
                                 // but we can infer or just list all. Listing all is safer for legend.
                                 return true; 
                             });
                             if (!isVisible) return null;

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