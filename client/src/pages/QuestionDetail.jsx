import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import VoteButtons from '../components/VoteButtons';
import AnswerCard from '../components/AnswerCard';
import { useAuth } from '../context/AuthContext';
import { getQuestion, voteQuestion, addAnswer } from '../services/questionService';

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getQuestion(id)
      .then((data) => {
        setQuestion(data.question);
        setAnswers(data.answers);
      })
      .catch(() => toast.error('Could not load this question'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isUpvoted = question?.upvotes?.some((uid) => uid === user?._id || uid?._id === user?._id);
  const isDownvoted = question?.downvotes?.some((uid) => uid === user?._id || uid?._id === user?._id);
  const userVote = isUpvoted ? 'up' : isDownvoted ? 'down' : null;

  const handleVote = async (direction) => {
    try {
      const res = await voteQuestion(id, direction);
      setQuestion((prev) => ({
        ...prev,
        upvotes: new Array(res.upvotes).fill(null),
        downvotes: new Array(res.downvotes).fill(null),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed');
    }
  };

  const handleAddAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      const answer = await addAnswer(id, answerText.trim());
      setAnswers((prev) => [...prev, answer]);
      setQuestion((prev) => ({ ...prev, answers: [...(prev.answers || []), answer._id] }));
      setAnswerText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Loading question...</p>
      </MainLayout>
    );
  }

  if (!question) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Question not found.</p>
      </MainLayout>
    );
  }

  const isQuestionAuthor = question.author._id === user?._id;

  return (
    <MainLayout>
      <Link to="/academic" className="text-sm text-brand-600 hover:underline">
        ← Back to Academic Q&amp;A
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-3 flex gap-4">
        <VoteButtons
          upvotes={question.upvotes?.length}
          downvotes={question.downvotes?.length}
          userVote={userVote}
          onVote={handleVote}
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{question.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {question.subject}
            </span>
            {question.tags?.map((t) => (
              <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{question.description}</p>
          <p className="text-xs text-gray-400 mt-4">
            Asked by {question.author.fullName} • {question.views} views
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
      </h2>

      {answers.length === 0 ? (
        <p className="text-gray-400 text-sm mb-4">No answers yet. Be the first to help out.</p>
      ) : (
        <div className="space-y-3">
          {answers.map((a) => (
            <AnswerCard key={a._id} answer={a} questionId={id} isQuestionAuthor={isQuestionAuthor} onChanged={load} />
          ))}
        </div>
      )}

      <form onSubmit={handleAddAnswer} className="bg-white rounded-2xl shadow-sm p-4 mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer</label>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Share your explanation..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={submitting || !answerText.trim()}
          className="mt-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          {submitting ? 'Posting...' : 'Post Answer'}
        </button>
      </form>
    </MainLayout>
  );
}
