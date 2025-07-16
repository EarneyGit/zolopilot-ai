import React, { useState, useEffect } from 'react'
import TreeView from './TreeView'
import ListView from './ListView'
import LoadingSpinner from './LoadingSpinner'

const MobileGenerationView = ({
  startupIdea,
  mindMapData,
  loading,
  error,
  message,
  viewMode,
  setViewMode,
  showActualTasksOnly,
  setShowActualTasksOnly,
  zoomLevel,
  setZoomLevel,
  setShowGenerationView,
  setMindMapData,
  setStartupIdea,
  setMessage,
  setEnhancedPrompt,
  setError,
  chatMessages,
  handleSendMessage,
  isEnhancing,
  isAuthenticated,
  handleSignOut
}) => {
  const [localEnhancedPrompt, setLocalEnhancedPrompt] = useState('')
  const [isMindMapExpanded, setIsMindMapExpanded] = useState(true)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })

  const resetZoom = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const fitToFrame = () => {
    // Get actual canvas dimensions from the TreeView canvas area
    const treeCanvas = document.querySelector('.tree-canvas-area');
    const canvasWidth = treeCanvas?.clientWidth || 1200;
    const canvasHeight = treeCanvas?.clientHeight || 800;
    
    // Main node center position (same calculation as in TreeView)
    // TreeView positions nodes within a 300vw x 300vh container offset by -100vw, -100vh
    const mainNodeCenterX = canvasWidth * 1.5; // Within the infinite canvas coordinate system
    const mainNodeCenterY = canvasHeight * 1.33;
    
    // Calculate viewport center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Calculate pan position to center the main node in the viewport
    // We need to account for the infinite canvas offset (-100vw, -100vh) and zoom
    const targetZoomLevel = 0.8;
    const targetPanX = viewportCenterX - (mainNodeCenterX - canvasWidth) * targetZoomLevel;
    const targetPanY = (viewportCenterY - 250) - (mainNodeCenterY - canvasHeight) * targetZoomLevel; // Move 250px higher
    
    // Reset to optimal view that centers on the main node
    setZoomLevel(targetZoomLevel)
    setPanPosition({ x: targetPanX, y: targetPanY })
    
    // Small delay to ensure TreeView has recalculated layout
    setTimeout(() => {
      setZoomLevel(targetZoomLevel)
      setPanPosition({ x: targetPanX, y: targetPanY })
    }, 100)
  }

  // Auto-center when mindmap is first generated (only once)
  useEffect(() => {
    if (mindMapData && mindMapData.length > 0 && zoomLevel === 1) {
      // Only auto-fit if zoom is at default (1), indicating first load
      // Small delay to ensure the TreeView has rendered and calculated layout
      setTimeout(() => {
        fitToFrame()
      }, 300) // Slightly longer delay for initial generation
    }
  }, [mindMapData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/20 to-black/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,30,30,0.15),transparent_70%)]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="w-full px-4 py-4 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setShowGenerationView(false)
                setMindMapData(null)
                setStartupIdea('')
                setMessage('')
                setEnhancedPrompt('')
                setError('')
                setLocalEnhancedPrompt('')
                // Clear localStorage for fresh start
                localStorage.removeItem('zolopilot_startupIdea')
                localStorage.removeItem('zolopilot_mindMapData')
                localStorage.removeItem('zolopilot_showGenerationView')
                localStorage.removeItem('zolopilot_message')
                localStorage.removeItem('zolopilot_enhancedPrompt')
              }}
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">New Idea</span>
            </button>
            
            <h2 className="text-xl font-bold text-white tracking-wide">Zolopilot AI</h2>
            
            <div className="flex items-center space-x-2">
              {loading && <LoadingSpinner size="sm" />}
              {isAuthenticated && (
                <button 
                  onClick={handleSignOut}
                  className="text-white hover:text-purple-300 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/5 backdrop-blur-sm border border-slate-600/50 text-sm"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Mind Map Section */}
          <div className={`bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 transition-all duration-500 ease-in-out overflow-hidden ${
            isChatExpanded 
              ? 'h-0 opacity-0 transform translate-y-full' 
              : isMindMapExpanded 
                ? 'h-[calc(100vh-120px)]' 
                : 'h-auto'
          }`}>
            {/* Mind Map Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-white font-medium text-lg">
                  Mind Map Preview
                </h3>
                {loading && (
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Generating...</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setIsMindMapExpanded(!isMindMapExpanded)
                  if (!isMindMapExpanded) {
                    setIsChatExpanded(false)
                  }
                }}
                className="p-2 text-white hover:text-purple-300 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform duration-200 ${
                    isMindMapExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Mind Map Content */}
            <div className={`transition-all duration-500 ease-in-out ${
              isMindMapExpanded ? 'opacity-100' : 'opacity-0 h-0'
            }`}>
              <div className="px-4 pb-4">
                <div className={`border border-gray-800/70 rounded-xl overflow-hidden relative ${
                  isMindMapExpanded ? 'h-[calc(100vh-220px)]' : 'h-80'
                }`}>
                  {mindMapData ? (
                    <>
                      {/* View Switcher - Top Left */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="flex items-center space-x-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 border border-slate-600/50">
                          <button
                            onClick={() => setViewMode('flowchart')}
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${
                              viewMode === 'flowchart'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            Flow
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${
                              viewMode === 'list'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            List
                          </button>
                        </div>
                      </div>

                      {/* Actual Tasks Filter - Top Center */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-1.5 border border-slate-600/50">
                          <label className="flex items-center space-x-1 text-xs text-white">
                            <input
                              type="checkbox"
                              checked={showActualTasksOnly}
                              onChange={(e) => setShowActualTasksOnly(e.target.checked)}
                              className="rounded text-purple-500 focus:ring-purple-500"
                            />
                            <span>Tasks Only</span>
                          </label>
                        </div>
                      </div>

                      {/* Fit to Frame Button - Top Right (Mindmap only) */}
                      {viewMode === 'flowchart' && (
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={fitToFrame}
                            className="p-2 text-white hover:text-purple-300 bg-slate-800/90 hover:bg-slate-700/90 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-600/50 shadow-lg"
                            title="Fit to Frame"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Zoom Controls - Bottom Right (Mindmap only) */}
                      {viewMode === 'flowchart' && (
                        <div className="absolute bottom-2 right-2 z-10">
                          <div className="flex items-center space-x-1 bg-black/90 rounded-lg p-1 shadow-xl backdrop-blur-sm border border-gray-900/50">
                            <button
                              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                              className="p-1 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                              title="Zoom Out"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <button
                              onClick={resetZoom}
                              className="px-1.5 py-1 text-xs text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors min-w-[2.5rem]"
                              title="Reset Zoom"
                            >
                              {Math.round(zoomLevel * 100)}%
                            </button>
                            
                            <button
                              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                              className="p-1 text-white hover:text-gray-900 hover:bg-white/90 rounded transition-colors"
                              title="Zoom In"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* View Content with Dotted Background */}
                      <div className="w-full h-full dotted-background rounded-xl overflow-hidden">
                        {viewMode === 'flowchart' ? (
                          <TreeView
                            tasks={mindMapData ? [mindMapData] : []}
                            zoomLevel={zoomLevel}
                            onZoomChange={setZoomLevel}
                            panPosition={panPosition}
                            onPanChange={setPanPosition}
                            onUpdateTask={() => {}}
                            onDeleteTask={() => {}}
                            onAddTask={() => {}}
                          />
                        ) : (
                          <ListView
                            tasks={mindMapData?.children || []}
                            showActualTasksOnly={showActualTasksOnly}
                            onUpdateTask={() => {}}
                            onDeleteTask={() => {}}
                            onAddTask={() => {}}
                            onCreateConnection={() => {}}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center border border-gray-800/70 rounded-xl dotted-background relative">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-black rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <h3 className="text-white font-semibold mb-2 text-sm">Generating Your Mind Map</h3>
                        <p className="text-gray-400 text-xs">AI is analyzing your startup idea...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className={`bg-slate-800/50 backdrop-blur-sm transition-all duration-500 ease-in-out overflow-hidden ${
            isMindMapExpanded 
              ? 'h-0 opacity-0 transform -translate-y-full' 
              : isChatExpanded 
                ? 'h-[calc(100vh-120px)]' 
                : 'h-auto'
          }`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <h3 className="text-white font-medium text-lg">
                  Type Your Billion Dollar Idea Here
                </h3>
                {isEnhancing && (
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Enhancing...</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setIsChatExpanded(!isChatExpanded)
                  if (!isChatExpanded) {
                    setIsMindMapExpanded(false)
                  }
                }}
                className="p-2 text-white hover:text-purple-300 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform duration-200 ${
                    isChatExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Chat Content */}
            <div className={`transition-all duration-500 ease-in-out ${
              isChatExpanded ? 'opacity-100' : 'opacity-0 h-0'
            }`}>
              <div className="p-4">
                {/* Chat Messages */}
                <div className={`overflow-y-auto mb-4 space-y-3 bg-slate-900/30 rounded-lg p-3 border border-slate-600/30 ${
                   isChatExpanded ? 'h-[calc(100vh-320px)]' : 'h-64'
                 }`}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      <div className="w-12 h-12 mx-auto mb-3 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.529-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                      </div>
                      <p className="text-sm">Start a conversation to enhance your prompt</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-white'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <textarea
                    value={localEnhancedPrompt}
                    onChange={(e) => setLocalEnhancedPrompt(e.target.value)}
                    placeholder="Ask AI to enhance your prompt or provide more details..."
                    className="flex-1 h-20 px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  />
                  <button
                    onClick={() => {
                      if (localEnhancedPrompt.trim()) {
                        handleSendMessage(localEnhancedPrompt)
                        setLocalEnhancedPrompt('')
                      }
                    }}
                    disabled={!localEnhancedPrompt.trim() || isEnhancing}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    {isEnhancing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mx-4 my-2 bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg backdrop-blur-sm text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mx-4 my-2 bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg backdrop-blur-sm text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileGenerationView