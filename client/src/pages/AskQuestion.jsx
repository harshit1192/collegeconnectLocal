import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import { createQuestion, SUBJECTS } from '../services/questionService';

export default function AskQuestion() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: SUBJECTS[0],
    year: 'Any Year',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const question = await createQuestion(form);
      toast.success('Question posted!');
      navigate(`/academic/${question._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post question');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Ask a Question</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              name="title"
              required
              maxLength={200}
              value={form.title}
              onChange={handleChange}
              placeholder="Be specific — e.g. 'How does B-Tree indexing work in DBMS?'"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              required
              rows={6}
              maxLength={5000}
              value={form.description}
              onChange={handleChange}
              placeholder="Explain your question in detail — what have you tried, what's confusing?"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select name="year" value={form.year} onChange={handleChange} className={inputClass}>
                <option>Any Year</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="indexing, sql, exam-prep"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
