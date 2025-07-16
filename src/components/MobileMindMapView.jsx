import React, { useState, useRef, useEffect } from 'react';
import TreeView from './TreeView';
import ListView from './ListView';

const MobileMindMapView = ({
  mindMapData,
  loading,
  viewMode,
  setViewMode,
  showActualTasksOnly,
  setShowActualTasksOnly,
  taskData,
  updateTaskData,
  deleteTaskData,
  addTaskData,
  zoomLevel,
  setZoomLevel,
  panPosition,
  setPanPosition
}) => {
  const [isMindMapExpanded, setIsMindMapExpanded] = useState(false);

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const fitToFrame = () => {
    // Get actual canvas dimensions from the TreeView canvas area
    const treeCanvas = document.querySelector('.tree-canvas-area');
    const canvasWidth = treeCanvas?.clientWidth || 1200;
    const canvasHeight = treeCanvas?.clientHeight || 800;
    
    // Main node center position (same calculation as in TreeView)
    const mainNodeCenterX = canvasWidth * 1.5;
    const mainNodeCenterY = canvasHeight * 1.33;
    
    // Calculate viewport center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Calculate pan position to center the main node in the viewport
    const newPanX = viewportCenterX - (mainNodeCenterX * zoomLevel);
    const newPanY = viewportCenterY - (mainNodeCenterY * zoomLevel);
    
    setPanPosition({ x: newPanX, y: newPanY });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/20 to-black/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,30,30,0.15),transparent_70%)]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="w-full px-4">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl font-bold text-white tracking-wide">Zolopilot AI</h2>
          </div>
        </header>

        {/* Mind Map Section */}
        <div className="flex-1 flex flex-col relative">
          {/* Mind Map Preview */}
          <div className="flex-1 flex flex-col relative">
            {/* Preview Header */}
            <div className="p-3 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-white font-medium text-xl">
                    Strategic Mind Map - Mobile View
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  {loading && (
                    <div className="flex items-center space-x-2 text-white">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Generating...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mind Map Content */}
            <div className="flex-1 overflow-hidden p-4">
              {mindMapData ? (
                <div className="h-full border border-gray-800/70 rounded-xl overflow-hidden relative">
                  {/* View Switcher - Top Left */}
                  <div className="absolute top-4 left-4 right-32 sm:right-auto z-10">
                    <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600/50">
                      <button
                        onClick={() => setViewMode('flowchart')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                          viewMode === 'flowchart'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        Flowchart
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                          viewMode === 'list'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        List
                      </button>
                    </div>
                  </div>



                  {/* Zoom Controls - Top Right (Flowchart only) */}
                  {viewMode === 'flowchart' && (
                    <>
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={fitToFrame}
                          className="p-2 text-white hover:text-gray-900 bg-black/90 hover:bg-white/90 rounded-lg transition-all duration-200 shadow-xl backdrop-blur-sm border border-gray-900/50 hover:border-gray-200/50"
                          title="Fit to Frame"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="absolute bottom-4 right-4 z-10">
                        <div className="flex items-center space-x-1 bg-black/90 rounded-lg p-1.5 shadow-xl backdrop-blur-sm border border-gray-900/50">
                          <button
                            onClick={zoomOut}
                            className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                            title="Zoom Out"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={resetZoom}
                            className="px-2 py-1.5 text-xs text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors min-w-[2.5rem]"
                            title="Reset Zoom"
                          >
                            {Math.round(zoomLevel * 100)}%
                          </button>
                          
                          <button
                            onClick={zoomIn}
                            className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                            title="Zoom In"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* View Content with Dotted Background */}
                  <div className="w-full h-full dotted-background rounded-xl overflow-hidden">
                    {viewMode === 'flowchart' ? (
                      <TreeView
                        tasks={taskData}
                        onUpdateTask={updateTaskData}
                        onDeleteTask={deleteTaskData}
                        onAddTask={addTaskData}
                        zoomLevel={zoomLevel}
                        panPosition={panPosition}
                        onPanChange={setPanPosition}
                        onZoomChange={setZoomLevel}
                      />
                    ) : (
                      <ListView
                        tasks={taskData}
                        onUpdateTask={updateTaskData}
                        onDeleteTask={deleteTaskData}
                        onAddTask={addTaskData}
                        showActualTasksOnly={showActualTasksOnly}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border border-gray-800/70 rounded-xl dotted-background relative">
                  {/* Fit to Frame - Top Right */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={fitToFrame}
                      className="p-2 text-white hover:text-gray-900 bg-black/90 hover:bg-white/90 rounded-lg transition-all duration-200 shadow-xl backdrop-blur-sm border border-gray-900/50 hover:border-gray-200/50"
                      title="Fit to Frame"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Zoom Controls - Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <div className="flex items-center space-x-1 bg-black/90 rounded-lg p-1.5 shadow-xl backdrop-blur-sm border border-gray-900/50">
                      <button
                        onClick={zoomOut}
                        className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                        title="Zoom Out"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={resetZoom}
                        className="px-2 py-1.5 text-xs text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors min-w-[2.5rem]"
                        title="Reset Zoom"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </button>
                      
                      <button
                        onClick={zoomIn}
                        className="p-1.5 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                        title="Zoom In"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Generating Your Mind Map</h3>
                    <p className="text-gray-400 text-sm">AI is analyzing your startup idea and creating a strategic roadmap...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MobileMindMapView;