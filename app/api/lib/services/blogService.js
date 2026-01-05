import { chunkBlog } from '../utils/chunking.js'
import { generateEmbedding } from '../utils/embeddings.js'
import { normalizeText } from '../utils/textNormalizer.js'
import { pool } from '../db/connection.js'

/**
 * Create a new blog post with chunked embeddings
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @returns {Promise<Object>} Created blog object
 */
export async function createBlog(title, content) {
  if (!title || !content) {
    throw new Error('Title and content are required')
  }

  // Normalize text
  const normalizedTitle = normalizeText(title)
  const normalizedContent = normalizeText(content)

  if (normalizedTitle.length === 0 || normalizedContent.length === 0) {
    throw new Error('Title and content cannot be empty after normalization')
  }

  try {
    // Start transaction
    await pool.query('BEGIN')

    // Insert blog without embedding (we'll use chunks for search)
    const blogQuery = `
      INSERT INTO blogs (title, content)
      VALUES ($1, $2)
      RETURNING id, title, content, created_at, updated_at
    `

    const blogResult = await pool.query(blogQuery, [
      normalizedTitle,
      normalizedContent,
    ])

    const blogId = blogResult.rows[0].id

    // Chunk the blog content
    const chunks = chunkBlog(normalizedTitle, normalizedContent, 500, 100)
    console.log(`📦 Created ${chunks.length} chunks for blog ${blogId}`)

    // Generate embeddings for each chunk and insert
    const chunkInsertQuery = `
      INSERT INTO blog_chunks (blog_id, chunk_text, chunk_index, start_index, end_index, embedding)
      VALUES ($1, $2, $3, $4, $5, $6::vector)
    `

    for (const chunk of chunks) {
      try {
        const chunkEmbedding = await generateEmbedding(chunk.text)
        await pool.query(chunkInsertQuery, [
          blogId,
          chunk.text,
          chunk.chunkIndex,
          chunk.startIndex,
          chunk.endIndex,
          JSON.stringify(chunkEmbedding),
        ])
      } catch (error) {
        console.error(`Error creating chunk ${chunk.chunkIndex} for blog ${blogId}:`, error)
        // Continue with other chunks
      }
    }

    // Commit transaction
    await pool.query('COMMIT')

    console.log(`✅ Blog created with ID: ${blogId} and ${chunks.length} chunks`)
    return blogResult.rows[0]
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK')
    console.error('Error creating blog:', error)
    throw error
  }
}

/**
 * Search blogs using semantic similarity on chunks
 * Uses cosine similarity with pgvector on chunked content
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<Array>} Array of blog results with similarity scores and matched chunks
 */
export async function searchBlogs(query, limit = 10) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string')
  }

  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100')
  }

  try {
    // Generate embedding for query
    console.log('🔄 Generating embedding for search query...')
    const queryEmbedding = await generateEmbedding(query)

    // Search chunks and join with blogs to get full blog info
    // Use DISTINCT ON to get the best matching chunk per blog
    // First order by similarity, then use DISTINCT ON to get one result per blog
    const searchQuery = `
      WITH ranked_chunks AS (
        SELECT 
          b.id,
          b.title,
          b.content,
          b.created_at,
          b.updated_at,
          bc.chunk_text AS matched_chunk,
          bc.chunk_index,
          bc.start_index,
          bc.end_index,
          1 - (bc.embedding <=> $1::vector) AS similarity,
          ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY bc.embedding <=> $1::vector) AS rn
        FROM blog_chunks bc
        INNER JOIN blogs b ON bc.blog_id = b.id
        WHERE bc.embedding IS NOT NULL
      )
      SELECT 
        id,
        title,
        content,
        created_at,
        updated_at,
        matched_chunk,
        chunk_index,
        start_index,
        end_index,
        similarity
      FROM ranked_chunks
      WHERE rn = 1
      ORDER BY similarity DESC
      LIMIT $2
    `

    const result = await pool.query(searchQuery, [
      JSON.stringify(queryEmbedding),
      limit,
    ])

    console.log(`✅ Found ${result.rows.length} results for query`)
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      matchedChunk: row.matched_chunk,
      chunkIndex: row.chunk_index,
      startIndex: row.start_index,
      endIndex: row.end_index,
      similarity: Number.parseFloat(row.similarity),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  } catch (error) {
    console.error('Error searching blogs:', error)
    throw error
  }
}

/**
 * Get all blogs
 * @returns {Promise<Array>} Array of all blogs
 */
export async function getAllBlogs() {
  try {
    const query = `
      SELECT id, title, content, created_at, updated_at
      FROM blogs
      ORDER BY created_at DESC
    `

    const result = await pool.query(query)
    
    return result.rows
  } catch (error) {
    console.error('Error fetching blogs:', error)
    throw error
  }
}

