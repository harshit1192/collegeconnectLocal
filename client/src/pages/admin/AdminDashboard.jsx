import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getDashboardStats } from '../../services/adminService';

const STAT_LABELS = [
  { key: 'totalStudents', label: 'Total Students', icon: '🎓' },
  { key: 'activeStudents', label: 'Active Students', icon: '✅' },
  { key: 'totalPosts', label: 'Total Posts', icon: '📝' },
  { key: 'totalQuestions', label: 'Total Questions', icon: '❓' },
  { key: 'totalResources', label: 'Total Resources', icon: '📚' },
  { key: 'totalCommunities', label: 'Total Communities', icon: '👥' },
  { key: 'totalEvents', label: 'Total Events', icon: '🗓️' },
  { key: 'pendingReports', label: 'Pending Reports', icon: '🚩' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAT_LABELS.map(({ key, label, icon }) => (
            <div key={key} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-2xl">{icon}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats[key]}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
