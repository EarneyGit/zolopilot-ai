import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const TreeNode = ({ node, onUpdate, isRoot = false, level = 0, position = { x: 0, y: 0 }, nodeIndex = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text || node.title || '');
  const nodeRef = useRef(null);

  // Handle text editing
  const handleEdit = () => {
    setIsEditing(true);
    setEditText(node.text || node.title || '');
  };

  const handleSave = () => {
    if (editText.trim() !== (node.text || node.title)) {
      const updatedNode = { ...node, text: editText.trim(), title: editText.trim() };
      onUpdate(updatedNode);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(node.text || node.title || '');
      setIsEditing(false);
    }
  };

  // Add child node
  const addChild = () => {
    const newChild = {
      id: uuidv4(),
      text: 'New Node',
      title: 'New Node',
      children: []
    };
    const updatedNode = {
      ...node,
      children: [...(node.children || []), newChild]
    };
    onUpdate(updatedNode);
  };

  // Delete node (not allowed for root)
  const deleteNode = () => {
    if (isRoot) return;
    onUpdate(null); // Signal to parent to remove this node
  };

  // Update child node
  const updateChild = (index, updatedChild) => {
    if (updatedChild === null) {
      // Delete child
      const updatedNode = {
        ...node,
        children: (node.children || []).filter((_, i) => i !== index)
      };
      onUpdate(updatedNode);
    } else {
      // Update child
      const updatedNode = {
        ...node,
        children: (node.children || []).map((child, i) => i === index ? updatedChild : child)
      };
      onUpdate(updatedNode);
    }
  };

  // Get node styling based on level with different colors for better differentiation
  const getNodeStyle = () => {
    const baseTransition = 'relative text-white rounded-lg shadow-lg group cursor-pointer transition-all duration-200 hover:shadow-xl';
    
    if (isRoot) {
      // Main root node - dark blue theme
      return `${baseTransition} bg-blue-900 border border-blue-700 hover:bg-blue-800 p-4 text-lg font-bold min-w-[200px] max-w-[300px]`;
    } else if (level === 1) {
      // Sub-main nodes - completely distinct vibrant colors for maximum differentiation
      const colors = [
        'bg-green-600 border border-green-400 hover:bg-green-500',     // Bright Green
        'bg-purple-600 border border-purple-400 hover:bg-purple-500',   // Bright Purple
        'bg-orange-600 border border-orange-400 hover:bg-orange-500',   // Bright Orange
        'bg-blue-600 border border-blue-400 hover:bg-blue-500',         // Bright Blue
        'bg-pink-600 border border-pink-400 hover:bg-pink-500',         // Bright Pink
        'bg-red-600 border border-red-400 hover:bg-red-500',            // Bright Red
        'bg-yellow-600 border border-yellow-400 hover:bg-yellow-500',   // Bright Yellow
        'bg-teal-600 border border-teal-400 hover:bg-teal-500',         // Bright Teal
        'bg-indigo-600 border border-indigo-400 hover:bg-indigo-500',   // Bright Indigo
        'bg-lime-600 border border-lime-400 hover:bg-lime-500',         // Bright Lime
        'bg-rose-600 border border-rose-400 hover:bg-rose-500',         // Bright Rose
        'bg-cyan-600 border border-cyan-400 hover:bg-cyan-500',         // Bright Cyan
        'bg-amber-600 border border-amber-400 hover:bg-amber-500',      // Bright Amber
        'bg-violet-600 border border-violet-400 hover:bg-violet-500',   // Bright Violet
        'bg-emerald-600 border border-emerald-400 hover:bg-emerald-500' // Bright Emerald
      ];
      
      // Use node index to ensure each of the 15 sub-main nodes gets a unique color
       const colorIndex = nodeIndex % colors.length;
       const colorClass = colors[colorIndex] || colors[0];
      
      return `${baseTransition} ${colorClass} p-3 text-md font-semibold min-w-[180px] max-w-[250px]`;
    } else {
      // Deeper level nodes - neutral gray theme
      return `${baseTransition} bg-gray-700 border border-gray-500 hover:bg-gray-600 p-2 text-sm min-w-[160px] max-w-[220px]`;
    }
  };

  const nodeText = node.text || node.title || 'Untitled';

  return (
    <div className="relative flex flex-col items-center">
      {/* Node */}
      <div
        ref={nodeRef}
        data-node-id={node.id}
        data-level={level}
        className={getNodeStyle()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleEdit();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          zIndex: 10
        }}
      >
        {/* Edit/Delete buttons */}
        {!isRoot && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode();
              }}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}

        {/* Add child button */}
        <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addChild();
            }}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            title="Add Child"
          >
            +
          </button>
        </div>

        {/* Node text */}
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-2 border-white border-dashed resize-none text-current p-1 rounded focus:outline-none"
            autoFocus
            rows={Math.max(1, Math.ceil(editText.length / 20))}
          />
        ) : (
          <div className="text-center break-words">{nodeText}</div>
        )}
      </div>
    </div>
  );
};

