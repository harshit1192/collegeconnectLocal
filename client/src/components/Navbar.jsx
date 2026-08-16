import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getConversations } from '../services/messageService';
import NotificationBell from './NotificationBell';
import GlobalSearchBar from './GlobalSearchBar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = () => {
    getConversations()
      .then((convs) => setUnreadCount(convs.reduce((sum, c) => sum + c.unreadCount, 0)))
      .catch(() => {});
  };

  useEffect(() => {
    refreshUnread();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive-message', refreshUnread);
    return () => socket.off('receive-message', refreshUnread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const avatarSrc = user?.profilePicture
    ? user.profilePicture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=3b6ff2&color=fff`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="font-bold text-brand-700 text-lg shrink-0">
          CollegeConnect
        </Link>

        <div className="hidden md:block flex-1 max-w-xs">
          <GlobalSearchBar />
        </div>

        <div className="flex items-center gap-4 text-sm overflow-x-auto whitespace-nowrap flex-1 justify-end">
          <Link to="/academic" className="text-gray-600 hover:text-brand-600 font-medium">
            Academic
          </Link>
          <Link to="/resources" className="text-gray-600 hover:text-brand-600 font-medium">
            Resources
          </Link>
          <Link to="/communities" className="text-gray-600 hover:text-brand-600 font-medium">
            Communities
          </Link>
          <Link to="/events" className="text-gray-600 hover:text-brand-600 font-medium">
            Events
          </Link>
          <Link to="/students" className="text-gray-600 hover:text-brand-600 font-medium">
            Students
          </Link>
          <Link to="/messages" className="relative text-gray-600 hover:text-brand-600 font-medium">
            Messages
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <NotificationBell />
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-amber-600 hover:text-amber-700 font-semibold">
              Admin
            </Link>
          )}
          <Link to={`/profile/${user?._id}`} className="flex items-center gap-2 shrink-0">
            <img
              src={avatarSrc}
              alt={user?.fullName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          </Link>
          <button onClick={handleLogout} className="text-red-600 hover:underline font-medium shrink-0">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
