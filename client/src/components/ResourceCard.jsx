import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { downloadResource, deleteResource, reportResource } from '../services/resourceService';

const REPORT_REASONS = [
  'Spam',
  'Inappropriate content',
  'Misinformation',
  'Academic dishonesty',
  'Other',
];

const FILE_ICONS = {
  'application/pdf': '📕',
  'application/msword': '📘',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
  'application/vnd.ms-powerpoint': '📙',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📙',
  'application/vnd.ms-excel': '📗',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
  'text/plain': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceCard({ resource, onDeleted }) {
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [downloads, setDownloads] = useState(resource.downloads);

  const isOwner = resource.uploader._id === user?._id;

  const handleDownload = async () => {
    try {
      await downloadResource(resource._id);
      setDownloads((d) => d + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await deleteResource(resource._id);
      toast.success('Resource deleted');
      onDeleted?.(resource._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    try {
      const res = await reportResource(resource._id, reportReason);
      toast.success(res.message);
      setShowReport(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report failed');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl">{FILE_ICONS[resource.fileType] || '📄'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{resource.title}</p>
            <p className="text-xs text-gray-400">
              {resource.subject} • Sem {resource.semester} • {resource.branch}
            </p>
          </div>
        </div>
        {isOwner ? (
          <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-red-500 shrink-0">
            Delete
          </button>
        ) : (
          <button onClick={() => setShowReport((s) => !s)} className="text-xs text-gray-400 hover:text-red-500 shrink-0">
            Report
          </button>
        )}
      </div>

      {resource.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{resource.description}</p>}

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-400">
          <span className="bg-brand-50 text-brand-700 font-medium px-2 py-0.5 rounded-full mr-2">
            {resource.resourceType}
          </span>
          {formatSize(resource.fileSize)} • {downloads} downloads
        </div>
        <button
          onClick={handleDownload}
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg px-3 py-1.5"
        >
          Download
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2">Uploaded by {resource.uploader.fullName}</p>

      {showReport && (
        <div className="mt-3 bg-red-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-red-700 mb-2">Report this resource</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm mb-2"
          >
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={handleReport}
            disabled={!reportReason}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-40"
          >
            Submit report
          </button>
        </div>
      )}
    </div>
  );
}
