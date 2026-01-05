import { searchBlogs } from '../../lib/services/blogService'

/**
 * GET /api/blogs/search?q=query&limit=10
 * Search blogs using semantic similarity
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit')

    if (!query || query.trim().length === 0) {
      return Response.json(
        {
          error: 'Query parameter "q" is required',
        },
        { status: 400 }
      )
    }

    const limitNum = limit ? Number.parseInt(limit, 10) : 10

    if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return Response.json(
        {
          error: 'Limit must be a number between 1 and 100',
        },
        { status: 400 }
      )
    }

    const results = await searchBlogs(query.trim(), limitNum)

    return Response.json({
      success: true,
      query,
      count: results.length,
      data: results,
    })
  } catch (error) {
    console.error('Error in GET /api/blogs/search:', error)
    return Response.json(
      {
        error: 'Failed to search blogs',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

