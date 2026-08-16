import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 shrink-0 hidden sm:flex sm:flex-col">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <Link to="/" className="font-bold text-brand-700">
            CollegeConnect
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === item.to
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 text-xs text-gray-400">
          Logged in as <span className="font-medium text-gray-600">{user?.fullName}</span>
          <button onClick={logout} className="block mt-1 text-red-500 hover:underline">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="sm:hidden flex gap-2 mb-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                location.pathname === item.to ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
