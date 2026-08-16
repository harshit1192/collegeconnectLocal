import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import StudentCard from '../components/StudentCard';
import { searchUsers } from '../services/userService';

export default function Students() {
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      searchUsers({ search: query || undefined, branch: branch || undefined, year: year || undefined })
        .then((data) => setStudents(data.users))
        .finally(() => setLoading(false));
    }, 300); // debounce typing

    return () => clearTimeout(timeout);
  }, [query, branch, year]);

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Find Students</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, roll no, or skill..."
          className={`${selectClass} flex-1 min-w-[200px]`}
        />
        <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch" className={selectClass} />
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
          <option value="">All Years</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-400 text-sm">No students found. Try a different search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map((s) => (
            <StudentCard key={s._id} student={s} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
