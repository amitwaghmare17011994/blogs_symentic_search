# Semantic Blog Search - Next.js

A semantic blog search application built with Next.js, featuring AI-powered semantic search using embeddings and PostgreSQL with pgvector.

## Features

- 🔍 **Semantic Search**: Find blogs by meaning, not just keywords
- 📝 **Blog Management**: Create and manage blog posts
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- ⚡ **Next.js 14**: Built with the latest Next.js App Router
- 🗄️ **Supabase**: PostgreSQL database with pgvector extension
- 🤖 **AI Embeddings**: Uses Xenova transformers for semantic embeddings

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase) with pgvector
- **AI**: @xenova/transformers (all-MiniLM-L6-v2)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database with pgvector extension (Supabase recommended)
- npm or yarn

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ypwwckxicukfaknkavmn.supabase.co:5432/postgres
   ```

4. **Set up the database**:
   Run the SQL schema in your Supabase SQL Editor:
   ```sql
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

   -- Create index for vector similarity search
   CREATE INDEX IF NOT EXISTS blogs_embedding_idx ON blogs 
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);

   -- Create blog_chunks table
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
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/
├── app/
│   ├── api/              # Next.js API routes
│   │   ├── blogs/        # Blog API endpoints
│   │   └── health/       # Health check endpoint
│   ├── layout.jsx        # Root layout
│   ├── page.jsx          # Home page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── BlogList.jsx
│   ├── SearchBar.jsx
│   └── SearchResults.jsx
├── lib/
│   ├── db/              # Database connection
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
└── public/              # Static assets
```

## API Endpoints

### GET `/api/blogs`
Get all blogs

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

### POST `/api/blogs`
Create a new blog post

**Body:**
```json
{
  "title": "Blog Title",
  "content": "Blog content..."
}
```

### GET `/api/blogs/search?q=query&limit=10`
Search blogs using semantic similarity

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "query": "search query",
  "count": 5,
  "data": [
    {
      "id": 1,
      "title": "Blog Title",
      "content": "...",
      "similarity": 0.95,
      "matchedChunk": "..."
    }
  ]
}
```

### GET `/api/health`
Health check endpoint

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add Environment Variables**:
   - `DATABASE_URL`: Your Supabase connection string

4. **Deploy**:
   - Vercel will automatically detect Next.js and deploy

The application will be available at `https://your-project.vercel.app`

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## How It Works

1. **Blog Creation**: When a blog is created, it's chunked into smaller pieces with overlap
2. **Embedding Generation**: Each chunk is converted to a 384-dimensional vector using the all-MiniLM-L6-v2 model
3. **Storage**: Embeddings are stored in PostgreSQL using the pgvector extension
4. **Search**: When searching, the query is embedded and compared against stored embeddings using cosine similarity
5. **Results**: The most similar chunks are returned with their parent blogs

## Notes

- The embedding model loads lazily on first use (may take 10-30 seconds)
- Chunking improves search accuracy by allowing matches on specific sections
- The model uses quantized weights for faster loading and lower memory usage

## License

ISC

