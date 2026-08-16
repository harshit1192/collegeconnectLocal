import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import Feed from '../components/Feed';
import { useAuth } from '../context/AuthContext';
import {
  getCommunity,
  joinCommunity,
  leaveCommunity,
  deleteCommunity,
  removeMember,
} from '../services/communityService';

export default function CommunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getCommunity(id)
      .then(setCommunity)
      .catch(() => toast.error('Could not load this community'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Loading community...</p>
      </MainLayout>
    );
  }

  if (!community) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Community not found.</p>
      </MainLayout>
    );
  }

  const isMember = community.members.some((m) => m._id === user?._id);
  const isCreator = community.creator._id === user?._id;
  const isCommunityAdmin =
    isCreator || community.admins.some((a) => a._id === user?._id) || user?.role === 'admin';

  const logoSrc = community.logo
    ? community.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&size=128&background=3b6ff2&color=fff`;

  const handleJoin = async () => {
    setBusy(true);
    try {
      await joinCommunity(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await leaveCommunity(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not leave');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${community.name}? This cannot be undone.`)) return;
    try {
      await deleteCommunity(id);
      toast.success('Community deleted');
      navigate('/communities');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeMember(id, userId);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove member');
    }
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img src={logoSrc} alt={community.name} className="w-20 h-20 rounded-xl object-cover border" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{community.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {community.category}
              </span>
              <button
                onClick={() => setShowMembers((s) => !s)}
                className="text-xs text-gray-500 hover:text-brand-600 underline"
              >
                {community.members.length} members
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isMember ? (
              !isCreator && (
                <button
                  onClick={handleLeave}
                  disabled={busy}
                  className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
                >
                  Leave
                </button>
              )
            ) : (
              <button
                onClick={handleJoin}
                disabled={busy}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
              >
                Join
              </button>
            )}
            {isCreator && (
              <button onClick={handleDelete} className="text-xs text-red-500 hover:underline">
                Delete community
              </button>
            )}
          </div>
        </div>

        {showMembers && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-2 max-h-64 overflow-y-auto">
            {community.members.map((m) => (
              <div key={m._id} className="flex items-center justify-between text-sm">
                <span>
                  {m.fullName}
                  {m._id === community.creator._id && (
                    <span className="ml-2 text-xs text-brand-600 font-medium">Creator</span>
                  )}
                  {community.admins.some((a) => a._id === m._id) && m._id !== community.creator._id && (
                    <span className="ml-2 text-xs text-gray-400">Admin</span>
                  )}
                </span>
                {isCommunityAdmin && m._id !== community.creator._id && (
                  <button
                    onClick={() => handleRemoveMember(m._id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isMember ? (
        <Feed communityId={id} />
      ) : (
        <p className="text-center text-gray-400 text-sm py-8">Join this community to see and post in its feed.</p>
      )}
    </MainLayout>
  );
}
