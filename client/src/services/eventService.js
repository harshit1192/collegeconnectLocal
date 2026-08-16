import api from './api';

export const EVENT_CATEGORIES = [
  'Workshop',
  'Seminar',
  'Competition',
  'Hackathon',
  'Club Event',
  'College Function',
  'Other',
];

export const getEvents = (params) => api.get('/events', { params }).then((r) => r.data);

export const getEvent = (id) => api.get(`/events/${id}`).then((r) => r.data.event);

export const createEvent = (formValues, imageFile) => {
  const formData = new FormData();
  Object.entries(formValues).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') formData.append(key, value);
  });
  if (imageFile) formData.append('image', imageFile);
  return api
    .post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.event);
};

export const updateEvent = (id, data) => api.put(`/events/${id}`, data).then((r) => r.data.event);

export const deleteEvent = (id) => api.delete(`/events/${id}`).then((r) => r.data);

export const registerForEvent = (id) => api.post(`/events/${id}/register`).then((r) => r.data);

export const unregisterFromEvent = (id) => api.post(`/events/${id}/unregister`).then((r) => r.data);
