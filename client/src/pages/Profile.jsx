import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, followUser, unfollowUser, reportUser } from '../services/userService';
import { getOrCreateConversation } from '../services/messageService';

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  const isOwnProfile = me?._id === id;

  const load = () => {
    setLoading(true);
    getUserProfile(id)
      .then(setProfile)
      .catch(() => toast.error('Could not load this profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isFollowing = profile?.followers?.some((f) => f._id === me?._id);

  const handleFollowToggle = async () => {
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    try {
      const conversation = await getOrCreateConversation(id);
      navigate(`/messages/${conversation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation');
    }
  };

  const handleReportUser = async () => {
    const reason = window.prompt(
      'Reason for reporting this user (Spam, Harassment or bullying, Hate speech, Inappropriate content, Misinformation, Academic dishonesty, Other):'
    );
    if (!reason) return;
    try {
      const res = await reportUser(id, reason);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not report user');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Loading profile...</p>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Profile not found.</p>
      </MainLayout>
    );
  }

  const avatarSrc = profile.profilePicture
    ? profile.profilePicture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&size=128&background=3b6ff2&color=fff`;

  return (
    <MainLayout>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img src={avatarSrc} alt={profile.fullName} className="w-24 h-24 rounded-full object-cover border" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-sm text-gray-500">
              {profile.branch} • {profile.year} • Section {profile.section}
            </p>
            <p className="text-xs text-gray-400 mt-1">Roll No: {profile.rollNumber}</p>

            <div className="flex gap-4 mt-2 text-sm">
              <span>
                <span className="font-semibold">{profile.followers?.length || 0}</span>{' '}
                <span className="text-gray-500">Followers</span>
              </span>
              <span>
                <span className="font-semibold">{profile.following?.length || 0}</span>{' '}
                <span className="text-gray-500">Following</span>
              </span>
            </div>
          </div>

          {isOwnProfile ? (
            <Link
              to="/profile/edit"
              className="h-fit border border-brand-600 text-brand-600 hover:bg-brand-50 font-medium text-sm rounded-lg px-4 py-2"
            >
              Edit Profile
            </Link>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleFollowToggle}
                disabled={followBusy}
                className={`h-fit font-medium text-sm rounded-lg px-4 py-2 disabled:opacity-50 ${
                  isFollowing
                    ? 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={handleMessage}
                className="h-fit border border-brand-600 text-brand-600 hover:bg-brand-50 font-medium text-sm rounded-lg px-4 py-2"
              >
                Message
              </button>
              <button
                onClick={handleReportUser}
                className="h-fit text-xs text-gray-400 hover:text-red-500 px-2"
              >
                Report
              </button>
            </div>
          )}
        </div>

        {profile.bio && <p className="text-sm text-gray-700 mt-6">{profile.bio}</p>}

        {profile.skills?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.interests?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.achievements?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Achievements</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {profile.achievements.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {(profile.githubUrl || profile.linkedinUrl) && (
          <div className="mt-6 flex gap-4 text-sm">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
