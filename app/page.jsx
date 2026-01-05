'use client'

import { useRef, useState } from 'react'

import BlogList from './components/BlogList'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import { searchBlogs } from './lib/api'

export default function Home() {
  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isBlogsExpanded, setIsBlogsExpanded] = useState(false)
  const [dragHeight, setDragHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery)
    setError(null)
    setIsLoading(true)

    try {
      const response = await searchBlogs(searchQuery)
      setResults(response.data || [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to search blogs. Please try again.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Touch handlers for swipe-up gesture
  const handleTouchStart = (e) => {
    setIsDragging(true)
    startYRef.current = e.touches[0].clientY
    startHeightRef.current = isBlogsExpanded ? window.innerHeight : 0
    e.preventDefault()
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    
    const currentY = e.touches[0].clientY
    const deltaY = startYRef.current - currentY // Positive when swiping up
    const maxHeight = window.innerHeight
    
    // Calculate new height: swiping up increases height
    const newHeight = Math.max(0, Math.min(maxHeight, startHeightRef.current + deltaY))
    setDragHeight(newHeight)
    
    // Show panel if dragging up
    if (newHeight > 50) {
      setIsBlogsExpanded(true)
    }
    
    e.preventDefault()
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    setIsDragging(false)
    const maxHeight = window.innerHeight
    const threshold = maxHeight * 0.3 // 30% threshold
    
    // Snap to fully expanded or collapsed based on drag distance
    if (dragHeight && dragHeight >= threshold) {
      setIsBlogsExpanded(true)
      setDragHeight(null)
    } else {
      setIsBlogsExpanded(false)
      setDragHeight(null)
    }
  }

  // Get panel transform and height based on drag or state
  const getPanelStyle = () => {
    const maxHeight = window.innerHeight
    
    if (isDragging && dragHeight !== null) {
      const height = Math.max(0, Math.min(maxHeight, dragHeight))
      return {
        height: `${height}px`,
        transform: `translateY(${maxHeight - height}px)`,
        transition: 'none'
      }
    }
    
    if (isBlogsExpanded) {
      return {
        height: '100vh',
        transform: 'translateY(0)',
        transition: 'transform 300ms ease-out, height 300ms ease-out'
      }
    }
    
    return {
      height: '0px',
      transform: `translateY(${maxHeight}px)`,
      transition: 'transform 300ms ease-out, height 300ms ease-out'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Semantic Blog Search
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Find blogs by meaning using AI-powered semantic search
          </p>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left Panel - Search */}
        <div className="w-full lg:w-1/2 border-r-0 lg:border-r border-b lg:border-b-0 border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Search Results */}
            <SearchResults results={results} query={query} isLoading={isLoading} />
          </div>
        </div>

        {/* Desktop Right Panel - All Blogs */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-50 overflow-y-auto">
          <div className="p-4 sm:p-6 w-full">
            <BlogList />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Button - All Blogs (Draggable) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      >
        <button
          onClick={() => setIsBlogsExpanded(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 shadow-lg transition-colors touch-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">All Blogs</h2>
              <p className="text-sm opacity-90">
                {isDragging ? 'Drag up to expand' : 'Swipe up or tap to view'}
              </p>
            </div>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Mobile Full Screen Overlay - All Blogs */}
      {(isBlogsExpanded || (isDragging && dragHeight && dragHeight > 0)) && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black z-50 transition-opacity"
            style={{
              opacity: isDragging && dragHeight 
                ? Math.min(0.5, (dragHeight / window.innerHeight) * 0.5)
                : isBlogsExpanded 
                  ? 0.5 
                  : 0,
              pointerEvents: isBlogsExpanded && !isDragging ? 'auto' : 'none'
            }}
            onClick={() => {
              if (!isDragging) {
                setIsBlogsExpanded(false)
                setDragHeight(null)
              }
            }}
          />
          
          {/* Full Screen Panel */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-50 flex flex-col rounded-t-2xl shadow-2xl"
            style={getPanelStyle()}
          >
            {/* Header with Drag Handle */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="flex items-center justify-between p-4 border-b border-gray-200 bg-white cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">All Blogs</h2>
                  <p className="text-xs text-gray-500 mt-0.5">View all blog posts</p>
                </div>
                <button
                  onClick={() => {
                    setIsBlogsExpanded(false)
                    setDragHeight(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Drag Handle Indicator */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <BlogList />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

