import { Link } from 'react-router-dom';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventCard({ event }) {
  const imgSrc = event.image
    ? event.image
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=3b6ff2&color=fff&size=256`;

  return (
    <Link to={`/events/${event._id}`} className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
      <img src={imgSrc} alt={event.title} className="w-full h-32 object-cover" />
      <div className="p-4">
        <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {event.category}
        </span>
        <h3 className="font-semibold text-gray-900 mt-2 truncate">{event.title}</h3>
        <p className="text-xs text-gray-500 mt-1">{formatDate(event.date)}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">📍 {event.venue}</p>
        <p className="text-xs text-gray-400 mt-2">{event.registeredStudents?.length || 0} registered</p>
      </div>
    </Link>
  );
}
