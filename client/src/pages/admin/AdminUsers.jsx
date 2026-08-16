import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminUsers,
  verifyUserByAdmin,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
} from '../../services/adminService';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAdminUsers({ search: search || undefined, status: status || undefined })
      .then((data) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleAction = async (action, id, label) => {
    try {
      await action(id);
      toast.success(label);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user account?')) return;
    handleAction(deleteUserByAdmin, id, 'User deleted');
  };

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-4">User Management</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or roll no..."
          className={`${selectClass} flex-1 min-w-[220px]`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading users...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Roll No</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="p-3 text-gray-600">{u.rollNumber}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.isBlocked && (
                        <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                          Blocked
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.isVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {u.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap text-xs">
                      {!u.isVerified && (
                        <button
                          onClick={() => handleAction(verifyUserByAdmin, u._id, 'User verified')}
                          className="text-brand-600 hover:underline"
                        >
                          Verify
                        </button>
                      )}
                      {u.isBlocked ? (
                        <button
                          onClick={() => handleAction(unblockUser, u._id, 'User unblocked')}
                          className="text-green-600 hover:underline"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(blockUser, u._id, 'User blocked')}
                          className="text-amber-600 hover:underline"
                        >
                          Block
                        </button>
                      )}
                      <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
