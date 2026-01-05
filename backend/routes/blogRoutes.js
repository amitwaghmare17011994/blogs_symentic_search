import { createBlog, getAllBlogs, searchBlogs } from '../services/blogService.js';

import express from 'express';

const router = express.Router();

/**
 * POST /blogs
 * Create a new blog post
 * Body: { title: string, content: string }
 */
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required',
      });
    }

    const blog = await createBlog(title, content);

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Error in POST /blogs:', error);
    res.status(500).json({
      error: 'Failed to create blog',
      message: error.message,
    });
  }
});

/**
 * GET /search?q=query&limit=10
 * Search blogs using semantic similarity
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Limit must be a number between 1 and 100',
      });
    }

    const results = await searchBlogs(query.trim(), limitNum);

    res.json({
      success: true,
      query,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error in GET /search:', error);
    res.status(500).json({
      error: 'Failed to search blogs',
      message: error.message,
    });
  }
});

/**
 * GET /blogs
 * Get all blogs
 */
router.get('/', async (req, res) => {
  try {
    const blogs = await getAllBlogs();

    res.json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error('Error in GET /blogs:', error);
    res.status(500).json({
      error: 'Failed to fetch blogs',
      message: error.message,
    });
  }
});

export default router;

