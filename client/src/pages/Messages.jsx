import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import { getConversations } from '../services/messageService';

export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOnline, socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the conversation list (for last-message previews / ordering)
  // whenever a new message comes in anywhere.
  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('receive-message', handler);
    return () => socket.off('receive-message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const activeConversation = conversations.find((c) => c._id === id);

  return (
    <MainLayout>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: '70vh' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 h-full">
          <div className={`border-r border-gray-100 overflow-y-auto ${id ? 'hidden sm:block' : ''}`}>
            {loading ? (
              <p className="text-sm text-gray-400 p-4">Loading conversations...</p>
            ) : (
              <ConversationList conversations={conversations} activeId={id} isOnline={isOnline} />
            )}
          </div>

          <div className="sm:col-span-2 h-full">
            {activeConversation ? (
              <ChatWindow conversation={activeConversation} key={activeConversation._id} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                {id ? 'Loading conversation...' : 'Select a conversation to start chatting'}
              </div>
            )}
          </div>
        </div>
      </div>
      {id && (
        <button onClick={() => navigate('/messages')} className="sm:hidden text-sm text-brand-600 mt-3 hover:underline">
          ← Back to conversations
        </button>
      )}
    </MainLayout>
  );
}
