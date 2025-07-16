import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const MindMapNode = ({ node, onUpdate, isRoot = false, level = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const textRef = useRef(null);
  const nodeRef = useRef(null);

  // Handle text editing
  const handleEdit = () => {
    setIsEditing(true);
    setEditText(node.text);
  };

  const handleSave = () => {
    if (editText.trim() !== node.text) {
      const updatedNode = { ...node, text: editText.trim() };
      onUpdate(updatedNode);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(node.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Add child node
  const addChild = () => {
    const newChild = {
      id: uuidv4(),
      text: 'New Node',
      children: []
    };
    const updatedNode = {
      ...node,
      children: [...node.children, newChild]
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
        children: node.children.filter((_, i) => i !== index)
      };
      onUpdate(updatedNode);
    } else {
      // Update child
      const updatedNode = {
        ...node,
        children: node.children.map((child, i) => i === index ? updatedChild : child)
      };
      onUpdate(updatedNode);
    }
  };

  // Tooltip for goal setting section
  const handleMouseEnter = (e) => {
    if (node.id === 'goal-setting') {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Format node text to handle headings and bullet points with proper line structure
  const formatNodeText = (text) => {
    if (!text) return text;
    
    const lines = text.split('\n');
    const elements = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - add spacing
        elements.push(<div key={`empty-${index}`} className="h-2"></div>);
      } else if (index === 0 || (trimmedLine.endsWith(':') && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-'))) {
        // First line or heading (ends with colon) - make it bold
        const headingText = trimmedLine.endsWith(':') ? trimmedLine.slice(0, -1) : trimmedLine;
        elements.push(
          <div key={`heading-${index}`} className="font-bold text-base mb-4 text-left text-black">
            {headingText}
          </div>
        );
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        // Simple bullet point - just text after bullet
        const bulletText = trimmedLine.substring(1).trim();
        elements.push(
          <div key={`bullet-${index}`} className="text-sm mb-2 flex items-start text-left">
            <span className="mr-2 flex-shrink-0 text-black">•</span>
            <span className="flex-1 text-black">{bulletText}</span>
          </div>
        );
      } else {
        // Regular text
        elements.push(
          <div key={`text-${index}`} className="text-sm mb-1 text-left text-black">
            {trimmedLine}
          </div>
        );
      }
    });
    
    return elements;
  };

  // Get node styling based on level and type
  const getNodeStyle = () => {
    const baseClasses = 'relative bg-gradient-to-br border rounded-lg sm:rounded-xl shadow-lg transition-all duration-200 cursor-pointer group hover:shadow-xl';
    
    switch(level) {
      case 0: // Root node
        return `${baseClasses} from-purple-600 to-purple-800 border-purple-500 text-white p-3 sm:p-4 md:p-6 min-w-[200px] sm:min-w-[240px] md:min-w-[280px] min-h-[80px] sm:min-h-[100px] md:min-h-[120px]`;
      case 1: // Main categories
        return `${baseClasses} from-blue-500 to-blue-700 border-blue-400 text-white p-2 sm:p-3 md:p-4 min-w-[180px] sm:min-w-[200px] md:min-w-[240px] min-h-[70px] sm:min-h-[80px] md:min-h-[100px]`;
      case 2: // Sub-categories
        return `${baseClasses} from-emerald-500 to-emerald-700 border-emerald-400 text-white p-2 sm:p-3 min-w-[160px] sm:min-w-[180px] md:min-w-[200px] min-h-[60px] sm:min-h-[70px] md:min-h-[80px]`;
      case 3: // Tasks
        return `${baseClasses} from-amber-500 to-amber-700 border-amber-400 text-white p-2 sm:p-3 min-w-[140px] sm:min-w-[160px] md:min-w-[180px] min-h-[50px] sm:min-h-[60px] md:min-h-[70px]`;
      default: // Deep nesting
        return `${baseClasses} from-slate-500 to-slate-700 border-slate-400 text-white p-1 sm:p-2 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] min-h-[40px] sm:min-h-[50px] md:min-h-[60px]`;
    }
  };

  // Get layout styling
  const getLayoutStyle = () => {
    if (isRoot) {
      return 'flex flex-col items-center space-y-6';
    } else if (level === 1) {
      return 'flex flex-col items-center space-y-4';
    } else {
      return 'flex flex-col items-start space-y-2';
    }
  };

  const getChildrenLayoutStyle = () => {
    if (isRoot) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full max-w-6xl';
    } else if (level === 1) {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl';
    } else {
      return 'flex flex-col space-y-2 ml-4';
    }
  };

  return (
    <div className={getLayoutStyle()}>
      {/* Node */}
      <div
        ref={nodeRef}
        className={`${getNodeStyle()} relative group`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleEdit}
      >
        {/* Edit/Delete buttons */}
        {!isRoot && (
          <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 sm:gap-1">
            <button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs transition-colors"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={deleteNode}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}

        {/* Add child button */}
        <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={addChild}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs transition-colors"
            title="Add Child"
          >
            +
          </button>
        </div>

        {/* Node text */}
        {isEditing ? (
          <textarea
            ref={textRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-2 border-white border-dashed resize-none text-current p-1 rounded focus:outline-none text-xs sm:text-sm md:text-base"
            autoFocus
            rows={Math.max(1, Math.ceil(editText.length / 20))}
          />
        ) : (
          <div className="text-left break-words w-full text-xs sm:text-sm md:text-base leading-tight">
            {formatNodeText(node.text)}
          </div>
        )}

        {/* Tooltip for goal setting section */}
        {showTooltip && (
          <div
            className="tooltip relative"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            {/* Close button for tooltip */}
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              aria-label="Close tooltip"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            This section suggests a goal setting system tailored to your business idea, along with success stories of companies that used it.
          </div>
        )}
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className={getChildrenLayoutStyle()}>
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Connection line */}
              {level < 2 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-gray-300"></div>
              )}
              
              <MindMapNode
                node={child}
                onUpdate={(updatedChild) => updateChild(index, updatedChild)}
                isRoot={false}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MindMapNode;