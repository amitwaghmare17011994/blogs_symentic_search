import { dirname, resolve } from 'node:path'

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { pool } from '../db/connection.js'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local (Next.js convention) or .env
dotenv.config({ path: resolve(__dirname, '../../../.env.local') })
dotenv.config({ path: resolve(__dirname, '../../../.env') })

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
    throw error
  }
}

/**
 * Find duplicate blogs by title
 * @returns {Promise<Array>} Array of duplicate groups
 */
async function findDuplicates() {
  try {
    const query = `
      SELECT 
        title,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY created_at ASC) as ids,
        ARRAY_AGG(created_at ORDER BY created_at ASC) as created_dates
      FROM blogs
      GROUP BY title
      HAVING COUNT(*) > 1
      ORDER BY count DESC, title
    `
    
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('❌ Error finding duplicates:', error)
    throw error
  }
}

/**
 * Delete duplicate blogs, keeping the oldest one
 * @param {boolean} dryRun - If true, only show what would be deleted without actually deleting
 * @returns {Promise<Object>} Summary of deletions
 */
async function deleteDuplicates(dryRun = false) {
  try {
    await testConnection()
    
    console.log('\n🔍 Searching for duplicate blogs...')
    const duplicates = await findDuplicates()
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate blogs found!')
      return {
        duplicateGroups: 0,
        totalDuplicates: 0,
        deleted: 0,
      }
    }
    
    console.log(`\n📊 Found ${duplicates.length} duplicate title(s):`)
    let totalDuplicates = 0
    let totalToDelete = 0
    
    duplicates.forEach((dup, index) => {
      const keepId = dup.ids[0] // Keep the oldest (first in array)
      const deleteIds = dup.ids.slice(1) // Delete the rest
      totalDuplicates += dup.count
      totalToDelete += deleteIds.length
      
      console.log(`\n${index + 1}. Title: "${dup.title}"`)
      console.log(`   Total: ${dup.count} blogs`)
      console.log(`   Keep: ID ${keepId} (created: ${new Date(dup.created_dates[0]).toLocaleString()})`)
      console.log(`   Delete: ${deleteIds.length} blog(s) - IDs: ${deleteIds.join(', ')}`)
    })
    
    console.log(`\n📈 Summary:`)
    console.log(`   Duplicate groups: ${duplicates.length}`)
    console.log(`   Total blogs with duplicates: ${totalDuplicates}`)
    console.log(`   Blogs to delete: ${totalToDelete}`)
    console.log(`   Blogs to keep: ${duplicates.length}`)
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No blogs were deleted')
      console.log('💡 Run without --dry-run flag to actually delete duplicates')
      return {
        duplicateGroups: duplicates.length,
        totalDuplicates,
        deleted: 0,
      }
    }
    
    // Delete duplicates
    console.log('\n🗑️  Deleting duplicate blogs...')
    let deletedCount = 0
    
    await pool.query('BEGIN')
    
    try {
      for (const dup of duplicates) {
        const deleteIds = dup.ids.slice(1) // Skip the first (oldest) one
        
        if (deleteIds.length > 0) {
          // Delete blogs (chunks will be deleted automatically via CASCADE)
          const deleteQuery = `
            DELETE FROM blogs
            WHERE id = ANY($1::int[])
          `
          
          const result = await pool.query(deleteQuery, [deleteIds])
          deletedCount += result.rowCount
          
          console.log(`   ✅ Deleted ${result.rowCount} duplicate(s) for "${dup.title}"`)
        }
      }
      
      await pool.query('COMMIT')
      console.log(`\n✅ Successfully deleted ${deletedCount} duplicate blog(s)`)
      
      // Verify deletion
      const remainingDuplicates = await findDuplicates()
      if (remainingDuplicates.length === 0) {
        console.log('✅ Verification: No duplicates remaining')
      } else {
        console.log(`⚠️  Warning: ${remainingDuplicates.length} duplicate group(s) still exist`)
      }
      
      return {
        duplicateGroups: duplicates.length,
        totalDuplicates,
        deleted: deletedCount,
      }
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('❌ Error deleting duplicates:', error)
    throw error
  } finally {
    await pool.end()
    console.log('🔌 Database connection closed')
  }
}

// Get command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run') || args.includes('-d')

console.log(`\n🚀 Starting duplicate blog deletion script`)
if (dryRun) {
  console.log('🔍 Running in DRY RUN mode (no changes will be made)')
}

// Run the script
try {
  const result = await deleteDuplicates(dryRun)
  console.log('\n✅ Script completed successfully')
  console.log(`📊 Final Summary:`)
  console.log(`   Duplicate groups found: ${result.duplicateGroups}`)
  console.log(`   Total duplicates: ${result.totalDuplicates}`)
  console.log(`   Deleted: ${result.deleted}`)
  process.exit(0)
} catch (error) {
  console.error('❌ Script failed:', error)
  process.exit(1)
}

