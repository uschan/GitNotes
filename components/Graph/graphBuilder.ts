import dagre from 'dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { Repository } from '../../types';
import { SOVEREIGN_PALETTES } from './GraphLegend';

// Layout configuration
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
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
};

export interface GraphData {
    nodes: Node[];
    edges: Edge[];
}

export const buildGraphData = (
    repos: Repository[], 
    activeRepoId: string, 
    scope: 'local' | 'global',
    onDisconnectNodes?: (s: string, t: string) => void
): GraphData => {
    if (!repos || repos.length === 0) return { nodes: [], edges: [] };

    // A. PRE-PROCESSING: Build the "Universe"
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
        // GALAXY (Smart Context)
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

            // Incoming neighbors
            const incoming = globalIncoming.get(rootId);
            if (incoming) {
                incoming.forEach(sourceId => filesToRenderSet.add(sourceId));
            }
        });
    }

    // D. FINALIZE NODE LIST
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

    return getLayoutedElements(rawNodes, finalEdges);
};