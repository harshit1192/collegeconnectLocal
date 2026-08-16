import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Feed from '../components/Feed';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-sm text-gray-500">Your college feed</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link to={`/profile/${user?._id}`} className="text-brand-600 hover:underline font-medium">
              My profile
            </Link>
            <Link to="/students" className="text-brand-600 hover:underline font-medium">
              Find students
            </Link>
          </div>
        </div>

        <AnnouncementBanner />

        <Feed />
      </div>
    </MainLayout>
  );
}
