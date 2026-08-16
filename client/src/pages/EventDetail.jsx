import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { getEvent, registerForEvent, unregisterFromEvent, deleteEvent } from '../services/eventService';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getEvent(id)
      .then(setEvent)
      .catch(() => toast.error('Could not load this event'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Loading event...</p>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Event not found.</p>
      </MainLayout>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const isRegistered = event.registeredStudents.some((s) => s._id === user?._id);
  const isFull = event.maxParticipants && event.registeredStudents.length >= event.maxParticipants;
  const isOrganizer = event.organizer._id === user?._id;

  const imgSrc = event.image
    ? event.image
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=3b6ff2&color=fff&size=512`;

  const handleRegister = async () => {
    setBusy(true);
    try {
      await registerForEvent(id);
      toast.success('You are registered!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleUnregister = async () => {
    setBusy(true);
    try {
      await unregisterFromEvent(id);
      toast.success('Registration cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not unregister');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <MainLayout>
      <Link to="/events" className="text-sm text-brand-600 hover:underline">
        ← Back to Events
      </Link>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-3">
        <img src={imgSrc} alt={event.title} className="w-full h-56 object-cover" />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {event.category}
              </span>
              <h1 className="text-xl font-bold text-gray-900 mt-2">{event.title}</h1>
              {event.community && (
                <Link to={`/communities/${event.community._id}`} className="text-xs text-brand-600 hover:underline">
                  Organized by {event.community.name}
                </Link>
              )}
            </div>
            {(isOrganizer || user?.role === 'admin') && (
              <button onClick={handleDelete} className="text-xs text-red-500 hover:underline shrink-0">
                Delete event
              </button>
            )}
          </div>

          <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{event.description}</p>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
            <p>🗓️ {formatDate(event.date)}</p>
            <p>📍 {event.venue}</p>
            <p>
              👥 {event.registeredStudents.length}
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} registered
            </p>
            <p>🎤 {event.organizer.fullName}</p>
          </div>

          {isPast ? (
            <p className="text-sm text-gray-400 mt-6">This event has already taken place.</p>
          ) : isRegistered ? (
            <button
              onClick={handleUnregister}
              disabled={busy}
              className="mt-6 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
            >
              Cancel Registration
            </button>
          ) : (
            <button
              onClick={handleRegister}
              disabled={busy || isFull}
              className="mt-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              {isFull ? 'Event Full' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
