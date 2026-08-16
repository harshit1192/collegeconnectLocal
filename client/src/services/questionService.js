import api from './api';

export const SUBJECTS = [
  'Data Structures',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Java',
  'JavaScript',
  'React',
  'Mathematics',
  'AI/ML',
  'Other',
];

export const getQuestions = (params) => api.get('/questions', { params }).then((r) => r.data);

export const getQuestion = (id) => api.get(`/questions/${id}`).then((r) => r.data);

export const createQuestion = (data) => api.post('/questions', data).then((r) => r.data.question);

export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data).then((r) => r.data.question);

export const deleteQuestion = (id) => api.delete(`/questions/${id}`).then((r) => r.data);

export const voteQuestion = (id, direction) =>
  api.post(`/questions/${id}/vote`, { direction }).then((r) => r.data);

export const addAnswer = (questionId, content) =>
  api.post(`/questions/${questionId}/answers`, { content }).then((r) => r.data.answer);

export const updateAnswer = (questionId, answerId, content) =>
  api.put(`/questions/${questionId}/answers/${answerId}`, { content }).then((r) => r.data.answer);

export const deleteAnswer = (questionId, answerId) =>
  api.delete(`/questions/${questionId}/answers/${answerId}`).then((r) => r.data);

export const voteAnswer = (questionId, answerId, direction) =>
  api.post(`/questions/${questionId}/answers/${answerId}/vote`, { direction }).then((r) => r.data);

export const acceptAnswer = (questionId, answerId) =>
  api.post(`/questions/${questionId}/answers/${answerId}/accept`).then((r) => r.data);

export const addAnswerComment = (questionId, answerId, content) =>
  api
    .post(`/questions/${questionId}/answers/${answerId}/comments`, { content })
    .then((r) => r.data.comments);
