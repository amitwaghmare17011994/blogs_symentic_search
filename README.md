# Semantic Blog Search - Next.js

A semantic blog search application built with Next.js, featuring AI-powered semantic search using embeddings and PostgreSQL with pgvector. This application enables users to search for blog posts by meaning rather than just keywords, providing more relevant and contextual search results.

## Features

- 🔍 **Semantic Search**: Find blogs by meaning, not just keywords using AI-powered embeddings
- 📝 **Blog Management**: Create and manage blog posts with automatic chunking and embedding
- 🎨 **Modern UI**: Responsive design with Tailwind CSS, optimized for desktop and mobile
- ⚡ **Next.js 14**: Built with the latest Next.js App Router and React Server Components
- 🗄️ **PostgreSQL with pgvector**: Efficient vector similarity search using Supabase
- 🤖 **AI Embeddings**: Uses Xenova transformers (all-MiniLM-L6-v2) for semantic embeddings
- 📊 **Bulk Processing**: Efficient batch processing for blog creation and seeding
- 🔄 **Incremental Seeding**: Smart seeder that picks next batch of records automatically
- 📈 **Real-time Count**: Display total blog count on the frontend

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
   The database schema will be created automatically when you run the seeder. Alternatively, you can run the SQL schema manually in your Supabase SQL Editor:
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

5. **Generate sample blog data** (optional):
   ```bash
   npm run generate-blog-data
   ```
   This creates a JSON file with 1000 sample blog posts.

6. **Seed the database** (optional):
   ```bash
   npm run seed
   ```
   This will:
   - Create tables if they don't exist
   - Pick the next 20 records from the JSON file (based on current database count)
   - Process them in batches of 10 for efficiency
   - Generate embeddings and chunks for each blog

7. **Run the development server**:
   ```bash
   npm run dev
   ```

8. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/
├── app/
│   ├── api/                      # Next.js API routes
│   │   ├── blogs/                # Blog API endpoints
│   │   │   ├── route.js          # GET/POST /api/blogs
│   │   │   └── search/
│   │   │       └── route.js      # GET /api/blogs/search
│   │   ├── health/
│   │   │   └── route.js           # Health check endpoint
│   │   └── lib/                   # Backend utilities
│   │       ├── db/
│   │       │   └── connection.js  # PostgreSQL connection pool
│   │       ├── services/
│   │       │   └── blogService.js # Business logic for blogs
│   │       ├── utils/
│   │       │   ├── chunking.js    # Text chunking utilities
│   │       │   ├── embeddings.js  # AI embedding generation
│   │       │   └── textNormalizer.js # Text normalization
│   │       └── scripts/
│   │           ├── generateBlogData.js  # Generate sample blog data
│   │           ├── seedSampleData.js   # Database seeder
│   │           └── blogData.json       # Generated blog data (1000 records)
│   ├── components/                # React components
│   │   ├── BlogCardSkeleton.jsx  # Loading skeleton
│   │   ├── BlogList.jsx          # List of all blogs
│   │   ├── SearchBar.jsx         # Search input component
│   │   └── SearchResults.jsx    # Search results display
│   ├── lib/
│   │   └── api.js                # Client-side API functions
│   ├── layout.jsx                # Root layout
│   ├── page.jsx                  # Home page
│   └── globals.css               # Global styles
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
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

### Database Seeding

The seeder script is designed to work incrementally:

- **First run**: Seeds records 1-20
- **Second run**: Seeds records 21-40
- **Third run**: Seeds records 41-60
- And so on...

The seeder automatically:
- Checks the current blog count in the database
- Picks the next 20 records from the JSON file
- Processes them in batches of 10 in parallel
- Creates embeddings and chunks for each blog

To seed all 1000 records, run the seeder 50 times, or modify the limit in `seedSampleData.js`.

### Generating Sample Data

To regenerate the sample blog data:

```bash
npm run generate-blog-data
```

This creates a new `blogData.json` file with 1000 diverse blog posts about astronomy, space, and related topics.

## How It Works

1. **Blog Creation**: When a blog is created, it's chunked into smaller pieces with overlap
2. **Embedding Generation**: Each chunk is converted to a 384-dimensional vector using the all-MiniLM-L6-v2 model
3. **Storage**: Embeddings are stored in PostgreSQL using the pgvector extension
4. **Search**: When searching, the query is embedded and compared against stored embeddings using cosine similarity
5. **Results**: The most similar chunks are returned with their parent blogs

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run generate-blog-data` - Generate sample blog data (1000 records)
- `npm run seed` - Seed database with next 20 records

## Notes

- The embedding model loads lazily on first use (may take 10-30 seconds)
- Chunking improves search accuracy by allowing matches on specific sections
- The model uses quantized weights for faster loading and lower memory usage
- Blog creation processes chunks in parallel for better performance
- The seeder uses batch processing (10 blogs at a time) for efficiency

## Troubleshooting

### Webpack Error with onnxruntime-node

If you encounter webpack errors related to `.node` files, the `next.config.js` is already configured to handle this. The native modules are excluded from webpack bundling.

### Database Connection Issues

- Ensure your `.env.local` file has the correct `DATABASE_URL`
- Check that your Supabase database has the pgvector extension enabled
- Verify network connectivity to your database

### Embedding Model Loading

- First request may take 10-30 seconds to load the model
- Model is cached in memory after first load
- Ensure sufficient memory is available (model requires ~100MB)

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For more details on the architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

