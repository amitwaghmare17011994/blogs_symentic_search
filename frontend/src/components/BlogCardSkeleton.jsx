/**
 * Skeleton loader component for blog cards
 */
export default function BlogCardSkeleton({ isTopMatch = false }) {
  return (
    <div
      className={`rounded-lg shadow-sm ${
        isTopMatch
          ? 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 p-6'
          : 'bg-white border border-gray-200 p-5'
      }`}
    >
      {isTopMatch && (
        <div className="mb-3 flex items-center gap-2">
          <div className="h-6 w-24 bg-purple-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-yellow-200 rounded-full animate-pulse"></div>
        </div>
      )}
      
      <div className={`flex justify-between items-start ${isTopMatch ? 'mb-4' : 'mb-3'}`}>
        <div className="flex-1">
          <div className={`h-6 bg-gray-300 rounded animate-pulse mb-2 ${
            isTopMatch ? 'w-3/4' : 'w-full'
          }`}></div>
          <div className={`h-4 bg-gray-200 rounded animate-pulse ${
            isTopMatch ? 'w-1/2' : 'w-2/3'
          }`}></div>
        </div>
        {!isTopMatch && (
          <div className="h-6 w-20 bg-blue-200 rounded-full animate-pulse ml-4"></div>
        )}
      </div>
      
      {/* Matched chunk skeleton (for search results) */}
      {isTopMatch && (
        <div className="mb-3 p-3 rounded-md border-l-4 bg-purple-50 border-purple-400">
          <div className="h-3 w-32 bg-purple-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-purple-100 rounded animate-pulse mb-1"></div>
          <div className="h-4 bg-purple-100 rounded animate-pulse w-5/6"></div>
        </div>
      )}
      
      {/* Content skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        {isTopMatch && (
          <>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
          </>
        )}
      </div>
      
      {/* Show more button skeleton */}
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3"></div>
      
      {/* Date skeleton */}
      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}

/**
 * Multiple skeleton loaders
 */
export function BlogCardSkeletons({ count = 3, isTopMatch = false }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <BlogCardSkeleton 
          key={index} 
          isTopMatch={index === 0 && isTopMatch}
        />
      ))}
    </>
  );
}




