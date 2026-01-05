import pg from 'pg'

const { Pool } = pg

// Create PostgreSQL connection pool for Supabase
// Supports both connection string and individual parameters
const connectionConfig =  
  {
      connectionString: process.env.DATABASE_URL || "postgresql://postgres.ysydwqwkcrphvkgupixa:M@rkitn0w@123@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres",
      ssl: {
        rejectUnauthorized: false, // Supabase requires SSL
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  

export const pool = new Pool(connectionConfig)

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err)
})

