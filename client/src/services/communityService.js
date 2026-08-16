import api from './api';

export const CATEGORIES = [
  'Coding',
  'Cultural',
  'Sports',
  'Robotics',
  'Photography',
  'AI/ML',
  'Literary',
  'Other',
];

export const getCommunities = (params) => api.get('/communities', { params }).then((r) => r.data);

export const getCommunity = (id) => api.get(`/communities/${id}`).then((r) => r.data.community);

export const createCommunity = (data) => api.post('/communities', data).then((r) => r.data.community);

export const updateCommunity = (id, data) => api.put(`/communities/${id}`, data).then((r) => r.data.community);

export const deleteCommunity = (id) => api.delete(`/communities/${id}`).then((r) => r.data);

export const joinCommunity = (id) => api.post(`/communities/${id}/join`).then((r) => r.data);

export const leaveCommunity = (id) => api.post(`/communities/${id}/leave`).then((r) => r.data);

export const removeMember = (id, userId) =>
  api.delete(`/communities/${id}/members/${userId}`).then((r) => r.data);

export const addCommunityAdmin = (id, userId) =>
  api.post(`/communities/${id}/admins/${userId}`).then((r) => r.data);

export const getCommunityPosts = (id, page = 1, limit = 10) =>
  api.get(`/communities/${id}/posts`, { params: { page, limit } }).then((r) => r.data);
