import api from './api';

export const getAnnouncements = (communityId) =>
  api.get('/announcements', { params: communityId ? { community: communityId } : {} }).then((r) => r.data.announcements);

export const createAnnouncement = (data) => api.post('/announcements', data).then((r) => r.data.announcement);

export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`).then((r) => r.data);
