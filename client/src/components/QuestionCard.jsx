import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function QuestionCard({ question }) {
  const score = (question.upvotes?.length || 0) - (question.downvotes?.length || 0);

  return (
    <Link
      to={`/academic/${question._id}`}
      className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center text-xs text-gray-500 w-14 shrink-0">
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800">{score}</p>
            <p>votes</p>
          </div>
          <div className="text-center mt-2">
            <p className="text-base font-semibold text-gray-800">{question.answers?.length || 0}</p>
            <p>answers</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{question.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{question.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {question.subject}
            </span>
            {question.tags?.slice(0, 3).map((t) => (
              <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
            {question.acceptedAnswer && (
              <span className="text-green-600 text-xs font-medium">✓ Solved</span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Asked by {question.author?.fullName} • {timeAgo(question.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
