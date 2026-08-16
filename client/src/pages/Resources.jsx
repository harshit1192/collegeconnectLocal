import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ResourceCard from '../components/ResourceCard';
import { getResources, RESOURCE_TYPES } from '../services/resourceService';

export default function Resources() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resources, setResources] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const filters = { search: search || undefined, subject: subject || undefined, semester: semester || undefined, resourceType: resourceType || undefined };

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      getResources({ ...filters, page: 1, limit: 12 })
        .then((data) => {
          setResources(data.resources);
          setHasMore(data.pagination.hasMore);
          setPage(1);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, subject, semester, resourceType]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const data = await getResources({ ...filters, page: nextPage, limit: 12 });
    setResources((prev) => [...prev, ...data.resources]);
    setHasMore(data.pagination.hasMore);
    setPage(nextPage);
  };

  const handleDeleted = (id) => setResources((prev) => prev.filter((r) => r._id !== id));

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Notes &amp; Study Resources</h1>
        <Link
          to="/resources/upload"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Upload Resource
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className={`${selectClass} flex-1 min-w-[200px]`}
        />
        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={selectClass} />
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectClass}>
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Sem {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading resources...</p>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No resources found.</p>
          <p className="text-gray-400 text-sm">Be the first to share your notes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map((r) => (
            <ResourceCard key={r._id} resource={r} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={handleLoadMore} className="text-sm font-medium text-brand-600 hover:underline">
            Load more resources
          </button>
        </div>
      )}
    </MainLayout>
  );
}
