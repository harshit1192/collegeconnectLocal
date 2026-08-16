import { Link } from 'react-router-dom';

export default function CommunityCard({ community }) {
  const logoSrc = community.logo
    ? community.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=3b6ff2&color=fff`;

  return (
    <Link
      to={`/communities/${community._id}`}
      className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
    >
      <img src={logoSrc} alt={community.name} className="w-14 h-14 rounded-xl object-cover border" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate">{community.name}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{community.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {community.category}
          </span>
          <span className="text-xs text-gray-400">{community.memberCount ?? community.members?.length ?? 0} members</span>
        </div>
      </div>
    </Link>
  );
}
