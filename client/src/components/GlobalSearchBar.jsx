import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../services/searchService';

const CATEGORY_LABELS = {
  students: 'Students',
  posts: 'Posts',
  questions: 'Questions',
  resources: 'Resources',
  communities: 'Communities',
  events: 'Events',
};

const linkFor = (category, item) => {
  switch (category) {
    case 'students':
      return `/profile/${item._id}`;
    case 'posts':
      return `/`; // main feed doesn't have per-post pages yet; land on Home
    case 'questions':
      return `/academic/${item._id}`;
    case 'resources':
      return `/resources`;
    case 'communities':
      return `/communities/${item._id}`;
    case 'events':
      return `/events/${item._id}`;
    default:
      return '/';
  }
};

const labelFor = (category, item) => {
  switch (category) {
    case 'students':
      return item.fullName;
    case 'posts':
      return item.content;
    case 'questions':
      return item.title;
    case 'resources':
      return item.title;
    case 'communities':
      return item.name;
    case 'events':
      return item.title;
    default:
      return '';
  }
};

export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      globalSearch(query.trim()).then((data) => {
        setResults(data.results);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const hasAnyResults = results && Object.values(results).some((arr) => arr.length > 0);

  return (
    <div className="relative w-full max-w-xs" ref={ref}>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search CollegeConnect..."
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </form>

      {open && results && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-20 max-h-96 overflow-y-auto">
          {!hasAnyResults ? (
            <p className="text-xs text-gray-400 p-4">No results for "{query}"</p>
          ) : (
            Object.entries(results).map(([category, items]) =>
              items.length === 0 ? null : (
                <div key={category} className="p-2 border-b border-gray-50 last:border-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1">
                    {CATEGORY_LABELS[category]}
                  </p>
                  {items.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => {
                        setOpen(false);
                        navigate(linkFor(category, item));
                      }}
                      className="w-full text-left text-sm text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 truncate block"
                    >
                      {labelFor(category, item)}
                    </button>
                  ))}
                </div>
              )
            )
          )}
          <button
            onClick={handleSubmit}
            className="w-full text-center text-xs text-brand-600 hover:underline p-2 border-t border-gray-100"
          >
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
}
