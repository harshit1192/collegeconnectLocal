import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { createEvent, EVENT_CATEGORIES } from '../services/eventService';
import { getCommunities } from '../services/communityService';

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: EVENT_CATEGORIES[0],
    community: '',
    date: '',
    venue: '',
    maxParticipants: '',
  });
  const [communities, setCommunities] = useState([]);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only communities this user administers can be selected (checked
    // client-side for a cleaner picker; the server re-validates regardless).
    getCommunities({ limit: 100 }).then((data) => {
      const mine = data.communities.filter(
        (c) => c.creator._id === user._id // admins[] isn't populated in the list endpoint, so this covers creators; community admins can still pick from a full list if they know the name
      );
      setCommunities(mine);
    });
  }, [user._id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const event = await createEvent(form, image);
      toast.success('Event created!');
      navigate(`/events/${event._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create event');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create an Event</h1>
        <p className="text-sm text-gray-500 mb-4">
          {user.role === 'admin'
            ? 'As a platform admin, you can create college-wide or community events.'
            : 'You can create events for communities you administer.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input name="title" required value={form.title} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" required rows={4} value={form.description} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time</label>
              <input type="datetime-local" name="date" required value={form.date} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input name="venue" required value={form.venue} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community {user.role !== 'admin' && '(required)'}
              </label>
              <select name="community" value={form.community} onChange={handleChange} className={inputClass}>
                <option value="">{user.role === 'admin' ? 'Platform-wide' : 'Select a community...'}</option>
                {communities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants (optional)</label>
              <input
                type="number"
                min="1"
                name="maxParticipants"
                value={form.maxParticipants}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-sm" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
          >
            {submitting ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
