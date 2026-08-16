import api from './api';

export const RESOURCE_TYPES = [
  'Notes',
  'Question Paper',
  'Assignment',
  'Study Material',
  'Lab File',
  'Reference Document',
];

export const getResources = (params) => api.get('/resources', { params }).then((r) => r.data);

export const getResource = (id) => api.get(`/resources/${id}`).then((r) => r.data.resource);

export const uploadResource = (formValues, file) => {
  const formData = new FormData();
  Object.entries(formValues).forEach(([key, value]) => formData.append(key, value));
  formData.append('file', file);
  return api
    .post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.resource);
};

// Triggers the browser's file download while also incrementing the
// server-side download counter.
export const downloadResource = async (id) => {
  const res = await api.get(`/resources/${id}/download`);
  const { fileUrl, fileName } = res.data;

  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const deleteResource = (id) => api.delete(`/resources/${id}`).then((r) => r.data);

export const reportResource = (id, reason, description) =>
  api.post(`/resources/${id}/report`, { reason, description }).then((r) => r.data);
