import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateProfile, uploadProfilePicture } from '../services/userService';

// Comma-separated <-> array helpers for the skills/interests/achievements inputs.
const toCsv = (arr) => (arr || []).join(', ');
const fromCsv = (str) =>
  str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user._id).then((p) =>
      setForm({
        fullName: p.fullName || '',
        bio: p.bio || '',
        branch: p.branch || '',
        section: p.section || '',
        skills: toCsv(p.skills),
        interests: toCsv(p.interests),
        achievements: toCsv(p.achievements),
        githubUrl: p.githubUrl || '',
        linkedinUrl: p.linkedinUrl || '',
      })
    );
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile({
        ...form,
        skills: fromCsv(form.skills),
        interests: fromCsv(form.interests),
        achievements: fromCsv(form.achievements),
      });
      toast.success('Profile updated');
      navigate(`/profile/${user._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const profilePicture = await uploadProfilePicture(file);
      toast.success('Profile picture updated');
      if (setUser) setUser((prev) => ({ ...prev, profilePicture }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingPic(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  if (!form) {
    return (
      <MainLayout>
        <p className="text-gray-400 text-sm">Loading...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
          <input type="file" accept="image/*" onChange={handlePictureChange} disabled={uploadingPic} className="text-sm" />
          {uploadingPic && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} maxLength={500} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input name="branch" value={form.branch} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input name="section" value={form.section} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
            <input name="skills" value={form.skills} onChange={handleChange} className={inputClass} placeholder="React, Node.js, MongoDB" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
            <input name="interests" value={form.interests} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Achievements (comma-separated)</label>
            <input name="achievements" value={form.achievements} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input name="githubUrl" value={form.githubUrl} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
