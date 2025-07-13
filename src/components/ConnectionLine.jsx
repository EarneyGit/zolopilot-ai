import React, { useMemo } from 'react';

const ConnectionLine = ({ 
  from, 
  to, 
  fromTask, 
  toTask, 
  onDelete, 
  isHighlighted = false 
}) => {
  // Calculate connection path with better curve logic
  const pathData = useMemo(() => {
    if (!from || !to) return '';
    
    const startX = from.x;
    const startY = from.y;
    const endX = to.x;
    const endY = to.y;
    
    const dx = endX - startX;
    const dy = endY - startY;
    
    // Calculate control points for smooth curves
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(distance * 0.3, 150); // Limit curve intensity
    
    let controlX1, controlY1, controlX2, controlY2;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal-dominant connection
      controlX1 = startX + curvature;
      controlY1 = startY;
      controlX2 = endX - curvature;
      controlY2 = endY;
    } else {
      // Vertical-dominant connection  
      controlX1 = startX;
      controlY1 = startY + curvature;
      controlX2 = endX;
      controlY2 = endY - curvature;
    }
    
    return `M ${startX},${startY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
  }, [from, to]);

  // Get connection style based on task statuses
  const connectionStyle = useMemo(() => {
    let stroke = '#64748b'; // Default slate
    let strokeWidth = 2;
    let opacity = 0.7;
    let dashArray = '0';
    
    if (fromTask && toTask) {
      if (fromTask.completed && toTask.completed) {
        stroke = '#10b981'; // Green for completed flow
        opacity = 0.8;
        strokeWidth = 2;
      } else if (fromTask.completed && !toTask.completed) {
        stroke = '#8b5cf6'; // Purple for available flow
        opacity = 0.9;
        strokeWidth = 3;
      } else if (!fromTask.completed) {
        stroke = '#6b7280'; // Gray for blocked flow
        opacity = 0.5;
        dashArray = '8,4';
      }
    }
    
    if (isHighlighted) {
      stroke = '#f59e0b'; // Amber for highlighted
      strokeWidth = 4;
      opacity = 1;
      dashArray = '0';
    }
    
    return { stroke, strokeWidth, opacity, dashArray };
  }, [fromTask, toTask, isHighlighted]);

  // Create unique marker ID
  const markerId = useMemo(() => 
    `arrow-${fromTask?.id || 'unknown'}-${toTask?.id || 'unknown'}`, 
    [fromTask?.id, toTask?.id]
  );

  if (!pathData) return null;

  return (
    <g className="connection-line">
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M2,2 L2,10 L10,6 z"
            fill={connectionStyle.stroke}
            fillOpacity={connectionStyle.opacity}
            stroke="none"
          />
        </marker>
      </defs>
      
      {/* Main connection path */}
      <path
        d={pathData}
        fill="none"
        stroke={connectionStyle.stroke}
        strokeWidth={connectionStyle.strokeWidth}
        strokeOpacity={connectionStyle.opacity}
        strokeDasharray={connectionStyle.dashArray}
        markerEnd={`url(#${markerId})`}
        className="transition-all duration-300"
        style={{ 
          filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' : 'none'
        }}
      />
      
      {/* Connection status indicator */}
      {fromTask && toTask && (
        <g>
          <circle
            cx={(from.x + to.x) / 2}
            cy={(from.y + to.y) / 2}
            r="6"
            fill={connectionStyle.stroke}
            fillOpacity={connectionStyle.opacity * 0.8}
            stroke="white"
            strokeWidth="1"
            className="transition-all duration-300"
          />
          <text
            x={(from.x + to.x) / 2}
            y={(from.y + to.y) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-white pointer-events-none"
            fontSize="8"
          >
            {fromTask.completed ? '✓' : ''}
          </text>
        </g>
      )}
      
      {/* Invisible wider path for easier interaction */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(12, connectionStyle.strokeWidth + 8)}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (onDelete) onDelete(fromTask?.id, toTask?.id);
        }}
        title={`Delete connection: ${fromTask?.title || 'Unknown'} → ${toTask?.title || 'Unknown'}`}
      >
        <animate
          attributeName="stroke"
          values="transparent;rgba(239, 68, 68, 0.2);transparent"
          dur="2s"
          repeatCount="indefinite"
          begin="mouseover.begin"
          end="mouseout.begin"
        />
      </path>
    </g>
  );
};

export default ConnectionLine; 