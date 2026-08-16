import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminReports,
  updateReportStatus,
  adminDeletePost,
  adminDeleteComment,
  adminDeleteResource,
} from '../../services/adminService';

const STATUS_TABS = ['pending', 'reviewed', 'resolved', 'dismissed'];

const DELETE_HANDLERS = {
  Post: adminDeletePost,
  Comment: adminDeleteComment,
  Resource: adminDeleteResource,
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminReports() {
  const [status, setStatus] = useState('pending');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAdminReports(status)
      .then(setReports)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateReportStatus(id, newStatus);
      toast.success(`Report marked as ${newStatus}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update report');
    }
  };

  const handleRemoveContent = async (report) => {
    const handler = DELETE_HANDLERS[report.targetType];
    if (!handler) {
      toast.error(`Removing a ${report.targetType} isn't supported here yet`);
      return;
    }
    if (!window.confirm(`Remove this reported ${report.targetType.toLowerCase()}?`)) return;
    try {
      await handler(report.targetId);
      await updateReportStatus(report._id, 'resolved');
      toast.success('Content removed and report resolved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove content');
    }
  };

  const tabClass = (t) =>
    `px-3 py-1.5 text-sm font-medium rounded-lg capitalize ${
      status === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'
    }`;

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Reports &amp; Moderation</h1>

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button key={t} onClick={() => setStatus(t)} className={tabClass(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400 text-sm">No {status} reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.targetType} reported for: <span className="text-red-600">{r.reason}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Reported by {r.reporter?.fullName} • {timeAgo(r.createdAt)}
                  </p>
                  {r.description && <p className="text-sm text-gray-600 mt-2">{r.description}</p>}
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize shrink-0">
                  {r.status}
                </span>
              </div>

              <div className="flex gap-3 mt-3 text-xs">
                {r.status !== 'resolved' && DELETE_HANDLERS[r.targetType] && (
                  <button onClick={() => handleRemoveContent(r)} className="text-red-600 hover:underline font-medium">
                    Remove content
                  </button>
                )}
                {r.status !== 'reviewed' && (
                  <button onClick={() => handleStatusChange(r._id, 'reviewed')} className="text-brand-600 hover:underline">
                    Mark reviewed
                  </button>
                )}
                {r.status !== 'dismissed' && (
                  <button onClick={() => handleStatusChange(r._id, 'dismissed')} className="text-gray-500 hover:underline">
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
