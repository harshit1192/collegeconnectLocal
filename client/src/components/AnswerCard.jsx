import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import VoteButtons from './VoteButtons';
import {
  voteAnswer,
  acceptAnswer,
  deleteAnswer,
  updateAnswer,
  addAnswerComment,
} from '../services/questionService';

export default function AnswerCard({ answer, questionId, isQuestionAuthor, onChanged }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState(answer);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(answer.content);
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const isUpvoted = current.upvotes?.some((id) => id === user?._id || id?._id === user?._id);
  const isDownvoted = current.downvotes?.some((id) => id === user?._id || id?._id === user?._id);
  const userVote = isUpvoted ? 'up' : isDownvoted ? 'down' : null;

  const handleVote = async (direction) => {
    try {
      const res = await voteAnswer(questionId, current._id, direction);
      setCurrent((prev) => ({
        ...prev,
        upvotes: new Array(res.upvotes).fill(null),
        downvotes: new Array(res.downvotes).fill(null),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed');
    }
  };

  const handleAccept = async () => {
    try {
      await acceptAnswer(questionId, current._id);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update accepted answer');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this answer?')) return;
    try {
      await deleteAnswer(questionId, current._id);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSaveEdit = async () => {
    if (!content.trim()) return;
    try {
      const updated = await updateAnswer(questionId, current._id, content.trim());
      setCurrent(updated);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const comments = await addAnswerComment(questionId, current._id, commentText.trim());
      setCurrent((prev) => ({ ...prev, comments }));
      setCommentText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add comment');
    }
  };

  const isAuthor = current.author._id === user?._id;

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 flex gap-4 ${current.isAccepted ? 'ring-2 ring-green-400' : ''}`}>
      <VoteButtons
        upvotes={current.upvotes?.length}
        downvotes={current.downvotes?.length}
        userVote={userVote}
        onVote={handleVote}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{current.author.fullName}</span>
            {current.isAccepted && <span className="ml-2 text-green-600 text-xs font-semibold">✓ Accepted Answer</span>}
          </p>
          <div className="flex gap-3 text-xs">
            {isQuestionAuthor && (
              <button onClick={handleAccept} className="text-gray-400 hover:text-green-600">
                {current.isAccepted ? 'Unaccept' : 'Accept'}
              </button>
            )}
            {isAuthor && (
              <button onClick={() => setEditing((e) => !e)} className="text-gray-400 hover:text-brand-600">
                Edit
              </button>
            )}
            {(isAuthor || user?.role === 'admin') && (
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500">
                Delete
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mt-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
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
          <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{current.content}</p>
        )}

        {current.comments?.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
            {current.comments.map((c) => (
              <p key={c._id} className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">{c.author.fullName}:</span> {c.content}
              </p>
            ))}
          </div>
        )}

        {showCommentBox ? (
          <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
              Add
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowCommentBox(true)}
            className="text-xs text-gray-400 hover:text-brand-600 mt-2"
          >
            Comment
          </button>
        )}
      </div>
    </div>
  );
}
