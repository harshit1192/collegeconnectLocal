import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMessages, sendMessage } from '../services/messageService';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const bottomRef = useRef(null);

  const otherUser = conversation.otherUser;

  // Load message history whenever the conversation changes.
  useEffect(() => {
    setLoading(true);
    getMessages(conversation._id)
      .then((data) => setMessages(data.messages))
      .finally(() => setLoading(false));
  }, [conversation._id]);

  // Listen for real-time incoming messages and typing indicators.
  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({ conversationId, message }) => {
      if (conversationId === conversation._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = ({ conversationId }) => {
      if (conversationId === conversation._id) setOtherTyping(true);
    };

    const handleStopTyping = ({ conversationId }) => {
      if (conversationId === conversation._id) setOtherTyping(false);
    };

    socket.on('receive-message', handleReceive);
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);

    return () => {
      socket.off('receive-message', handleReceive);
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket, conversation._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const emitTyping = () => {
    if (!socket || !otherUser) return;
    socket.emit('typing', { conversationId: conversation._id, recipientId: otherUser._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId: conversation._id, recipientId: otherUser._id });
    }, 1500);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    try {
      const message = await sendMessage(conversation._id, content);
      setMessages((prev) => [...prev, message]);
    } catch {
      setText(content); // restore on failure so the user doesn't lose their draft
    }
  };

  const avatarSrc = otherUser?.profilePicture
    ? otherUser.profilePicture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.fullName || '?')}&background=3b6ff2&color=fff`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3">
          <div className="relative">
            <img src={avatarSrc} alt={otherUser?.fullName} className="w-9 h-9 rounded-full object-cover border" />
            {isOnline(otherUser?._id) && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{otherUser?.fullName}</p>
            <p className="text-xs text-gray-400">{isOnline(otherUser?._id) ? 'Online' : 'Offline'}</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400 text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center">Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender._id === user._id || m.sender === user._id;
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    isMine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-100' : 'text-gray-400'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {otherTyping && <p className="text-xs text-gray-400">{otherUser?.fullName} is typing...</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-gray-100">
        <input
          value={text}
          onChange={handleChange}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Send
        </button>
      </form>
    </div>
  );
}
