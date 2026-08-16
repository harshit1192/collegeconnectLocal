export default function VoteButtons({ upvotes, downvotes, userVote, onVote, disabled }) {
  const score = (upvotes || 0) - (downvotes || 0);

  return (
    <div className="flex flex-col items-center gap-1 w-10 shrink-0">
      <button
        onClick={() => onVote('up')}
        disabled={disabled}
        className={`text-lg leading-none ${userVote === 'up' ? 'text-brand-600' : 'text-gray-300 hover:text-brand-500'}`}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="text-sm font-semibold text-gray-700">{score}</span>
      <button
        onClick={() => onVote('down')}
        disabled={disabled}
        className={`text-lg leading-none ${userVote === 'down' ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}
