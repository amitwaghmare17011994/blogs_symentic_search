# Architecture Documentation

## Overview

This document describes the architecture of the Semantic Blog Search application, a Next.js-based application that uses AI-powered semantic search to find blog posts by meaning rather than keywords.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │    React     │  │ Tailwind CSS │      │
│  │   App Router │  │ Components   │  │   Styling    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Routes  │  │   Services   │  │   Utils      │      │
│  │  /api/blogs  │  │ blogService  │  │ Embeddings   │      │
│  │  /api/search │  │              │  │  Chunking    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (PostgreSQL)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Blogs      │  │ Blog Chunks  │  │  pgvector    │      │
│  │   Table      │  │    Table     │  │  Extension   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Vector Operations
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI/ML Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Xenova      │  │ all-MiniLM   │  │  Embeddings  │      │
│  │ Transformers │  │  L6-v2 Model │  │  (384-dim)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. **Page Component** (`app/page.jsx`)
- Main entry point for the application
- Manages search state and blog list visibility
- Handles responsive layout (desktop/mobile)
- Implements drag-to-expand functionality for mobile

#### 2. **SearchBar Component** (`app/components/SearchBar.jsx`)
- Input field for search queries
- Handles search submission
- Shows loading state during search

#### 3. **SearchResults Component** (`app/components/SearchResults.jsx`)
- Displays semantic search results
- Shows similarity scores
- Highlights matched chunks

#### 4. **BlogList Component** (`app/components/BlogList.jsx`)
- Displays all blogs in the database
- Shows total blog count
- Implements expand/collapse for blog content
- Handles loading and error states

### Backend Components

#### 1. **API Routes**

##### `/api/blogs` (GET)
- Returns all blogs with total count
- Supports pagination (future enhancement)

##### `/api/blogs` (POST)
- Creates a new blog post
- Triggers chunking and embedding generation

##### `/api/blogs/search` (GET)
- Performs semantic search
- Returns blogs with similarity scores
- Uses cosine similarity on vector embeddings

##### `/api/health` (GET)
- Health check endpoint
- Tests database connectivity

#### 2. **Services**

##### `blogService.js`
- **createBlog(title, content)**: Creates a blog with automatic chunking and embedding
- **searchBlogs(query, limit)**: Performs semantic search using vector similarity
- **getAllBlogs()**: Retrieves all blogs from database

#### 3. **Utilities**

##### `embeddings.js`
- **initializeEmbeddingModel()**: Loads the AI model (lazy loading)
- **generateEmbedding(text)**: Converts text to 384-dimensional vector
- Uses `@xenova/transformers` with `all-MiniLM-L6-v2` model

##### `chunking.js`
- **chunkText(text, chunkSize, overlap)**: Splits text into chunks
- **chunkBlog(title, content, chunkSize, overlap)**: Chunks blog with title context
- Implements smart chunking at sentence/word boundaries

##### `textNormalizer.js`
- Normalizes text before processing
- Handles special characters and formatting

## Data Flow

### Blog Creation Flow

```
1. User submits blog (title + content)
   ↓
2. API Route receives POST /api/blogs
   ↓
3. blogService.createBlog() called
   ↓
4. Text normalization applied
   ↓
5. Blog inserted into database (transaction started)
   ↓
6. Content chunked into smaller pieces (500 chars, 100 overlap)
   ↓
7. For each chunk:
   a. Generate embedding (384-dim vector)
   b. Insert chunk with embedding into blog_chunks table
   ↓
8. Transaction committed
   ↓
9. Blog returned to client
```

### Search Flow

```
1. User enters search query
   ↓
2. API Route receives GET /api/blogs/search?q=query
   ↓
3. blogService.searchBlogs() called
   ↓
4. Query text normalized
   ↓
5. Generate embedding for query (384-dim vector)
   ↓
6. SQL query with cosine similarity:
   SELECT blogs.*, 
          1 - (embedding <=> query_vector) AS similarity
   FROM blog_chunks
   JOIN blogs ON blog_chunks.blog_id = blogs.id
   ORDER BY similarity DESC
   LIMIT 10
   ↓
7. Results ranked by similarity score
   ↓
8. Best matching chunk per blog selected
   ↓
9. Results returned to client with similarity scores
```

## Database Schema

### Tables

#### `blogs`
```sql
- id: SERIAL PRIMARY KEY
- title: VARCHAR(500) NOT NULL
- content: TEXT NOT NULL
- embedding: vector(384)  -- Optional, not currently used
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `blog_chunks`
```sql
- id: SERIAL PRIMARY KEY
- blog_id: INTEGER REFERENCES blogs(id) ON DELETE CASCADE
- chunk_text: TEXT NOT NULL
- chunk_index: INTEGER NOT NULL
- start_index: INTEGER
- end_index: INTEGER
- embedding: vector(384) NOT NULL  -- Used for search
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Indexes

- **blogs_embedding_idx**: IVFFlat index on `blogs.embedding` (for future use)
- **blog_chunks_embedding_idx**: IVFFlat index on `blog_chunks.embedding` (for search)

