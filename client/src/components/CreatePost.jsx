import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/postService';

export default function CreatePost({ onCreated, communityId = null, placeholder }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const avatarSrc = user?.profilePicture
    ? user.profilePicture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=3b6ff2&color=fff`;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 4);
    setFiles(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const post = await createPost(content.trim(), files, communityId);
      toast.success('Posted!');
      setContent('');
      setFiles([]);
      onCreated?.(post);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 mb-6">
      <div className="flex gap-3">
        <img src={avatarSrc} alt={user?.fullName} className="w-10 h-10 rounded-full object-cover border" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={3000}
          placeholder={placeholder || 'Share something useful with your college...'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="text-xs text-gray-500"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {files.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">{files.length} image(s) selected</p>
      )}
    </form>
  );
}
