import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
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

export default function NotificationBell() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Live updates: new notification arrives while online.
  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
      toast(notification.message, { icon: TYPE_ICONS[notification.type] || '🔔' });
    };
    socket.on('new-notification', handler);
    return () => socket.off('new-notification', handler);
  }, [socket]);

  // Close dropdown on outside click.
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) load();
  };

  const handleClickNotification = async (n) => {
    if (!n.read) {
      try {
        await markAsRead(n._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      } catch {
        // non-critical; ignore
      }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // non-critical; ignore
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative text-gray-600 hover:text-brand-600">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-20 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 p-4">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-gray-400 p-4">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left flex gap-2 p-3 hover:bg-gray-50 ${!n.read ? 'bg-brand-50/50' : ''}`}
                >
                  <span className="text-lg shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-brand-600 rounded-full shrink-0 mt-1.5" />}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="w-full text-center text-xs text-brand-600 hover:underline p-2 border-t border-gray-100"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