### Vector Similarity

The application uses **cosine similarity** for vector comparison:
- Formula: `1 - (embedding1 <=> embedding2)`
- Range: 0 to 1 (higher = more similar)
- The `<=>` operator is provided by pgvector extension

## AI Model Details

### Model: all-MiniLM-L6-v2
- **Provider**: Xenova Transformers
- **Type**: Sentence transformer
- **Dimensions**: 384
- **Quantized**: Yes (for faster loading)
- **Size**: ~90MB
- **Use Case**: Feature extraction (embeddings)

### Embedding Process

1. Text is normalized (lowercase, special chars handled)
2. Model tokenizes the text
3. Generates 384-dimensional vector
4. Vector is normalized (L2 normalization)
5. Stored as JSON string in PostgreSQL, converted to `vector` type

## Performance Optimizations

### 1. **Lazy Model Loading**
- Model loads only on first use
- Cached in memory for subsequent requests
- Reduces initial startup time

### 2. **Chunking Strategy**
- Blogs split into 500-character chunks
- 100-character overlap between chunks
- Improves search accuracy for long content
- Allows matching on specific sections

### 3. **Batch Processing**
- Seeder processes 10 blogs in parallel
- Reduces total seeding time
- Uses Promise.all for concurrent operations

### 4. **Database Indexing**
- IVFFlat indexes on vector columns
- Optimized for cosine similarity search
- Lists parameter set to 100 for balance

### 5. **Connection Pooling**
- PostgreSQL connection pool (max 20 connections)
- Reuses connections for efficiency
- Handles connection timeouts gracefully

## Security Considerations

### 1. **Environment Variables**
- Database credentials stored in `.env.local`
- Not committed to version control
- Required for production deployment

### 2. **Input Validation**
- Text normalization prevents injection
- Parameterized SQL queries (prevents SQL injection)
- Content length limits enforced

### 3. **Error Handling**
- Graceful error messages to users
- Detailed logging for debugging
- Transaction rollback on errors

## Scalability Considerations

### Current Limitations

1. **Model Loading**: Single instance loads model into memory
2. **Database**: Single PostgreSQL instance
3. **Embedding Generation**: Synchronous, one at a time per blog

### Future Enhancements

1. **Model Caching**: Redis cache for embeddings
2. **Background Jobs**: Queue system for embedding generation
3. **Horizontal Scaling**: Multiple API instances with shared model
4. **CDN**: Static asset optimization
5. **Database Replication**: Read replicas for search queries

## Deployment Architecture

### Recommended Setup

```
┌─────────────────┐
│   Vercel/       │
│   Next.js       │  ← Frontend + API Routes
└─────────────────┘
        │
        │ HTTPS
        ▼
┌─────────────────┐
│   Supabase     │
│   PostgreSQL   │  ← Database with pgvector
└─────────────────┘
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)

## Monitoring and Logging

### Current Logging

- Console logs for:
  - Database connections
  - Blog creation
  - Search operations
  - Errors and warnings

### Recommended Additions

- Application performance monitoring (APM)
- Error tracking (Sentry)
- Database query monitoring
- Vector search performance metrics

## Testing Strategy

### Unit Tests (Future)
- Text normalization functions
- Chunking logic
- Embedding generation

### Integration Tests (Future)
- API endpoint testing
- Database operations
- Search functionality

### E2E Tests (Future)
- User search workflows
- Blog creation flows
- Mobile responsiveness

## Configuration Files

### `next.config.js`
- Webpack configuration for native modules
- Excludes `onnxruntime-node` from bundling
- Server components external packages

### `tailwind.config.js`
- Tailwind CSS configuration
- Custom theme settings

### `package.json`
- Dependencies and scripts
- Node.js version requirements

## Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Database Seeding**
   ```bash
   npm run generate-blog-data  # Generate sample data
   npm run seed                # Seed database
   ```

3. **Production Build**
   ```bash
   npm run build
   npm run start
   ```

## Troubleshooting Guide

### Common Issues

1. **Webpack errors with .node files**
   - Already handled in `next.config.js`
   - Native modules excluded from bundling

2. **Model loading timeout**
   - First load takes 10-30 seconds
   - Subsequent loads are instant (cached)

3. **Database connection errors**
   - Check `.env.local` file
   - Verify Supabase connection string
   - Ensure pgvector extension is enabled

4. **Search returning no results**
   - Verify embeddings are generated
   - Check database indexes are created
   - Ensure chunks have embeddings

## Future Enhancements

1. **Advanced Search**
   - Filter by date range
   - Sort by relevance/date
   - Faceted search

2. **User Features**
   - User authentication
   - Saved searches
   - Search history

3. **Performance**
   - Embedding caching
   - Background job processing
   - CDN integration

4. **Analytics**
   - Search analytics
   - Popular blogs
   - User behavior tracking

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Xenova Transformers](https://github.com/xenova/transformers.js)
- [Supabase Documentation](https://supabase.com/docs)

