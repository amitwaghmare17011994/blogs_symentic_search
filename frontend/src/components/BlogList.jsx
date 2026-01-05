import { useEffect, useState } from 'react';
import { getAllBlogs } from '../services/api';
import { BlogCardSkeletons } from './BlogCardSkeleton';

/**
 * BlogList component to display all blogs
 */
export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBlogs, setExpandedBlogs] = useState(new Set());

  // Load all blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAllBlogs();
        setBlogs(response.data || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError(err.message || 'Failed to load blogs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  /**
   * Get content preview (first 150 characters)
   */
  const getPreview = (content) => {
    if (!content) return '';
    if (content.length <= 150) {
      return content;
    }
    return content.substring(0, 150) + '...';
  };

  /**
   * Toggle expand/collapse state for a blog
   */
  const toggleExpand = (blogId) => {
    setExpandedBlogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blogId)) {
        newSet.delete(blogId);
      } else {
        newSet.add(blogId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            All Blogs
          </h2>
        </div>
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          <BlogCardSkeletons count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No blogs found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          All Blogs
        </h2>
        
      </div>

      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {blogs.map((blog) => {
          const isExpanded = expandedBlogs.has(blog.id);
          const showPreview = blog.content && blog.content.length > 150;
          
          return (
            <div
              key={blog.id}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {blog.title}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {isExpanded || !showPreview ? blog.content : getPreview(blog.content)}
              </p>
              {showPreview && (
                <button
                  onClick={() => toggleExpand(blog.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-3 transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
              <div className="text-xs text-gray-500">
                <time dateTime={blog.created_at}>
                  {new Date(blog.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

