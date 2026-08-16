import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import QuestionCard from '../components/QuestionCard';
import { getQuestions, SUBJECTS } from '../services/questionService';

export default function Academic() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      getQuestions({ search: search || undefined, subject: subject || undefined, year: year || undefined })
        .then((data) => setQuestions(data.questions))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, subject, year]);

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Academic Q&amp;A</h1>
        <Link
          to="/academic/ask"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Ask a Question
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className={`${selectClass} flex-1 min-w-[200px]`}
        />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectClass}>
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
          <option value="">All Years</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading questions...</p>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No questions found.</p>
          <p className="text-gray-400 text-sm">Be the first student to ask a question.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q._id} question={q} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
