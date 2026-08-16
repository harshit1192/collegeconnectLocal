import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getPost, addComment, deleteComment, reportComment } from '../services/postService';

export default function CommentSection({ postId, postAuthorId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getPost(postId)
      .then((data) => setComments(data.comments))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await addComment(postId, text.trim());
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete comment');
    }
  };

  const handleReport = async (commentId) => {
    const reason = window.prompt(
      'Reason for reporting this comment (Spam, Harassment or bullying, Hate speech, Inappropriate content, Misinformation, Academic dishonesty, Other):'
    );
    if (!reason) return;
    try {
      const res = await reportComment(postId, commentId, reason);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not report comment');
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {loading ? (
        <p className="text-xs text-gray-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">No comments yet. Be the first to reply.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {comments.map((c) => {
            const canDelete = c.author._id === user?._id || postAuthorId === user?._id || user?.role === 'admin';
            return (
              <div key={c._id} className="flex items-start justify-between gap-2 text-sm">
                <p>
                  <span className="font-medium text-gray-800">{c.author.fullName}</span>{' '}
                  <span className="text-gray-600">{c.content}</span>
                </p>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                  >
                    Delete
                  </button>
                )}
                {!canDelete && (
                  <button
                    onClick={() => handleReport(c._id)}
                    className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                  >
                    Report
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  );
}
