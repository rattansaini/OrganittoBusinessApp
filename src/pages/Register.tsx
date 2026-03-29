import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      if (loading) {
        setLoading(false);
      }
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, isFirstUser ? 2000 : 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, loading, isFirstUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error('Failed to check existing users');
      }

      const isFirst = count === 0;
      const finalRole = isFirst ? 'admin' : 'partner';

      if (isFirst) {
        setIsFirstUser(true);
      }

      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        finalRole
      );

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account. Please try again.');
        setLoading(false);
        setIsFirstUser(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
      setIsFirstUser(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isFirstUser) {
    return (
      <div className="min-h-screen bg-cream relative overflow-hidden flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg p-8 md:p-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-sage blur-xl opacity-30 rounded-full"></div>
                <div className="relative bg-gradient-to-br from-sage to-primary p-4 rounded-full shadow-soft">
                  <CheckCircle className="w-10 h-10 text-cream" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <h1 className="font-heading text-3xl font-bold text-primary mb-3">
              Welcome, Founder!
            </h1>
            <p className="text-dark-brown/70 mb-4">
              Your account has been created successfully. You have full access to all features.
            </p>
            <p className="text-dark-brown/60 text-sm">
              Redirecting to dashboard...
            </p>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg p-8 md:p-10">
          <div className="flex items-center justify-center mb-8">
            <img
              src="/whatsapp_image_2025-10-29_at_11.28.27.jpeg"
              alt="Organitto - The Organic Choice"
              className="h-16 w-auto object-contain logo-transparent-light"
            />
          </div>

          <h1 className="font-heading text-4xl font-bold text-primary text-center mb-2">
            Create Account
          </h1>
          <p className="text-dark-brown/70 text-center mb-8">
            Join Organitto and start managing your business
          </p>

          {error && (
            <div className="mb-6 p-4 bg-soft-red/10 border border-soft-red/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-soft-red flex-shrink-0 mt-0.5" />
              <p className="text-soft-red text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-dark-brown mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-dark-brown mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-dark-brown mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                  placeholder="+1 (555) 000-0000"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-dark-brown mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <p className="text-xs text-dark-brown/60 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-brown mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
              className="w-full py-3.5 bg-primary text-cream font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-brown/60 text-sm">
              Already have an account?{' '}
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