const TreeView = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onAddTask,
  zoomLevel = 1,
  panPosition = { x: 0, y: 0 },
  onPanChange,
  onZoomChange
}) => {
  const [nodePositions, setNodePositions] = useState(new Map());
  const [connections, setConnections] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Calculate actual node dimensions based on content
  const calculateNodeDimensions = (node, level) => {
    const text = node.text || node.title || 'Untitled';
    const baseWidth = level === 0 ? 200 : level === 1 ? 180 : 160;
    const maxWidth = level === 0 ? 300 : level === 1 ? 250 : 220;
    
    // Estimate width based on text length (rough approximation)
    const estimatedWidth = Math.min(maxWidth, Math.max(baseWidth, text.length * 8 + 40));
    
    // Estimate height based on text wrapping
    const charsPerLine = Math.floor((estimatedWidth - 40) / 8); // Account for padding
    const lines = Math.ceil(text.length / charsPerLine);
    const baseHeight = level === 0 ? 80 : level === 1 ? 60 : 50; // Increased base heights for better visual hierarchy
    const estimatedHeight = baseHeight + (lines - 1) * 20; // Additional height per line
    
    // Ensure minimum heights to maintain visual hierarchy and consistent spacing perception
    const minHeight = level === 0 ? 80 : level === 1 ? 60 : 50;
    return { width: estimatedWidth, height: Math.max(estimatedHeight, minHeight) };
  };

  // Fixed node dimensions based on level - fallback for layout calculations
  const getNodeDimensions = (level) => {
    if (level === 0) {
      return { width: 300, height: 100 }; // Root node: use max-w-[300px] + padding for consistent spacing
    } else if (level === 1) {
      return { width: 250, height: 85 }; // Level 1: use max-w-[250px] + padding for consistent spacing
    } else {
      return { width: 220, height: 75 }; // Level 2+: use max-w-[220px] + padding for consistent spacing
    }
  };

  // Recalculate connections using actual DOM dimensions with precise alignment
  const recalculateConnectionsWithActualDimensions = () => {
    const nodeElements = document.querySelectorAll('[data-node-id]');
    const actualNodeInfo = new Map();
    
    // Get container reference for coordinate calculations
    const container = containerRef.current;
    if (!container) return;
    
    // Get actual node information including dimensions and positions
    nodeElements.forEach(element => {
      const nodeId = element.getAttribute('data-node-id');
      const position = nodePositions.get(nodeId);
      
      if (position && element) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate coordinates relative to the container
        const centerX = position.x + rect.width / 2;
        const centerY = position.y + rect.height / 2;
        const topY = position.y;
        const bottomY = position.y + rect.height;
        
        actualNodeInfo.set(nodeId, { 
          centerX, 
          centerY, 
          topY, 
          bottomY, 
          level: position.level,
          width: rect.width,
          height: rect.height
        });
      }
    });
    
    // Only update connections if we have valid node info
    if (actualNodeInfo.size > 0) {
      const updatedConnections = [];
      connections.forEach(connection => {
        const fromNode = actualNodeInfo.get(connection.from.nodeId);
        const toNode = actualNodeInfo.get(connection.to.nodeId);
        
        if (fromNode && toNode) {
          // Use precise connection points for straight lines
          let fromX, fromY, toX, toY;
          
          if (toNode.level === 1) {
            // Horizontal connection from main node to sub-main nodes
            fromX = fromNode.centerX;
            fromY = fromNode.bottomY; // Bottom of parent
            toX = toNode.centerX;
            toY = toNode.topY; // Top of child
          } else {
            // Vertical connection for deeper levels
            fromX = fromNode.centerX;
            fromY = fromNode.bottomY; // Bottom of parent
            toX = toNode.centerX;
            toY = toNode.topY; // Top of child
          }
          
          const updatedConnection = {
            ...connection,
            from: { ...connection.from, x: fromX, y: fromY },
            to: { ...connection.to, x: toX, y: toY }
          };
          
          updatedConnections.push(updatedConnection);
        }
      });
      
      if (updatedConnections.length > 0) {
        setConnections(updatedConnections);
      }
    }
  };

  // Calculate tree layout positions
  const calculateTreeLayout = (tasks) => {
    const positions = new Map();
    const connectionLines = [];
    // Optimized spacing for 15 sub-main nodes horizontally
    const HORIZONTAL_SPACING = 280; // Spacing for 15 nodes to fit horizontally
    const VERTICAL_SPACING = 80; // Increased vertical spacing for better separation
    
    // Calculate canvas center - ensure we get actual dimensions
    const canvas = canvasRef.current;
    let canvasWidth = 1200; // Default fallback
    let canvasHeight = 800; // Default fallback
    
    if (canvas) {
      // Force a layout calculation to get accurate dimensions
      const rect = canvas.getBoundingClientRect();
      canvasWidth = rect.width || canvas.clientWidth || canvas.offsetWidth || 1200;
      canvasHeight = rect.height || canvas.clientHeight || canvas.offsetHeight || 800;
    }
    
    // Position main node at center of the visible canvas area
    // Account for the container transform offset (-100vw, -100vh)
    const centerX = canvasWidth + (canvasWidth / 2); // Center of the middle viewport
    const centerY = canvasHeight + 150; // Slightly below center of middle viewport
    
    const positionNode = (node, x, y, level = 0, parentPos = null) => {
      const nodeDimensions = getNodeDimensions(level);
      
      // Store position as top-left corner for rendering (x is center, convert to top-left)
      const nodeTopLeftX = x - nodeDimensions.width / 2;
      const nodeTopLeftY = y;
      positions.set(node.id, { x: nodeTopLeftX, y: nodeTopLeftY, level });
      
      // Add connection line to parent if not root
      if (parentPos && level > 0) {
        // Calculate precise connection points for straight lines
        const parentCenterX = parentPos.centerX;
        const parentCenterY = parentPos.centerY;
        const childCenterX = x; // x is already the center
        const childCenterY = y + nodeDimensions.height / 2;
        
        // For level 0->1 (horizontal layout): connect from bottom of parent to top of child
        // For level 1+ (vertical layout): connect from bottom of parent to top of child
        let fromX, fromY, toX, toY;
        
        if (level === 1) {
          // Horizontal connection from main node to sub-main nodes
          fromX = parentCenterX;
          fromY = parentPos.centerY + getNodeDimensions(0).height / 2; // Bottom of parent
          toX = childCenterX;
          toY = y; // Top of child
        } else {
          // Vertical connection for deeper levels
          fromX = parentCenterX;
          fromY = parentPos.centerY + getNodeDimensions(level - 1).height / 2; // Bottom of parent
          toX = childCenterX;
          toY = y; // Top of child
        }
        
        const connection = {
          id: `${parentPos.nodeId}-${node.id}`,
          from: { x: fromX, y: fromY, nodeId: parentPos.nodeId },
          to: { x: toX, y: toY, nodeId: node.id },
          level
        };
        
        connectionLines.push(connection);
      }
      
      // Position children based on level
      if (node.children && node.children.length > 0) {
        if (level === 0) {
          // Level 0: Main node - arrange all 15 sub-main nodes horizontally
          const childrenCount = node.children.length;
          const totalWidth = (childrenCount - 1) * HORIZONTAL_SPACING;
          const childStartX = x - totalWidth / 2;
          const parentDimensions = calculateNodeDimensions(node, level);
          const childY = y + parentDimensions.height + VERTICAL_SPACING; // Content-aware spacing below main node
          
          node.children.forEach((child, index) => {
            const childX = childStartX + index * HORIZONTAL_SPACING;
            positionNode(
              child, 
              childX, 
              childY, 
              level + 1, 
              { centerX: x, centerY: y + parentDimensions.height / 2, nodeId: node.id, level: level }
            );
          });
        } else {
          // Level 1+: Sub-main nodes and beyond - arrange children vertically with content-aware spacing
          const parentDimensions = calculateNodeDimensions(node, level);
          let currentY = y + parentDimensions.height + VERTICAL_SPACING;
          
          node.children.forEach((child, index) => {
            const childX = x; // Same X position as parent (vertical alignment)
            
            // Position child at current Y position
            positionNode(
              child, 
              childX, 
              currentY, 
              level + 1, 
              { centerX: x, centerY: y + parentDimensions.height / 2, nodeId: node.id, level: level }
            );
            
            // Calculate next Y position using actual child dimensions for accurate spacing
            const childDimensions = calculateNodeDimensions(child, level + 1);
            currentY += childDimensions.height + VERTICAL_SPACING;
          });
        }
      }
    };
    
    // Position the main root node at center
    if (tasks && tasks.length > 0) {
      // Assume first task is the main node
      const mainTask = tasks[0];
      positionNode(mainTask, centerX, centerY, 0);
    }
    
    setNodePositions(positions);
    setConnections(connectionLines);
  };



  // Initialize layout when tasks change
  useEffect(() => {
    if (tasks && tasks.length > 0 && canvasRef.current) {
      // Small delay to ensure canvas dimensions are available
      const timer = setTimeout(() => {
        calculateTreeLayout(tasks);
        
        // Recalculate connections with actual DOM dimensions after rendering
        const recalcTimer = setTimeout(() => {
          recalculateConnectionsWithActualDimensions();
          
          // Debug logging for mobile issues
          if (window.innerWidth <= 768) {
            console.log('Mobile TreeView - Connections:', connections.length);
            console.log('Mobile TreeView - Node positions:', nodePositions.size);
          }
        }, 500);
        
        return () => clearTimeout(recalcTimer);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [canvasRef.current, tasks]);

  // Add resize observer to recalculate layout when canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tasks || tasks.length === 0) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce resize events
      const timer = setTimeout(() => {
        calculateTreeLayout(tasks);
        
        // Recalculate connections after layout update
        const recalcTimer = setTimeout(() => {
          recalculateConnectionsWithActualDimensions();
        }, 300);
        
        return () => clearTimeout(recalcTimer);
      }, 150);
      
      return () => clearTimeout(timer);
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [tasks]);

  // Canvas mouse and touch handlers for infinite panning
  const handlePointerDown = useCallback((e) => {
    // Simplified approach: if it's not a TreeNode element, allow dragging
    const target = e.target;
    const isTreeNode = target.closest('.bg-gray-800') || 
                      target.closest('button') || 
                      target.closest('textarea') ||
                      target.tagName?.toLowerCase() === 'button' ||
                      target.tagName?.toLowerCase() === 'textarea';
    
    if (!isTreeNode) {
      setIsDragging(true);
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      setDragStart({ x: clientX - panPosition.x, y: clientY - panPosition.y });
      e.preventDefault();
    }
  }, [panPosition.x, panPosition.y]);

  const handlePointerMove = useCallback((e) => {
    if (isDragging && onPanChange) {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;
      onPanChange({ x: newX, y: newY });
      e.preventDefault();
    }
  }, [isDragging, dragStart.x, dragStart.y, onPanChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Helper function to calculate distance between two touch points
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle pinch-to-zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      setIsPinching(true);
      setIsDragging(false);
      const distance = getTouchDistance(e.touches);
      setLastPinchDistance(distance);
      setInitialZoom(zoomLevel);
      e.preventDefault();
    } else if (e.touches.length === 1 && !isPinching) {
      // Single finger - start panning
      const target = e.target;
      const isTreeNode = target.closest('.bg-gray-800') || 
                        target.closest('button') || 
                        target.closest('textarea') ||
                        target.tagName?.toLowerCase() === 'button' ||
                        target.tagName?.toLowerCase() === 'textarea';
      
      if (!isTreeNode) {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
        e.preventDefault();
      }
    }
  }, [zoomLevel, isPinching, panPosition.x, panPosition.y]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isPinching && onZoomChange) {
      // Two fingers - pinch zoom
      const distance = getTouchDistance(e.touches);
      if (lastPinchDistance > 0) {
        const scale = distance / lastPinchDistance;
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * scale));
        onZoomChange(newZoom);
      }
      e.preventDefault();
    } else if (e.touches.length === 1 && isDragging && onPanChange && !isPinching) {
      // Single finger - pan
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      onPanChange({ x: newX, y: newY });
      e.preventDefault();
    }
  }, [isPinching, lastPinchDistance, initialZoom, isDragging, dragStart.x, dragStart.y, onZoomChange, onPanChange]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      setLastPinchDistance(0);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    if (onZoomChange) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
      onZoomChange(newZoom);
    }
  }, [zoomLevel, onZoomChange]);

  // Add event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use capture phase for pointer events to ensure we catch it before child elements
    canvas.addEventListener('mousedown', handlePointerDown, true);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown, true);
      canvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  // Update task function
  const updateTask = (taskId, updatedTask) => {
    const updateTaskInArray = (taskArray, targetId, newTask) => {
      return taskArray.map(task => {
        if (task.id === targetId) {
          return newTask;
        }
        if (task.children && task.children.length > 0) {
          return {
            ...task,
            children: updateTaskInArray(task.children, targetId, newTask)
          };
        }
        return task;
      });
    };
    
    if (updatedTask === null) {
      // Delete task
      onDeleteTask(taskId);
    } else {
      onUpdateTask(updatedTask);
    }
  };

  // Render all tasks recursively
  const renderTasks = (taskArray, level = 0, parentIndex = 0) => {
    return taskArray.map((task, index) => {
      const position = nodePositions.get(task.id) || { x: 0, y: 0 };
      
      // For level 1 nodes (sub-main nodes), use the index within the current taskArray
      // This ensures each of the 15 sub-main nodes gets a unique index (0-14)
      let nodeIndex = index;
      
      return (
        <div key={task.id}>
          <TreeNode
            node={task}
            onUpdate={(updatedTask) => updateTask(task.id, updatedTask)}
            isRoot={level === 0}
            level={level}
            position={position}
            nodeIndex={nodeIndex}
          />
          {task.children && task.children.length > 0 && renderTasks(task.children, level + 1, index)}
        </div>
      );
    });
  };

  return (
    <div className="tree-view h-full relative overflow-hidden">
      {/* Infinite Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 tree-canvas-area"
        style={{
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 1px 1px, #212C32 1px, transparent 0),
            #0D1518
          `,
          backgroundSize: '20px 20px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <div
          ref={containerRef}
          className="relative"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            willChange: isDragging ? 'transform' : 'auto',
            width: '300vw',
            height: '300vh',
            left: '-100vw',
            top: '-100vh'
          }}
        >
        {/* SVG for connection lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ 
            zIndex: 1,
            overflow: 'visible',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
        >
          {connections.map(connection => {
            // Skip invalid connections
            const { from, to, level } = connection;
            if (!from || !to || 
                typeof from.x !== 'number' || typeof from.y !== 'number' ||
                typeof to.x !== 'number' || typeof to.y !== 'number' ||
                isNaN(from.x) || isNaN(from.y) || isNaN(to.x) || isNaN(to.y)) {
              return null;
            }
            
            // Use L-shaped connection lines for all levels with precise alignment
            const fromX = Math.round(from.x);
            const fromY = Math.round(from.y);
            const toX = Math.round(to.x);
            const toY = Math.round(to.y);
            const midY = Math.round(fromY + (toY - fromY) / 2);
            
            return (
              <g key={connection.id}>
                {/* Vertical line from parent */}
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={fromX}
                  y2={midY}
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  shapeRendering="crispEdges"
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
                {/* Horizontal line */}
                <line
                  x1={fromX}
                  y1={midY}
                  x2={toX}
                  y2={midY}
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  shapeRendering="crispEdges"
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
                {/* Vertical line to child */}
                <line
                  x1={toX}
                  y1={midY}
                  x2={toX}
                  y2={toY}
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  shapeRendering="crispEdges"
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
              </g>
            );
          }).filter(Boolean)}
        </svg>
        
        {/* Render all tasks */}
        <div className="relative" style={{ zIndex: 10 }}>
          {tasks && tasks.length > 0 && (
            <>
              {/* Render root node */}
              <TreeNode
                node={tasks[0]}
                onUpdate={(updatedTask) => updateTask(tasks[0].id, updatedTask)}
                isRoot={true}
                level={0}
                position={nodePositions.get(tasks[0].id) || { x: 0, y: 0 }}
                nodeIndex={0}
              />
              {/* Render children of root node with proper indexing */}
              {tasks[0].children && tasks[0].children.length > 0 && renderTasks(tasks[0].children, 1, 0)}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default TreeView;