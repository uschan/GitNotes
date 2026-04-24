import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export const CustomDeleteEdge = ({
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
  selected,
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const baseColor = style.stroke?.toString() || '#27272A';
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
  });

  const onEdgeClick = (evt: React.MouseEvent, id: string) => {
    evt.stopPropagation();
    if (data && typeof data.onDelete === 'function') {
        (data.onDelete as () => void)();
    }
  };

  const markerEndSafe = typeof markerEnd === 'object' ? markerEnd : {};

  // Nebula Active State (Glow)
  const activeStyle = {
      ...style,
      stroke: isHovered ? '#ff4d00' : baseColor, 
      strokeWidth: isHovered ? 2 : 1,
      opacity: isHovered ? 1 : 0.4,
      filter: isHovered ? 'drop-shadow(0 0 5px rgba(255, 77, 0, 0.8))' : 'none',
      transition: 'all 0.3s ease',
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={{...markerEndSafe, color: isHovered ? '#ff4d00' : baseColor} as any} 
        style={activeStyle} 
      />
      
      {/* Invisible thicker interaction edge for easier hovering */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="cursor-pointer"
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && (
            <button
              className="w-5 h-5 bg-black border border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg animate-in zoom-in duration-200"
              onClick={(event) => onEdgeClick(event, id)}
              title="Disconnect"
            >
              <span className="font-bold">×</span>
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};