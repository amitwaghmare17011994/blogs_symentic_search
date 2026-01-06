'use client'

import { useState } from 'react'
import { BlogCardSkeletons } from './BlogCardSkeleton'

/**
 * SearchResults component to display search results
 */
export default function SearchResults({ results, query, isLoading = false }) {
  const [expandedBlogs, setExpandedBlogs] = useState(new Set())
  
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Search Results
          </h2>
          <p className="text-sm text-gray-600">
            Searching...
          </p>
        </div>
        <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
          <BlogCardSkeletons count={5} isTopMatch={true} />
        </div>
      </div>
    )
  }
  
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">
          {query ? 'No results found. Try a different search query.' : 'Enter a search query to find relevant blogs.'}
        </p>
      </div>
    )
  }

  /**
   * Get content preview (first 200 characters)
   */
  const getPreview = (content) => {
    if (content.length <= 200) {
      return content
    }
    return content.substring(0, 200) + '...'
  }

  /**
   * Format similarity score as percentage
   */
  const formatSimilarity = (score) => {
    return (score * 100).toFixed(1)
  }

  /**
   * Toggle expand/collapse state for a blog
   */
  const toggleExpand = (blogId) => {
    setExpandedBlogs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(blogId)) {
        newSet.delete(blogId)
      } else {
        newSet.add(blogId)
      }
      return newSet
    })
  }

  // Sort results by similarity (highest first) and identify top match
  const sortedResults = [...results].sort((a, b) => {
    const aScore = a.similarity !== undefined ? a.similarity : 0
    const bScore = b.similarity !== undefined ? b.similarity : 0
    return bScore - aScore
  })

  const topMatchId = sortedResults.length > 0 && sortedResults[0].similarity !== undefined 
    ? sortedResults[0].id 
    : null

  return (
    <div className="w-full space-y-4 overflow-x-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Search Results
        </h2>
        <p className="text-sm text-gray-600">
          Found {results.length} result{results.length !== 1 ? 's' : ''} {query && `for "${query}"`}
        </p>
      </div>

      <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto overflow-x-hidden">
        {sortedResults.map((blog, index) => {
          const isExpanded = expandedBlogs.has(blog.id)
          const showPreview = blog.content && blog.content.length > 200
          const isTopMatch = blog.id === topMatchId
          
          return (
            <div
              key={blog.id}
              className={`rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
                isTopMatch
                  ? 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 p-6 transform scale-[1.02]'
                  : 'bg-gray-50 border border-gray-200 p-5'
              }`}
            >
              {isTopMatch && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md">
                    ⭐ Best Match
                  </span>
                  {blog.similarity !== undefined && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-bold shadow-md">
                      {formatSimilarity(blog.similarity)}% match
                    </span>
                  )}
                </div>
              )}
              
              <div className={`flex justify-between items-start gap-2 ${isTopMatch ? 'mb-4' : 'mb-3'}`}>
                <h3 className={`font-semibold text-gray-900 flex-1 break-words min-w-0 ${
                  isTopMatch ? 'text-2xl' : 'text-lg'
                }`}>
                  {blog.title}
                </h3>
                {!isTopMatch && blog.similarity !== undefined && (
                  <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
                    {formatSimilarity(blog.similarity)}% match
                  </span>
                )}
              </div>
              
              {/* Show matched chunk if available */}
              {blog.matchedChunk && (
                <div className={`mb-3 p-3 rounded-md border-l-4 ${
                  isTopMatch 
                    ? 'bg-purple-50 border-purple-400' 
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    isTopMatch ? 'text-purple-700' : 'text-blue-700'
                  }`}>
                    📍 Matched Section:
                  </p>
                  <p className={`text-gray-800 leading-relaxed break-words overflow-wrap-anywhere ${
                    isTopMatch ? 'text-sm' : 'text-xs'
                  }`}>
                    {blog.matchedChunk}
                  </p>
                </div>
              )}
              
              <p className={`text-gray-700 leading-relaxed mb-2 break-words overflow-wrap-anywhere ${
                isTopMatch ? 'text-base' : 'text-sm'
              }`}>
                {isExpanded || !showPreview ? blog.content : getPreview(blog.content)}
              </p>
              
              {showPreview && (
                <button
                  onClick={() => toggleExpand(blog.id)}
                  className={`font-medium mb-2 transition-colors ${
                    isTopMatch
                      ? 'text-purple-600 hover:text-purple-800 text-base'
                      : 'text-blue-600 hover:text-blue-800 text-sm'
                  }`}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
              
              <div className={`text-gray-500 mt-4 ${isTopMatch ? 'text-sm' : 'text-xs'}`}>
                <time dateTime={blog.created_at}>
                  {new Date(blog.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

