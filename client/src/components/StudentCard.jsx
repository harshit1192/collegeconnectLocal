import { Link } from 'react-router-dom';

export default function StudentCard({ student }) {
  const avatarSrc = student.profilePicture
    ? student.profilePicture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&background=3b6ff2&color=fff`;

  return (
    <Link
      to={`/profile/${student._id}`}
      className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
    >
      <img src={avatarSrc} alt={student.fullName} className="w-12 h-12 rounded-full object-cover border" />
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{student.fullName}</p>
        <p className="text-xs text-gray-500 truncate">
          {student.branch} • {student.year} • Sec {student.section}
        </p>
      </div>
    </Link>
  );
}
