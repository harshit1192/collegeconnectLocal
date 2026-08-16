import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import EventCard from '../components/EventCard';
import { getEvents, EVENT_CATEGORIES } from '../services/eventService';

export default function Events() {
  const [when, setWhen] = useState('upcoming');
  const [category, setCategory] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEvents({ when, category: category || undefined })
      .then((data) => setEvents(data.events))
      .finally(() => setLoading(false));
  }, [when, category]);

  const tabClass = (active) =>
    `px-4 py-1.5 text-sm font-medium rounded-lg ${active ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Events</h1>
        <Link
          to="/events/create"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Create Event
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setWhen('upcoming')} className={tabClass(when === 'upcoming')}>
          Upcoming
        </button>
        <button onClick={() => setWhen('past')} className={tabClass(when === 'past')}>
          Past
        </button>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No {when} events found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {events.map((e) => (
            <EventCard key={e._id} event={e} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
