import { useState } from 'react';
import { toggleLike } from '../services/postService';

export default function LikeButton({ postId, initiallyLiked, initialCount }) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);

    // Optimistic update for a snappy feel; roll back on failure.
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await toggleLike(postId);
      setLiked(res.liked);
      setCount(res.likesCount);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`flex items-center gap-1.5 text-sm font-medium transition ${
        liked ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'
      }`}
    >
      <span>{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  );
}
