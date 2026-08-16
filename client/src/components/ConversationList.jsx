import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ConversationList({ conversations, activeId, isOnline }) {
  if (conversations.length === 0) {
    return <p className="text-sm text-gray-400 p-4">No conversations yet. Message a student from their profile.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const avatarSrc = conv.otherUser?.profilePicture
          ? conv.otherUser.profilePicture
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUser?.fullName || '?')}&background=3b6ff2&color=fff`;

        const online = isOnline?.(conv.otherUser?._id);

        return (
          <Link
            key={conv._id}
            to={`/messages/${conv._id}`}
            className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${activeId === conv._id ? 'bg-brand-50' : ''}`}
          >
            <div className="relative shrink-0">
              <img src={avatarSrc} alt={conv.otherUser?.fullName} className="w-10 h-10 rounded-full object-cover border" />
              {online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">{conv.otherUser?.fullName}</p>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(conv.lastMessage?.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                {conv.unreadCount > 0 && (
                  <span className="bg-brand-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
