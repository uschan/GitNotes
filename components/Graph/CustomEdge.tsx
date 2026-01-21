import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';

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