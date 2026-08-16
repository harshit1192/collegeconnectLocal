import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import { updatePost, deletePost, reportPost } from '../services/postService';

const REPORT_REASONS = [
  'Spam',
  'Harassment or bullying',
  'Hate speech',
  'Inappropriate content',
  'Misinformation',
  'Academic dishonesty',
  'Other',
];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [current, setCurrent] = useState(post);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const isAuthor = current.author._id === user?._id;
  const isLiked = current.likes?.some((id) => id === user?._id || id?._id === user?._id);

  const avatarSrc = current.author.profilePicture
    ? current.author.profilePicture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(current.author.fullName)}&background=3b6ff2&color=fff`;

  const handleSaveEdit = async () => {
    if (!content.trim()) return;
    try {
      const updated = await updatePost(current._id, content.trim());
      setCurrent(updated);
      setEditing(false);
      toast.success('Post updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(current._id);
      toast.success('Post deleted');
      onDeleted?.(current._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    try {
      const res = await reportPost(current._id, reportReason);
      toast.success(res.message);
      setShowReport(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report failed');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start justify-between">
        <Link to={`/profile/${current.author._id}`} className="flex items-center gap-3">
          <img src={avatarSrc} alt={current.author.fullName} className="w-10 h-10 rounded-full object-cover border" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{current.author.fullName}</p>
            <p className="text-xs text-gray-400">
              {current.author.branch} • {timeAgo(current.createdAt)}
              {current.isEdited && ' • edited'}
            </p>
          </div>
        </Link>

        <div className="relative">
          {isAuthor ? (
            <div className="flex gap-3 text-xs">
              <button onClick={() => setEditing((e) => !e)} className="text-gray-400 hover:text-brand-600">
                Edit
              </button>
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500">
                Delete
              </button>
            </div>
          ) : (
            <button onClick={() => setShowReport((s) => !s)} className="text-xs text-gray-400 hover:text-red-500">
              Report
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={3000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveEdit} className="text-sm font-medium text-brand-600 hover:underline">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-sm text-gray-400 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-800 mt-3 whitespace-pre-wrap">{current.content}</p>
      )}

      {current.images?.length > 0 && (
        <div className={`mt-3 grid gap-2 ${current.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {current.images.map((src) => (
            <img key={src} src={src} alt="Post attachment" className="rounded-lg w-full object-cover max-h-80" />
          ))}
        </div>
      )}

      {showReport && (
        <div className="mt-3 bg-red-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-red-700 mb-2">Report this post</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm mb-2"
          >
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={handleReport}
            disabled={!reportReason}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-40"
          >
            Submit report
          </button>
        </div>
      )}

      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
        <LikeButton postId={current._id} initiallyLiked={isLiked} initialCount={current.likes?.length || 0} />
        <button
          onClick={() => setShowComments((s) => !s)}
          className="text-sm font-medium text-gray-500 hover:text-brand-600"
        >
          💬 {current.comments?.length || 0} Comments
        </button>
      </div>

      {showComments && <CommentSection postId={current._id} postAuthorId={current.author._id} />}
    </div>
  );
}
