import api from './api';

export const getPosts = (page = 1, limit = 10) =>
  api.get('/posts', { params: { page, limit } }).then((r) => r.data);

export const getPost = (id) => api.get(`/posts/${id}`).then((r) => r.data);

export const createPost = (content, imageFiles = [], communityId = null) => {
  const formData = new FormData();
  formData.append('content', content);
  imageFiles.forEach((file) => formData.append('images', file));
  if (communityId) formData.append('community', communityId);
  return api
    .post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.post);
};

export const updatePost = (id, content) =>
  api.put(`/posts/${id}`, { content }).then((r) => r.data.post);

export const deletePost = (id) => api.delete(`/posts/${id}`).then((r) => r.data);

export const toggleLike = (id) => api.post(`/posts/${id}/like`).then((r) => r.data);

export const addComment = (id, content) =>
  api.post(`/posts/${id}/comments`, { content }).then((r) => r.data.comment);

export const deleteComment = (postId, commentId) =>
  api.delete(`/posts/${postId}/comments/${commentId}`).then((r) => r.data);

export const reportComment = (postId, commentId, reason, description) =>
  api.post(`/posts/${postId}/comments/${commentId}/report`, { reason, description }).then((r) => r.data);

export const reportPost = (id, reason, description) =>
  api.post(`/posts/${id}/report`, { reason, description }).then((r) => r.data);
