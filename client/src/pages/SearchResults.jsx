import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { globalSearch } from '../services/searchService';

const SECTIONS = [
  { key: 'students', label: 'Students', linkFn: (i) => `/profile/${i._id}`, textFn: (i) => i.fullName, subFn: (i) => `${i.branch} • ${i.year}` },
  { key: 'posts', label: 'Posts', linkFn: () => `/`, textFn: (i) => i.content, subFn: (i) => `by ${i.author?.fullName}` },
  { key: 'questions', label: 'Questions', linkFn: (i) => `/academic/${i._id}`, textFn: (i) => i.title, subFn: (i) => i.subject },
  { key: 'resources', label: 'Resources', linkFn: () => `/resources`, textFn: (i) => i.title, subFn: (i) => i.subject },
  { key: 'communities', label: 'Communities', linkFn: (i) => `/communities/${i._id}`, textFn: (i) => i.name, subFn: (i) => i.category },
  { key: 'events', label: 'Events', linkFn: (i) => `/events/${i._id}`, textFn: (i) => i.title, subFn: (i) => i.venue },
];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    globalSearch(q)
      .then((data) => setResults(data.results))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <MainLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Search results for "{q}"</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Searching...</p>
      ) : !results || Object.values(results).every((arr) => arr.length === 0) ? (
        <p className="text-gray-400 text-sm">No results found.</p>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map(({ key, label, linkFn, textFn, subFn }) => {
            const items = results[key] || [];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">{label}</h2>
                <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
                  {items.map((item) => (
                    <Link key={item._id} to={linkFn(item)} className="block p-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-800 truncate">{textFn(item)}</p>
                      <p className="text-xs text-gray-400">{subFn(item)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
