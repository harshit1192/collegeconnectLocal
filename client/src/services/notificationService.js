import api from './api';

export const getNotifications = (page = 1, limit = 20) =>
  api.get('/notifications', { params: { page, limit } }).then((r) => r.data);

export const markAsRead = (id) => api.put(`/notifications/${id}/read`).then((r) => r.data);

export const markAllAsRead = () => api.put('/notifications/read-all').then((r) => r.data);
