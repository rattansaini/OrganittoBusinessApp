import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message || 'Failed to send reset email. Please try again.');
      } else {
        setSuccess(true);
        setEmail('');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

          <h1 className="font-heading text-4xl font-bold text-primary text-center mb-2">
            Reset Password
          </h1>
          <p className="text-dark-brown/70 text-center mb-8">
            Enter your email address and we'll send you a link to reset your password
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
                <p className="text-green-800 text-sm font-semibold">Check your email</p>
                <p className="text-green-700 text-sm mt-1">
                  We've sent a password reset link to your email. Please check your inbox and click the link to reset your password.
                </p>
              </div>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-dark-brown mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-cream font-semibold rounded-xl shadow-soft hover:shadow-e2 hover:-translate-y-[3px] active:translate-y-[1px] transition-[transform,box-shadow] duration-[180ms] ease-brisk disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-soft"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-primary text-cream font-semibold rounded-xl shadow-soft hover:shadow-e2 hover:-translate-y-[3px] active:translate-y-[1px] transition-[transform,box-shadow] duration-[180ms] ease-brisk"
              >
                Back to Login
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-dark-brown/60 text-sm">
              Remember your password?{' '}
              <Link to="/login" className="text-primary font-semibold hover:text-sage transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-dark-brown/40 text-sm">
          Organitto - Natural Business Management
        </p>
      </div>
    </div>
  );
}
