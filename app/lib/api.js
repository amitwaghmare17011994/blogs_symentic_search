/**
 * Client-side API functions for Next.js
 */

/**
 * Search blogs using semantic similarity
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object>} Search results
 */
export async function searchBlogs(query, limit = 10) {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty')
  }

  const url = new URL('/api/blogs/search', window.location.origin)
  url.searchParams.append('q', query.trim())
  if (limit) {
    url.searchParams.append('limit', limit.toString())
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.message || error.error || 'Failed to search blogs')
  }

  return response.json()
}

/**
 * Get all blogs
 * @returns {Promise<Object>} All blogs
 */
export async function getAllBlogs() {
  const response = await fetch('/api/blogs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.message || error.error || 'Failed to fetch blogs')
  }

  return response.json()
}

/**
 * Create a new blog post
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @returns {Promise<Object>} Created blog
 */
export async function createBlog(title, content) {
  if (!title || !content) {
    throw new Error('Title and content are required')
  }

  const response = await fetch('/api/blogs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.message || error.error || 'Failed to create blog')
  }

  return response.json()
}

