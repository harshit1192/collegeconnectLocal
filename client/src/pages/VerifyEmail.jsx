import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-brand-700 mb-4">Email Verification</h1>

        {status === 'verifying' && <p className="text-gray-500 text-sm">Verifying your email...</p>}

        {status === 'success' && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">{message}</div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{message}</div>
        )}

        <Link to="/login" className="inline-block mt-6 text-brand-600 font-medium hover:underline text-sm">
          Go to login
        </Link>
      </div>
    </div>
  );
}
