import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, deleteAnnouncement } from '../services/announcementService';

export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete announcement');
    }
  };

  if (announcements.length === 0) return null;

  const visible = expanded ? announcements : announcements.slice(0, 1);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">📢 Announcements</p>
        {announcements.length > 1 && (
          <button onClick={() => setExpanded((e) => !e)} className="text-xs text-amber-600 hover:underline">
            {expanded ? 'Show less' : `Show all (${announcements.length})`}
          </button>
        )}
      </div>

      {visible.map((a) => (
        <div key={a._id} className="mt-2 first:mt-0">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-900">{a.title}</p>
            {(a.author._id === user?._id || user?.role === 'admin') && (
              <button onClick={() => handleDelete(a._id)} className="text-xs text-gray-400 hover:text-red-500">
                Dismiss
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">{a.content}</p>
        </div>
      ))}
    </div>
  );
}
