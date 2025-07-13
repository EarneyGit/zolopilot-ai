import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TaskNode from './TaskNode';
import ConnectionLine from './ConnectionLine';

const FlowchartView = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onAddTask,
  showActualTasksOnly = false,
  zoomLevel = 1,
  onZoomChange,
  panPosition = { x: 0, y: 0 },
  onPanChange
}) => {
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [nodePositions, setNodePositions] = useState(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isInstructionsMinimized, setIsInstructionsMinimized] = useState(false);
  
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const isInitialized = useRef(false);

  // Memoize flat task list for better performance
  const flatTasks = useMemo(() => {
    const flattenTasks = (taskArray, level = 0) => {
      const result = [];
      taskArray.forEach(task => {
        result.push({ ...task, level });
        if (task.children && task.children.length > 0) {
          result.push(...flattenTasks(task.children, level + 1));
        }
      });
      return result;
    };
    return flattenTasks(tasks);
  }, [tasks]);

  // Initialize node positions with improved hierarchical layout
  const initializeNodePositions = useCallback(() => {
    if (tasks.length === 0) return;
    
    const positions = new Map();
    
    // Responsive node dimensions
    const getResponsiveDimensions = () => {
      const width = window.innerWidth;
      if (width < 640) { // mobile
        return {
          NODE_WIDTH: 260,
          NODE_HEIGHT: 120,
          HORIZONTAL_SPACING: 300,
          VERTICAL_SPACING: 160,
          LEVEL_INDENT: 80
        };
      } else if (width < 1024) { // tablet
        return {
          NODE_WIDTH: 290,
          NODE_HEIGHT: 130,
          HORIZONTAL_SPACING: 340,
          VERTICAL_SPACING: 180,
          LEVEL_INDENT: 90
        };
      } else { // desktop
        return {
          NODE_WIDTH: 320,
          NODE_HEIGHT: 140,
          HORIZONTAL_SPACING: 380,
          VERTICAL_SPACING: 200,
          LEVEL_INDENT: 100
        };
      }
    };
    
    const { NODE_WIDTH, NODE_HEIGHT, HORIZONTAL_SPACING, VERTICAL_SPACING, LEVEL_INDENT } = getResponsiveDimensions();
    
    // Start from center of viewport
    const VIEWPORT_CENTER_X = window.innerWidth / 2;
    const VIEWPORT_CENTER_Y = window.innerHeight / 2;
    
    let globalY = VIEWPORT_CENTER_Y - 200; // Start higher to accommodate subtasks
    
    const positionNode = (task, x, y, level = 0) => {
      positions.set(task.id, { x, y, level });
      
      let childY = y + VERTICAL_SPACING;
      
      if (task.children && task.children.length > 0) {
        const childCount = task.children.length;
        const totalChildWidth = (childCount - 1) * HORIZONTAL_SPACING;
        const childStartX = x - totalChildWidth / 2;
        
        task.children.forEach((child, index) => {
          const childX = childStartX + index * HORIZONTAL_SPACING;
          childY = Math.max(childY, positionNode(child, childX, childY, level + 1));
        });
      }
      
      return childY;
    };

    // Position root tasks
    const rootCount = tasks.length;
    const totalRootWidth = (rootCount - 1) * HORIZONTAL_SPACING;
    const rootStartX = VIEWPORT_CENTER_X - totalRootWidth / 2;
    
    tasks.forEach((task, index) => {
      const x = rootStartX + index * HORIZONTAL_SPACING;
      globalY = Math.max(globalY, positionNode(task, x, globalY, 0));
      globalY += VERTICAL_SPACING / 2; // Add some spacing between root task trees
    });
    
    setNodePositions(positions);
    isInitialized.current = true;
  }, [tasks]);

  // Initialize connections based on task dependencies
  const initializeConnections = useCallback(() => {
    const newConnections = [];
    
    flatTasks.forEach(task => {
      if (task.predecessors && task.predecessors.length > 0) {
        task.predecessors.forEach(predecessorId => {
          const connectionExists = newConnections.some(conn => 
            conn.from === predecessorId && conn.to === task.id
          );
          
          if (!connectionExists) {
            newConnections.push({
              id: uuidv4(),
              from: predecessorId,
              to: task.id,
              type: 'dependency'
            });
          }
        });
      }
    });
    
    setConnections(newConnections);
  }, [flatTasks]);

  // Initialize positions and connections when tasks change
  useEffect(() => {
    if (tasks.length > 0 && (!isInitialized.current || nodePositions.size === 0)) {
      initializeNodePositions();
      initializeConnections();
      
      // Center the view after initialization
      setTimeout(() => {
        onPanChange({ x: 0, y: 0 });
        onZoomChange(0.8);
      }, 100);
    }
  }, [tasks, initializeNodePositions, initializeConnections, onPanChange, onZoomChange]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId) => {
    setSelectedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  }, []);

  // Handle node drag start
  const handleNodeDragStart = useCallback((nodeId, startX, startY) => {
    setDraggedNodeId(nodeId);
    setIsDragging(true);
    
    const nodePos = nodePositions.get(nodeId);
    if (nodePos) {
      setDragOffset({
        x: startX - nodePos.x,
        y: startY - nodePos.y
      });
    }
  }, [nodePositions]);

  // Handle node drag
  const handleNodeDrag = useCallback((clientX, clientY) => {
    if (!draggedNodeId || !isDragging) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const canvasX = (clientX - canvasRect.left - panPosition.x) / zoomLevel;
    const canvasY = (clientY - canvasRect.top - panPosition.y) / zoomLevel;
    
    const newX = canvasX - dragOffset.x;
    const newY = canvasY - dragOffset.y;
    
    setNodePositions(prev => {
      const newPositions = new Map(prev);
      const currentPos = newPositions.get(draggedNodeId);
      if (currentPos) {
        newPositions.set(draggedNodeId, { ...currentPos, x: newX, y: newY });
      }
      return newPositions;
    });
  }, [draggedNodeId, isDragging, dragOffset, panPosition, zoomLevel]);

  // Handle node drag end
  const handleNodeDragEnd = useCallback(() => {
    setDraggedNodeId(null);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Handle connection creation
  const handleCreateConnection = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    
    const connectionExists = connections.some(conn => 
      conn.from === fromId && conn.to === toId
    );
    
    if (!connectionExists) {
      const newConnection = {
        id: uuidv4(),
        from: fromId,
        to: toId,
        type: 'dependency'
      };
      setConnections(prev => [...prev, newConnection]);
      
      // Update task dependencies
      const fromTask = flatTasks.find(task => task.id === fromId);
      const toTask = flatTasks.find(task => task.id === toId);
      
      if (fromTask && toTask) {
        // Add to successors of fromTask
        const updatedFromTask = {
          ...fromTask,
          successors: [...(fromTask.successors || []), toId]
        };
        onUpdateTask(updatedFromTask);
        
        // Add to predecessors of toTask
        const updatedToTask = {
          ...toTask,
          predecessors: [...(toTask.predecessors || []), fromId]
        };
        onUpdateTask(updatedToTask);
      }
    }
  }, [connections, flatTasks, onUpdateTask]);

  // Handle connection deletion
  const handleDeleteConnection = useCallback((fromId, toId) => {
    setConnections(prev => prev.filter(conn => 
      !(conn.from === fromId && conn.to === toId)
    ));
    
    // Update task dependencies
    const fromTask = flatTasks.find(task => task.id === fromId);
    const toTask = flatTasks.find(task => task.id === toId);
    
    if (fromTask && toTask) {
      // Remove from successors of fromTask
      const updatedFromTask = {
        ...fromTask,
        successors: (fromTask.successors || []).filter(id => id !== toId)
      };
      onUpdateTask(updatedFromTask);
      
      // Remove from predecessors of toTask
      const updatedToTask = {
        ...toTask,
        predecessors: (toTask.predecessors || []).filter(id => id !== fromId)
      };
      onUpdateTask(updatedToTask);
    }
  }, [flatTasks, onUpdateTask]);

  // Canvas mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('flowchart-canvas-area')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      e.preventDefault();
    }
  }, [panPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && draggedNodeId) {
      // Handle node dragging
      handleNodeDrag(e.clientX, e.clientY);
    } else if (isDragging && !draggedNodeId) {
      // Handle canvas panning
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onPanChange({ x: newX, y: newY });
    }
    e.preventDefault();
  }, [isDragging, draggedNodeId, dragStart, handleNodeDrag, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    handleNodeDragEnd();
  }, [handleNodeDragEnd]);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(3, zoomLevel + delta));
      onZoomChange(newZoom);
    }
  }, [zoomLevel, onZoomChange]);

  // Get node position with fallback
  const getNodePosition = useCallback((nodeId) => {
    return nodePositions.get(nodeId) || { x: 0, y: 0, level: 0 };
  }, [nodePositions]);

  // Render all tasks (including subtasks) with proper positioning
  const taskNodeElements = useMemo(() => {
    return flatTasks.map((task) => {
      const position = getNodePosition(task.id);
      
      return (
        <div
          key={task.id}
          className="absolute"
          style={{
            left: position.x,
            top: position.y,
            transform: `translate(-50%, -50%)`,
            zIndex: 10 + task.level,
            cursor: draggedNodeId === task.id ? 'grabbing' : 'grab'
          }}
        >
          <TaskNode
            task={task}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            onCreateConnection={handleCreateConnection}
            onDeleteConnection={handleDeleteConnection}
            onDragStart={handleNodeDragStart}
            onDrag={handleNodeDrag}
            onDragEnd={handleNodeDragEnd}
            isRoot={task.level === 0}
            level={task.level}
            connections={connections}
            selectedNodes={selectedNodes}
            onNodeSelect={handleNodeSelect}
            showActualTasksOnly={showActualTasksOnly}
            viewMode="flowchart"
            isDragging={draggedNodeId === task.id}
          />
        </div>
      );
    });
  }, [flatTasks, getNodePosition, onUpdateTask, onDeleteTask, handleCreateConnection, handleDeleteConnection, handleNodeDragStart, handleNodeDrag, handleNodeDragEnd, connections, selectedNodes, handleNodeSelect, showActualTasksOnly, draggedNodeId]);

  // Memoized connection rendering
  const connectionElements = useMemo(() => {
    return connections.map((connection) => {
      const fromPos = getNodePosition(connection.from);
      const toPos = getNodePosition(connection.to);
      const fromTask = flatTasks.find(task => task.id === connection.from);
      const toTask = flatTasks.find(task => task.id === connection.to);
      
      if (!fromPos || !toPos || !fromTask || !toTask) return null;
      
      return (
        <ConnectionLine
          key={connection.id}
          from={fromPos}
          to={toPos}
          fromTask={fromTask}
          toTask={toTask}
          onDelete={handleDeleteConnection}
          isHighlighted={selectedNodes.includes(connection.from) || selectedNodes.includes(connection.to)}
        />
      );
    }).filter(Boolean);
  }, [connections, getNodePosition, flatTasks, handleDeleteConnection, selectedNodes]);

  // Add event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  // Optimized transform style with memoization
  const transformStyle = useMemo(() => ({
    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    willChange: isDragging ? 'transform' : 'auto'
  }), [panPosition.x, panPosition.y, zoomLevel, isDragging]);

  return (
    <div className="flowchart-view h-full relative overflow-hidden">
      {/* Infinite Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 flowchart-canvas-area touch-pan-x touch-pan-y"
        style={{
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 1px 1px, #212C32 1px, transparent 0),
            #0D1518
          `,
          backgroundSize: '20px 20px',
          cursor: isDragging && !draggedNodeId ? 'grabbing' : 'grab'
        }}
      >
        <div
          className="relative"
          style={{
            ...transformStyle,
            width: '300vw',
            height: '300vh',
            left: '-100vw',
            top: '-100vh'
          }}
        >
          {/* Connection Lines */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 1
            }}
          >
            {connectionElements}
          </svg>
          
          {/* Task Nodes */}
          <div className="relative w-full h-full" style={{ zIndex: 10 }}>
            {taskNodeElements}
          </div>
        </div>
      </div>
      
      {/* Selection Info */}
      {selectedNodes.length > 0 && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-slate-600/50 max-w-xs sm:max-w-sm">
          <div className="text-xs sm:text-sm text-white break-words">
            {selectedNodes.length} task{selectedNodes.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-1 sm:space-x-2 mt-2">
            <button
              onClick={() => setSelectedNodes([])}
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => {
                selectedNodes.forEach(nodeId => {
                  const task = flatTasks.find(t => t.id === nodeId);
                  if (task) onDeleteTask(task.id);
                });
                setSelectedNodes([]);
              }}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Add Task Button */}
      <div className="absolute bottom-16 sm:bottom-4 left-2 sm:left-4 z-20">
        <button
          onClick={onAddTask}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-2 sm:p-3 rounded-full shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
          title="Add New Task"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-2 sm:bottom-20 right-2 sm:right-4 z-20 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600/50 text-sm text-gray-300 transition-all duration-200 max-w-xs sm:max-w-64">
        <div className="flex items-center justify-between p-2 border-b border-slate-600/30">
          <span className="text-xs font-medium text-slate-300">Controls</span>
          <button
            onClick={() => setIsInstructionsMinimized(!isInstructionsMinimized)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700/50"
            title={isInstructionsMinimized ? "Expand instructions" : "Minimize instructions"}
          >
            <svg 
              className={`w-3 h-3 transition-transform duration-200 ${isInstructionsMinimized ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {!isInstructionsMinimized && (
          <div className="p-2 sm:p-3 space-y-1">
            <div className="text-xs sm:text-sm">• Drag nodes to move them around</div>
            <div className="text-xs sm:text-sm">• Drag from connection ports to link tasks</div>
            <div className="text-xs sm:text-sm">• Ctrl/Cmd + scroll to zoom in/out</div>
            <div className="text-xs sm:text-sm">• Click and drag empty space to pan</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowchartView;