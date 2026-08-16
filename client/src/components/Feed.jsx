import { useEffect, useState } from 'react';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import { getPosts } from '../services/postService';
import { getCommunityPosts } from '../services/communityService';

// Renders the main platform feed by default, or a single community's feed
// when `communityId` is provided (used by CommunityDetail).
export default function Feed({ communityId = null }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = (pageNum) =>
    communityId ? getCommunityPosts(communityId, pageNum, 10) : getPosts(pageNum, 10);

  const load = async (pageNum) => {
    const data = await fetchPage(pageNum);
    setPosts((prev) => (pageNum === 1 ? data.posts : [...prev, ...data.posts]));
    setHasMore(data.pagination.hasMore);
    setPage(pageNum);
  };

  useEffect(() => {
    setLoading(true);
    load(1).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await load(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreated = (post) => setPosts((prev) => [post, ...prev]);
  const handleDeleted = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <div>
      <CreatePost onCreated={handleCreated} communityId={communityId} />

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Loading feed...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No posts yet.</p>
          <p className="text-gray-400 text-sm">Be the first to share something with your college.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more posts'}
          </button>
        </div>
      )}
    </div>
  );
}
