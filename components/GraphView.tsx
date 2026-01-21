import React, { useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Background, 
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  ConnectionLineType,
  useReactFlow,
  Connection
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
}

// Custom Dark Theme styles for React Flow
const flowStyles = {
    background: '#030303',
};

const GraphView: React.FC<GraphViewProps> = ({ repo, onAddFile, onLinkNodes }) => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

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
    repo.files.forEach(f => fileMap.set(f.name.replace('.md', ''), f.id)); // Handle no-extension links

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
                    type: 'smoothstep', // 'default', 'straight', 'step', 'smoothstep', 'simplebezier'
                    animated: true,
                    style: { stroke: '#52525B' },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#52525B',
                    },
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

  }, [repo, getLayoutedElements, setNodes, setEdges, fitView]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
      navigate(`/${repo.id}/${node.id}`);
  };

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && onLinkNodes) {
        onLinkNodes(params.source, params.target);
    }
  }, [onLinkNodes]);

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
                Drag handles to link nodes
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
import { ReactFlowProvider } from '@xyflow/react';

const ReactFlowProviderWrapper: React.FC<GraphViewProps> = (props) => {
    return (
        <ReactFlowProvider>
            <GraphView {...props} />
        </ReactFlowProvider>
    );
}

export default GraphViewWrapper;