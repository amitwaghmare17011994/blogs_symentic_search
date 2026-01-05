import { pool } from '../lib/db/connection'

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET() {
  try {
    // Test database connection
    await pool.query('SELECT 1')
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    )
  }
}

