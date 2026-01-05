/**
 * Normalizes and cleans text before embedding generation
 * Removes extra whitespace, normalizes line breaks, and trims
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Replace multiple newlines with single newline
    .replace(/\n+/g, '\n')
    // Remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}





