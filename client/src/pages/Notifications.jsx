import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_ICONS = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  answer: '✍️',
  accepted_answer: '✅',
  message: '✉️',
  community_announcement: '📢',
  event_reminder: '🗓️',
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = (pageNum) => {
    getNotifications(pageNum).then((data) => {
      setNotifications((prev) => (pageNum === 1 ? data.notifications : [...prev, ...data.notifications]));
      setHasMore(data.pagination.hasMore);
      setUnreadCount(data.unreadCount);
      setPage(pageNum);
    });
  };

  useEffect(() => {
    setLoading(true);
    load(1);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = async (n) => {
    if (!n.read) {
      await markAsRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-brand-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No notifications yet.</p>
          <p className="text-gray-400 text-sm">Activity on your posts, questions, and messages will show up here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex gap-3 p-4 hover:bg-gray-50 ${!n.read ? 'bg-brand-50/40' : ''}`}
            >
              <span className="text-xl shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="w-2.5 h-2.5 bg-brand-600 rounded-full shrink-0 mt-1.5" />}
            </button>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={() => load(page + 1)} className="text-sm font-medium text-brand-600 hover:underline">
            Load more
          </button>
        </div>
      )}
    </MainLayout>
  );
}
