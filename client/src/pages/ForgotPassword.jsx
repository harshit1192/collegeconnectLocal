import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await forgotPassword(email);
      toast.success(res.message);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">Forgot Password</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter your college email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">
            If an account with that email exists, a reset link has been sent. Check the server
            console (dev mode) for the link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@college.edu"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 mt-6 text-center">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
