/**
 * Utility functions for chunking text into smaller pieces for better embedding accuracy
 */

/**
 * Split text into chunks with overlap for better context preservation
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Maximum characters per chunk (default: 500)
 * @param {number} overlap - Number of characters to overlap between chunks (default: 100)
 * @returns {Array<{text: string, startIndex: number, endIndex: number}>} Array of chunks with metadata
 */
export function chunkText(text, chunkSize = 500, overlap = 100) {
  if (!text || typeof text !== 'string') {
    return []
  }

  const chunks = []
  let startIndex = 0
  const textLength = text.length

  // If text is shorter than chunk size, return as single chunk
  if (textLength <= chunkSize) {
    return [{
      text: text.trim(),
      startIndex: 0,
      endIndex: textLength,
      chunkIndex: 0,
    }]
  }

  let chunkIndex = 0

  while (startIndex < textLength) {
    let endIndex = Math.min(startIndex + chunkSize, textLength)

    // Try to break at sentence boundaries for better chunk quality
    if (endIndex < textLength) {
      // Look for sentence endings within the last 20% of the chunk
      const searchStart = Math.max(startIndex, endIndex - chunkSize * 0.2)
      const sentenceEndings = /[.!?]\s+/g
      let lastMatch = null
      let match

      // Reset regex to search from searchStart
      sentenceEndings.lastIndex = searchStart
      while ((match = sentenceEndings.exec(text)) !== null && match.index < endIndex) {
        lastMatch = match
      }

      if (lastMatch) {
        endIndex = lastMatch.index + lastMatch[0].length
      } else {
        // If no sentence ending found, try to break at word boundaries
        const wordBoundary = /\s+/g
        wordBoundary.lastIndex = searchStart
        let wordMatch
        let lastWordMatch = null
        while ((wordMatch = wordBoundary.exec(text)) !== null && wordMatch.index < endIndex) {
          lastWordMatch = wordMatch
        }
        if (lastWordMatch) {
          endIndex = lastWordMatch.index
        }
      }
    }

    const chunkText = text.substring(startIndex, endIndex).trim()

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        startIndex,
        endIndex,
        chunkIndex: chunkIndex++,
      })
    }

    // Move start index forward, accounting for overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlap)

    // Prevent infinite loop
    if (startIndex >= endIndex) {
      startIndex = endIndex
    }
  }

  return chunks
}

/**
 * Chunk blog content with title context
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @param {number} chunkSize - Maximum characters per chunk (default: 500)
 * @param {number} overlap - Number of characters to overlap (default: 100)
 * @returns {Array<{text: string, startIndex: number, endIndex: number, chunkIndex: number}>} Array of chunks
 */
export function chunkBlog(title, content, chunkSize = 500, overlap = 100) {
  // Combine title and content for chunking
  // Title is included in first chunk for context
  const fullText = `${title}\n\n${content}`
  const chunks = chunkText(fullText, chunkSize, overlap)

  // Ensure title is included in first chunk if possible
  if (chunks.length > 0 && !chunks[0].text.includes(title)) {
    // Prepend title to first chunk if it fits, otherwise create a separate title chunk
    const titleWithSeparator = `${title}\n\n`
    if (chunks[0].text.length + titleWithSeparator.length <= chunkSize) {
      chunks[0].text = titleWithSeparator + chunks[0].text
    } else {
      // Insert title as first chunk
      chunks.unshift({
        text: title,
        startIndex: 0,
        endIndex: title.length,
        chunkIndex: -1, // Special index for title chunk
      })
      // Re-index other chunks
      chunks.forEach((chunk, idx) => {
        if (chunk.chunkIndex >= 0) {
          chunk.chunkIndex = idx
        }
      })
    }
  }

  return chunks
}

