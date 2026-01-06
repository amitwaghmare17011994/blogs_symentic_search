'use client'

import { useEffect, useState } from 'react'

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
  const [windowHeight, setWindowHeight] = useState(0)

  // Set window height on client side only
  useEffect(() => {
    if (globalThis.window !== undefined) {
      setWindowHeight(globalThis.window.innerHeight)
      
      const handleResize = () => {
        setWindowHeight(globalThis.window.innerHeight)
      }
      
      globalThis.window.addEventListener('resize', handleResize)
      return () => globalThis.window.removeEventListener('resize', handleResize)
    }
  }, [])

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

  // Get panel transform and height based on state
  const getPanelStyle = () => {
    // Use windowHeight state or fallback to 100vh if not yet set (SSR)
    const maxHeight = windowHeight || (globalThis.window !== undefined ? globalThis.window.innerHeight : 1000)
    const topMargin = maxHeight * 0.1 // 10% of screen height
    
    if (isBlogsExpanded) {
      return {
        height: `calc(100vh - ${topMargin}px)`,
        marginTop: `${topMargin}px`,
        transform: `translateY(${topMargin}px)`,
        opacity: 1,
        transition: 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1), height 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease-out'
      }
    }
    
    return {
      height: '0px',
      marginTop: '0px',
      transform: `translateY(${maxHeight}px)`,
      opacity: 0,
      transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1), height 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-in'
    }
  }

  // Get backdrop style with animation
  const getBackdropStyle = () => {
    if (isBlogsExpanded) {
      return {
        opacity: 0.5,
        pointerEvents: 'auto',
        transition: 'opacity 300ms ease-in'
      }
    }
    
    return {
      opacity: 0,
      pointerEvents: 'none',
      transition: 'opacity 200ms ease-out'
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

      {/* Mobile Bottom Button - All Blogs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <button
          onClick={() => setIsBlogsExpanded(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 shadow-lg transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">All Blogs</h2>
              <p className="text-sm opacity-90">Tap to view all blogs</p>
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
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black z-50"
        style={getBackdropStyle()}
        onClick={() => setIsBlogsExpanded(false)}
      />
      
      {/* Full Screen Panel */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-50 flex flex-col rounded-t-2xl shadow-2xl mt-4"
        style={{
          ...getPanelStyle(),
          pointerEvents: isBlogsExpanded ? 'auto' : 'none'
        }}
      >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">All Blogs</h2>
              <button
                onClick={() => setIsBlogsExpanded(false)}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors flex-shrink-0"
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
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <BlogList />
              </div>
            </div>
          </div>
    </div>
  )
}

