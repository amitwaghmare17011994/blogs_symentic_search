-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search using cosine distance
-- This significantly improves search performance
CREATE INDEX IF NOT EXISTS blogs_embedding_idx ON blogs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index on title for faster lookups
CREATE INDEX IF NOT EXISTS blogs_title_idx ON blogs (title);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create blog_chunks table for storing chunked content with embeddings
CREATE TABLE IF NOT EXISTS blog_chunks (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_index INTEGER,
    end_index INTEGER,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search on chunks
CREATE INDEX IF NOT EXISTS blog_chunks_embedding_idx ON blog_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index on blog_id for faster lookups
CREATE INDEX IF NOT EXISTS blog_chunks_blog_id_idx ON blog_chunks (blog_id);

-- Create index on chunk_index for ordering
CREATE INDEX IF NOT EXISTS blog_chunks_chunk_index_idx ON blog_chunks (blog_id, chunk_index);

-- Trigger to automatically update updated_at for chunks
CREATE TRIGGER update_blog_chunks_updated_at BEFORE UPDATE ON blog_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



