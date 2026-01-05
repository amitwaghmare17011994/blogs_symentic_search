import { createBlog, getAllBlogs } from '../lib/services/blogService'

/**
 * GET /api/blogs
 * Get all blogs
 */
export async function GET() {
  try {
    const blogs = await getAllBlogs()

    return Response.json({
      success: true,
      count: blogs.length,
      data: blogs,
    })
  } catch (error) {
    console.error('Error in GET /api/blogs:', error)
    return Response.json(
      {
        error: 'Failed to fetch blogs',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/blogs
 * Create a new blog post
 * Body: { title: string, content: string }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return Response.json(
        {
          error: 'Title and content are required',
        },
        { status: 400 }
      )
    }

    const blog = await createBlog(title, content)

    return Response.json(
      {
        success: true,
        data: blog,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/blogs:', error)
    return Response.json(
      {
        error: 'Failed to create blog',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

