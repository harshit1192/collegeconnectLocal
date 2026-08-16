import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import CommunityCard from '../components/CommunityCard';
import { getCommunities, CATEGORIES } from '../services/communityService';

export default function Communities() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      getCommunities({ search: search || undefined, category: category || undefined })
        .then((data) => setCommunities(data.communities))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, category]);

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Clubs &amp; Communities</h1>
        <Link
          to="/communities/create"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Create Community
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities..."
          className={`${selectClass} flex-1 min-w-[200px]`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading communities...</p>
      ) : communities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No communities found.</p>
          <p className="text-gray-400 text-sm">Start one for your college!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities.map((c) => (
            <CommunityCard key={c._id} community={c} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
