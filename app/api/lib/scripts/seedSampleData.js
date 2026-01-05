import { dirname, resolve } from 'node:path'

import { createBlogsBatch } from '../services/blogService.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { pool } from '../db/connection.js'
import { readFileSync } from 'node:fs'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local (Next.js convention) or .env
// dotenv will automatically check for .env.local first, then .env
dotenv.config({ path: resolve(__dirname, '../../../.env.local') })
dotenv.config({ path: resolve(__dirname, '../../../.env') })

/**
 * Load blog data from JSON file (next 20 records based on offset)
 */
function loadBlogData(offset = 0, limit = 20) {
  try {
    const blogDataPath = resolve(__dirname, 'blogData.json')
    const fileContent = readFileSync(blogDataPath, 'utf-8')
    const allBlogs = JSON.parse(fileContent)
    const endIndex = Math.min(offset + limit, allBlogs.length)
    const blogs = allBlogs.slice(offset, endIndex)
    console.log(`📚 Loaded ${allBlogs.length} blog records from JSON file`)
    console.log(`📝 Using records ${offset + 1}-${endIndex} (${blogs.length} records) for seeding`)
    return blogs
  } catch (error) {
    console.error('❌ Error loading blog data:', error.message)
    console.error('💡 Make sure to run: node app/api/lib/scripts/generateBlogData.js first')
    throw error
  }
}

/**
 * Get the current count of blogs in the database
 */
async function getBlogCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM blogs')
    return Number.parseInt(result.rows[0].count, 10)
  } catch (error) {
    // If table doesn't exist, return 0
    if (error.message.includes('does not exist')) {
      return 0
    }
    throw error
  }
}

/**
 * Clear existing data before seeding
 */
async function clearDatabase() {
  try {
    console.log('🗑️  Clearing existing data...')
    await pool.query('DELETE FROM blog_chunks')
    await pool.query('DELETE FROM blogs')
    console.log('✅ Database cleared')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

/**
 * Create database tables if they don't exist
 */
async function createTables() {
  try {
    console.log('📋 Checking database schema...')
    
    // Enable pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('✅ pgvector extension enabled')
    
    // Create blogs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ blogs table ready')
    
    // Create index for vector similarity search on blogs
    await pool.query(`
      CREATE INDEX IF NOT EXISTS blogs_embedding_idx ON blogs 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
    console.log('✅ blogs embedding index ready')
    
    // Create blog_chunks table
    await pool.query(`
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
      )
    `)
    console.log('✅ blog_chunks table ready')
    
    // Create index for vector similarity search on chunks
    await pool.query(`
      CREATE INDEX IF NOT EXISTS blog_chunks_embedding_idx ON blog_chunks 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
    console.log('✅ blog_chunks embedding index ready')
    
    console.log('✅ Database schema is ready')
  } catch (error) {
    console.error('❌ Error creating database schema:', error.message)
    throw error
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    console.log('🔌 Testing database connection...')
    await pool.query('SELECT 1')
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    if (error.code === 'ENOTFOUND') {
      console.error('   This usually means the database hostname cannot be resolved.')
      console.error('   Please check your DATABASE_URL or DB_HOST environment variable.')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   This usually means the database server is not reachable.')
      console.error('   Please check your database host and port settings.')
    } else if (error.message.includes('password')) {
      console.error('   This usually means the database password is incorrect.')
      console.error('   Please check your DB_PASSWORD or DATABASE_URL.')
    }
    throw error
  }
}

/**
 * Seed the database with sample blogs
 * @param {number} batchSize - Number of records to insert in each batch (default: 20)
 * @param {number} numberOfBatches - Number of batches to process (default: 1)
 */
async function seedDatabase(batchSize = 20, numberOfBatches = 1) {
  try {
    // Test database connection
    await testConnection()
    
    // Create tables if they don't exist
    // await createTables()
    
    // Clear existing data before seeding
    // await clearDatabase()
    
    // Get current blog count to determine offset
    let currentCount = await getBlogCount()
    console.log(`\n📊 Current blogs in database: ${currentCount}`)
    
    const totalStartTime = Date.now()
    let totalCreated = 0
    let totalErrors = 0

    for (let batchNumber = 1; batchNumber <= numberOfBatches; batchNumber++) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📦 Processing Batch ${batchNumber}/${numberOfBatches}`)
      console.log(`${'='.repeat(60)}`)
      
      // Load next batch of records starting from current count
      const sampleBlogs = loadBlogData(currentCount, batchSize)
      
      if (sampleBlogs.length === 0) {
        console.log('⚠️  No more records to seed. All records from JSON file have been processed.')
        break
      }
      
      console.log(`\n🌱 Starting batch seeding...`)
      console.log(`📝 Seeding ${sampleBlogs.length} blog posts in a single batch insert...`)

      try {
        const startTime = Date.now()
        const createdBlogs = await createBlogsBatch(sampleBlogs)
        const endTime = Date.now()
        const duration = ((endTime - startTime) / 1000).toFixed(2)

        console.log(`\n✅ Batch ${batchNumber} completed: Created ${createdBlogs.length} blogs in ${duration} seconds`)
        console.log(`📊 Created blog IDs: ${createdBlogs.map(b => b.id).join(', ')}`)
        
        totalCreated += createdBlogs.length
        currentCount += createdBlogs.length
      } catch (error) {
        console.error(`\n❌ Error creating batch ${batchNumber}:`, error.message)
        totalErrors++
        // Continue with next batch even if one fails
        if (batchNumber < numberOfBatches) {
          console.log('⚠️  Continuing with next batch...')
        }
      }
    }

    const totalEndTime = Date.now()
    const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2)

    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 Seeding Summary:`)
    console.log(`   ✅ Total created: ${totalCreated} blogs`)
    console.log(`   ❌ Total errors: ${totalErrors} batches`)
    console.log(`   ⏱️  Total time: ${totalDuration} seconds`)
    console.log(`   📈 Average: ${totalCreated > 0 ? (totalDuration / totalCreated).toFixed(2) : 0} seconds per blog`)
    console.log(`${'='.repeat(60)}`)

    console.log('\n🎉 Database seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    // Close the database connection
    await pool.end()
    console.log('🔌 Database connection closed')
  }
}

// Get command line arguments for batch size and number of batches
const args = process.argv.slice(2)
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='))
const batchesArg = args.find(arg => arg.startsWith('--batches='))

const batchSize = batchSizeArg ? Number.parseInt(batchSizeArg.split('=')[1], 10) : 20
const numberOfBatches = batchesArg ? Number.parseInt(batchesArg.split('=')[1], 10) : 1

console.log(`\n🚀 Starting seeder with:`)
console.log(`   📦 Batch size: ${batchSize} records per batch`)
console.log(`   🔄 Number of batches: ${numberOfBatches}`)
console.log(`   📊 Total records to process: ${batchSize * numberOfBatches}`)

// Run the seeder
try {
  await seedDatabase(batchSize, numberOfBatches)
  console.log('✅ Seeder script finished successfully')
  process.exit(0)
} catch (error) {
  console.error('❌ Seeder script failed:', error)
  process.exit(1)
}

