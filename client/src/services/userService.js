import api from './api';

export const getUserProfile = (id) => api.get(`/users/${id}`).then((r) => r.data.user);

export const updateProfile = (data) => api.put('/users/profile', data).then((r) => r.data.user);

export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  return api
    .post('/users/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.profilePicture);
};

export const searchUsers = (params) => api.get('/users', { params }).then((r) => r.data);

export const followUser = (id) => api.post(`/users/${id}/follow`).then((r) => r.data);

export const unfollowUser = (id) => api.post(`/users/${id}/unfollow`).then((r) => r.data);

export const reportUser = (id, reason, description) =>
  api.post(`/users/${id}/report`, { reason, description }).then((r) => r.data);
