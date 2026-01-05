import { pipeline } from '@xenova/transformers';
import { normalizeText } from './textNormalizer.js';

// Global model instance - loaded once at server startup
let embeddingModel = null;

/**
 * Initialize the embedding model
 * This should be called once at server startup
 */
export async function initializeEmbeddingModel() {
  if (embeddingModel) {
    console.log('✅ Embedding model already initialized');
    return embeddingModel;
  }

  try {
    console.log('🔄 Loading embedding model: all-MiniLM-L6-v2...');
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        quantized: true, // Use quantized model for faster loading
      }
    );
    console.log('✅ Embedding model loaded successfully');
    return embeddingModel;
  } catch (error) {
    console.error('❌ Error loading embedding model:', error);
    throw error;
  }
}

/**
 * Generate embedding for given text
 * Returns a normalized 384-dimensional vector
 * 
 * @param {string} text - Input text to embed
 * @returns {Promise<number[]>} Normalized 384-dimensional vector
 */
export async function generateEmbedding(text) {
  if (!embeddingModel) {
    throw new Error('Embedding model not initialized. Call initializeEmbeddingModel() first.');
  }

  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  try {
    // Normalize text before embedding
    const normalizedText = normalizeText(text);

    if (normalizedText.length === 0) {
      throw new Error('Text is empty after normalization');
    }

    // Generate embedding
    const output = await embeddingModel(normalizedText, {
      pooling: 'mean',
      normalize: true, // Normalize the output vector
    });

    // Extract the embedding vector
    // The model returns a tensor, we need to convert it to an array
    const embedding = Array.from(output.data);

    // Ensure it's exactly 384 dimensions
    if (embedding.length !== 384) {
      throw new Error(`Expected 384 dimensions, got ${embedding.length}`);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Get the embedding model instance (for testing/debugging)
 */
export function getEmbeddingModel() {
  return embeddingModel;
}





