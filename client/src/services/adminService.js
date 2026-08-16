import api from './api';

export const getDashboardStats = () => api.get('/admin/stats').then((r) => r.data.stats);

export const getAdminUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);

export const verifyUserByAdmin = (id) => api.put(`/admin/users/${id}/verify`).then((r) => r.data);

export const blockUser = (id) => api.put(`/admin/users/${id}/block`).then((r) => r.data);

export const unblockUser = (id) => api.put(`/admin/users/${id}/unblock`).then((r) => r.data);

export const deleteUserByAdmin = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

export const getAdminReports = (status) =>
  api.get('/admin/reports', { params: status ? { status } : {} }).then((r) => r.data.reports);

export const updateReportStatus = (id, status) =>
  api.put(`/admin/reports/${id}`, { status }).then((r) => r.data);

export const adminDeletePost = (id) => api.delete(`/admin/posts/${id}`).then((r) => r.data);

export const adminDeleteComment = (id) => api.delete(`/admin/comments/${id}`).then((r) => r.data);

export const adminDeleteResource = (id) => api.delete(`/admin/resources/${id}`).then((r) => r.data);
