import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const TaskNode = ({ 
  task, 
  onUpdate, 
  onDelete,
  onCreateConnection,
  onDeleteConnection,
  onDragStart,
  onDrag,
  onDragEnd,
  isRoot = false, 
  level = 0,
  connections = [],
  selectedNodes = [],
  onNodeSelect,
  showActualTasksOnly = false,
  viewMode = 'flowchart',
  isDragging = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragConnectionTo, setDragConnectionTo] = useState(null);
  const [showConnectionPorts, setShowConnectionPorts] = useState(false);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const nodeRef = useRef(null);

  // Calculate task status based on dependencies
  const getTaskStatus = useCallback(() => {
    if (task.completed) return 'completed';
    if (task.delegated) return 'delegated';
    
    // Check if all predecessor tasks are completed
    const hasUncompletedPredecessors = task.predecessors?.some(predId => {
      return !task.predecessorsCompleted?.includes(predId);
    });
    
    if (hasUncompletedPredecessors) return 'blocked';
    if (task.overdue) return 'overdue';
    return 'actual';
  }, [task]);

  const taskStatus = getTaskStatus();

  // Hide non-actual tasks if filter is active
  if (showActualTasksOnly && taskStatus !== 'actual') {
    return null;
  }

  // Handle task completion toggle
  const toggleCompletion = useCallback(() => {
    const updatedTask = { ...task, completed: !task.completed };
    onUpdate(updatedTask);
  }, [task, onUpdate]);

  // Handle text editing
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditText(task.title);
  }, [task.title]);

  const handleSave = useCallback(() => {
    if (editText.trim() !== task.title) {
      const updatedTask = { ...task, title: editText.trim() };
      onUpdate(updatedTask);
    }
    setIsEditing(false);
  }, [editText, task, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditText(task.title);
    setIsEditing(false);
  }, [task.title]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Node drag handlers
  const handleNodeMouseDown = useCallback((e) => {
    if (e.target.closest('.task-actions') || e.target.closest('.connection-port')) {
      return; // Don't start drag if clicking on actions or ports
    }
    
    e.preventDefault();
    setIsNodeDragging(true);
    
    if (onDragStart) {
      onDragStart(task.id, e.clientX, e.clientY);
    }
  }, [task.id, onDragStart]);

  const handleNodeMouseMove = useCallback((e) => {
    if (isNodeDragging && onDrag) {
      onDrag(e.clientX, e.clientY);
    }
  }, [isNodeDragging, onDrag]);

  const handleNodeMouseUp = useCallback(() => {
    if (isNodeDragging) {
      setIsNodeDragging(false);
      if (onDragEnd) {
        onDragEnd();
      }
    }
  }, [isNodeDragging, onDragEnd]);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isNodeDragging) {
      document.addEventListener('mousemove', handleNodeMouseMove);
      document.addEventListener('mouseup', handleNodeMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleNodeMouseMove);
        document.removeEventListener('mouseup', handleNodeMouseUp);
      };
    }
  }, [isNodeDragging, handleNodeMouseMove, handleNodeMouseUp]);

  // Connection drag handlers
  const handleConnectionDragStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.width = '1px';
    dragImage.style.height = '1px';
    dragImage.style.backgroundColor = 'transparent';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    e.dataTransfer.setData('sourceTaskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [task.id]);

  const handleConnectionDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragConnectionTo(task.id);
  }, [task.id]);

  const handleConnectionDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceTaskId = e.dataTransfer.getData('sourceTaskId');
    if (sourceTaskId && sourceTaskId !== task.id) {
      onCreateConnection(sourceTaskId, task.id);
    }
    setDragConnectionTo(null);
  }, [task.id, onCreateConnection]);

  const handleConnectionDragLeave = useCallback(() => {
    setDragConnectionTo(null);
  }, []);

  // Node selection
  const handleNodeClick = useCallback((e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onNodeSelect(task.id);
    }
  }, [task.id, onNodeSelect]);

  // Get node styling based on status and level
  const getNodeStyle = useCallback(() => {
    let baseStyle = 'relative cursor-move transition-all duration-200 backdrop-blur-sm border rounded-lg p-4 select-none ';
    
    // Status-based styling
    switch (taskStatus) {
      case 'completed':
        baseStyle += 'bg-green-900/30 border-green-500/50 text-green-200 opacity-70 ';
        break;
      case 'actual':
        baseStyle += 'bg-purple-900/50 border-purple-400/70 text-white shadow-lg shadow-purple-500/25 ';
        break;
      case 'blocked':
        baseStyle += 'bg-gray-900/40 border-gray-500/50 text-gray-300 opacity-80 ';
        break;
      case 'delegated':
        baseStyle += 'bg-blue-900/40 border-blue-500/50 text-blue-200 opacity-85 ';
        break;
      case 'overdue':
        baseStyle += 'bg-red-900/50 border-red-500/70 text-red-200 shadow-lg shadow-red-500/25 ';
        break;
      default:
        baseStyle += 'bg-slate-800/60 border-slate-600/60 text-white ';
    }

    // Level-based sizing
    if (isRoot) {
      baseStyle += 'text-lg font-bold min-w-80 ';
    } else if (level === 1) {
      baseStyle += 'text-base font-semibold min-w-64 ';
    } else {
      baseStyle += 'text-sm min-w-48 ';
    }

    // Hover and selection effects
    if (isHovered || showConnectionPorts) {
      baseStyle += 'scale-105 shadow-xl ';
    }
    if (selectedNodes.includes(task.id)) {
      baseStyle += 'ring-2 ring-purple-400/80 ';
    }
    if (dragConnectionTo === task.id) {
      baseStyle += 'ring-2 ring-blue-400/80 ';
    }
    if (isDragging) {
      baseStyle += 'shadow-2xl scale-110 z-50 ';
    }

    return baseStyle;
  }, [taskStatus, isRoot, level, isHovered, showConnectionPorts, selectedNodes, task.id, dragConnectionTo, isDragging]);

  // Get priority indicator
  const getPriorityIndicator = useCallback(() => {
    const priorityColors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return priorityColors[task.priority] || 'bg-gray-500';
  }, [task.priority]);

  // Format due date
  const formatDueDate = useCallback((date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  // Get connections for this task
  const taskConnections = connections.filter(conn => 
    conn.from === task.id || conn.to === task.id
  );

  return (
    <div 
      className="task-node-container relative"
      onMouseEnter={() => {
        setIsHovered(true);
        setShowConnectionPorts(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowConnectionPorts(false);
      }}
    >
      {/* Connection Ports */}
      {showConnectionPorts && (
        <>
          {/* Input Port (Left) */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-blue-400 transition-colors z-10 connection-port"
            onDragOver={handleConnectionDragOver}
            onDrop={handleConnectionDrop}
            onDragLeave={handleConnectionDragLeave}
            title="Drop connection here"
          />
          
          {/* Output Port (Right) */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-purple-400 transition-colors z-10 connection-port"
            draggable
            onDragStart={handleConnectionDragStart}
            title="Drag to create connection"
          />
        </>
      )}

      {/* Main Task Node */}
      <div
        ref={nodeRef}
        className={getNodeStyle()}
        onMouseDown={handleNodeMouseDown}
        onClick={handleNodeClick}
        onDragOver={handleConnectionDragOver}
        onDrop={handleConnectionDrop}
        onDragLeave={handleConnectionDragLeave}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {/* Task Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* Completion Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCompletion();
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-400 hover:border-gray-300'
              }`}
            >
              {task.completed && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Priority Indicator */}
            <div className={`w-3 h-3 rounded-full ${getPriorityIndicator()}`} />
            
            {/* Status Badge */}
            <span className={`text-xs px-2 py-1 rounded-full ${
              taskStatus === 'completed' ? 'bg-green-500/20 text-green-300' :
              taskStatus === 'actual' ? 'bg-purple-500/20 text-purple-300' :
              taskStatus === 'blocked' ? 'bg-gray-500/20 text-gray-300' :
              taskStatus === 'delegated' ? 'bg-blue-500/20 text-blue-300' :
              taskStatus === 'overdue' ? 'bg-red-500/20 text-red-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {taskStatus}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1 task-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Toggle details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Task Title */}
        <div className="mb-2">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b border-gray-500 focus:border-gray-300 outline-none text-white"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className={`font-semibold cursor-pointer hover:text-gray-300 ${
                task.completed ? 'line-through opacity-60' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              {task.title}
            </h3>
          )}
        </div>
        
        {/* Task Details (Expandable) */}
        {showDetails && (
          <div className="space-y-2 text-sm border-t border-gray-600/50 pt-2">
            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Due:</span>
                <span className={task.overdue ? 'text-red-400' : 'text-gray-300'}>
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
            )}
            
            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Assigned:</span>
                <span className="text-gray-300">{task.assignee}</span>
              </div>
            )}
            
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-600/50 text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Notes */}
            {task.notes && (
              <div className="mt-2">
                <div className="text-gray-400 text-xs mb-1">Notes:</div>
                <div className="text-gray-300 text-xs">{task.notes}</div>
              </div>
            )}
            
            {/* Connection Info */}
            {taskConnections.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                {taskConnections.length} connection{taskConnections.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
        
        {/* Child Tasks Indicator */}
        {task.children && task.children.length > 0 && (
          <div className="mt-2 text-xs text-gray-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskNode; 