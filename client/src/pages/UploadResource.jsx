import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { uploadResource, RESOURCE_TYPES } from '../services/resourceService';

export default function UploadResource() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: RESOURCE_TYPES[0],
    subject: '',
    branch: user?.branch || '',
    semester: '1',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please attach a file');
      return;
    }
    setSubmitting(true);
    try {
      await uploadResource(form, file);
      toast.success('Resource uploaded!');
      navigate('/resources');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Upload a Resource</h1>
        <p className="text-sm text-gray-500 mb-4">
          PDF, Word, PowerPoint, Excel, TXT, or images. Max 15MB.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input name="title" required value={form.title} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea name="description" rows={2} value={form.description} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="resourceType" value={form.resourceType} onChange={handleChange} className={inputClass}>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select name="semester" value={form.semester} onChange={handleChange} className={inputClass}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input name="subject" required value={form.subject} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input name="branch" required value={form.branch} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
          >
            {submitting ? 'Uploading...' : 'Upload Resource'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
