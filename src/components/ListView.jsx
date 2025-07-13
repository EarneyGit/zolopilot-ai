import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ListView = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onCreateConnection,
  showActualTasksOnly = false,
  onAddTask
}) => {
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  // Calculate task status
  const getTaskStatus = (task) => {
    if (task.completed) return 'completed';
    if (task.delegated) return 'delegated';
    
    const hasUncompletedPredecessors = task.predecessors?.some(predId => {
      return !task.predecessorsCompleted?.includes(predId);
    });
    
    if (hasUncompletedPredecessors) return 'blocked';
    if (task.overdue) return 'overdue';
    return 'actual';
  };

  // Flatten tasks for list view
  const flattenTasks = (taskArray, level = 0) => {
    const flattened = [];
    
    taskArray.forEach(task => {
      const taskStatus = getTaskStatus(task);
      
      // Skip non-actual tasks if filter is active
      if (showActualTasksOnly && taskStatus !== 'actual') {
        return;
      }
      
      // Add current task
      flattened.push({ ...task, level, status: taskStatus });
      
      // Add children if expanded
      if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
        flattened.push(...flattenTasks(task.children, level + 1));
      }
    });
    
    return flattened;
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = flattenTasks(tasks);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(task => {
        switch (filterBy) {
          case 'actual':
            return task.status === 'actual';
          case 'completed':
            return task.status === 'completed';
          case 'blocked':
            return task.status === 'blocked';
          case 'overdue':
            return task.status === 'overdue';
          case 'delegated':
            return task.status === 'delegated';
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [tasks, searchTerm, filterBy, sortBy, sortOrder, expandedTasks, showActualTasksOnly]);

  // Toggle task expansion
  const toggleExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Toggle task selection
  const toggleSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Handle task completion
  const handleToggleCompletion = (task) => {
    const updatedTask = { ...task, completed: !task.completed };
    onUpdateTask(updatedTask);
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/20 border-green-500/30 text-green-200';
      case 'actual':
        return 'bg-purple-900/20 border-purple-400/40 text-white';
      case 'blocked':
        return 'bg-gray-900/20 border-gray-500/30 text-gray-300';
      case 'delegated':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-200';
      case 'overdue':
        return 'bg-red-900/20 border-red-500/40 text-red-200';
      default:
        return 'bg-slate-800/20 border-slate-600/30 text-white';
    }
  };

  // Get priority indicator
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="text-red-500">🔴</span>;
      case 'medium':
        return <span className="text-yellow-500">🟡</span>;
      case 'low':
        return <span className="text-green-500">🟢</span>;
      default:
        return <span className="text-gray-500">⚪</span>;
    }
  };

  return (
    <div className="list-view h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex-shrink-0 p-4 border-b border-slate-600/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Task List</h3>
          <button
            onClick={onAddTask}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 text-sm"
          >
            + Add Task
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="actual">Actual Tasks</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="overdue">Overdue</option>
            <option value="delegated">Delegated</option>
          </select>
          
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
          
          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white hover:bg-slate-700/50 transition-colors text-sm"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">No tasks found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredAndSortedTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center p-3 hover:bg-slate-800/30 transition-colors ${
                  selectedTasks.has(task.id) ? 'bg-purple-900/20' : ''
                } ${getStatusStyle(task.status)} border-l-4`}
                style={{ paddingLeft: `${1 + task.level * 2}rem` }}
              >
                {/* Expand/Collapse Button */}
                {task.children && task.children.length > 0 && (
                  <button
                    onClick={() => toggleExpansion(task.id)}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors mr-2"
                  >
                    {expandedTasks.has(task.id) ? '▼' : '▶'}
                  </button>
                )}
                
                {/* Completion Checkbox */}
                <button
                  onClick={() => handleToggleCompletion(task)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mr-3 ${
                    task.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-400 hover:border-purple-400'
                  }`}
                >
                  {task.completed && <span className="text-xs">✓</span>}
                </button>
                
                {/* Priority Indicator */}
                <div className="mr-3">
                  {getPriorityIcon(task.priority)}
                </div>
                
                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </span>
                    
                    {/* Tags */}
                    {task.tags?.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-600/30 rounded-full text-xs text-purple-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                    {task.dueDate && (
                      <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                    {task.assignee && (
                      <span>👤 {task.assignee}</span>
                    )}
                    <span className="capitalize">{task.status}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleSelection(task.id)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Select"
                  >
                    {selectedTasks.has(task.id) ? '☑️' : '☐'}
                  </button>
                  
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className="flex-shrink-0 p-4 border-t border-slate-600/50">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            {filteredAndSortedTasks.length} tasks shown
            {selectedTasks.size > 0 && ` | ${selectedTasks.size} selected`}
          </span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Actual</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Completed</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <span>Blocked</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListView; 