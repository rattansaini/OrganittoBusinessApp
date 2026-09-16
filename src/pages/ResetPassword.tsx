import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setValidToken(false);
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message || 'Failed to reset password. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen bg-cream relative overflow-hidden flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <button
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 text-primary hover:text-sage transition-colors duration-300 font-semibold flex items-center gap-2"
        >
          <Leaf className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Home</span>
        </button>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-panel border border-edge rounded-2xl shadow-e2 p-8 md:p-10">
            <div className="flex items-center justify-center mb-8">
              <img
                src="/organitto-logo.png"
                alt="Organitto - The Organic Choice"
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-soft-red/10 border border-soft-red/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-soft-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-soft-red text-sm font-semibold">Invalid Reset Link</p>
                <p className="text-soft-red/80 text-sm mt-1">{error}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full mt-6 py-3.5 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 text-primary hover:text-sage transition-colors duration-300 font-semibold flex items-center gap-2"
      >
        <Leaf className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-panel border border-edge rounded-2xl shadow-e2 p-8 md:p-10">
          <div className="flex items-center justify-center mb-8">
            <img
              src="/whatsapp_image_2025-10-29_at_11.28.27.jpeg"
              alt="Organitto - The Organic Choice"
              className="h-16 w-auto object-contain logo-transparent-light"
            />
          </div>

          <h1 className="font-heading text-4xl font-bold text-primary text-center mb-2">
            Create New Password
          </h1>
          <p className="text-dark-brown/70 text-center mb-8">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-6 p-4 bg-soft-red/10 border border-soft-red/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-soft-red flex-shrink-0 mt-0.5" />
              <p className="text-soft-red text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 text-sm font-semibold">Password reset successfully</p>
                <p className="text-green-700 text-sm mt-1">
                  Redirecting you to login...
                </p>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark-brown mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-brown mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-dark-brown/40 text-sm">
          Organitto - Natural Business Management
        </p>
      </div>
    </div>
  );
}
