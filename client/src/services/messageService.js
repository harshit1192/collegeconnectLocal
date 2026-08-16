import api from './api';

export const getConversations = () => api.get('/conversations').then((r) => r.data.conversations);

export const getOrCreateConversation = (recipientId) =>
  api.post('/conversations', { recipientId }).then((r) => r.data.conversation);

export const getMessages = (conversationId, page = 1, limit = 30) =>
  api.get(`/conversations/${conversationId}/messages`, { params: { page, limit } }).then((r) => r.data);

export const sendMessage = (conversationId, content) =>
  api.post(`/conversations/${conversationId}/messages`, { content }).then((r) => r.data.message);
