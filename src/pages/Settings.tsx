import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      const userIndex = users.findIndex((u: any) => u.id === user?.id);

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
        };

        localStorage.setItem('users', JSON.stringify(users));

        const updatedUser = {
          id: users[userIndex].id,
          name: users[userIndex].name,
          email: users[userIndex].email,
          phone: users[userIndex].phone,
          role: users[userIndex].role,
        };

        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        setProfileMessage({ type: 'success', text: 'Profile updated successfully' });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      setPasswordLoading(false);
      return;
    }

    try {
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      const userIndex = users.findIndex((u: any) => u.id === user?.id && u.password === passwordData.currentPassword);

      if (userIndex !== -1) {
        users[userIndex].password = passwordData.newPassword;
        localStorage.setItem('users', JSON.stringify(users));

        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-heading text-4xl font-bold text-primary mb-2">Settings</h1>
            <p className="text-dark-brown/70">Manage your account settings and preferences</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="border-b-2 border-primary/10">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
                    activeTab === 'profile'
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-dark-brown/60 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
                    activeTab === 'security'
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-dark-brown/60 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span>Security</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {activeTab === 'profile' && (
                <div>
                  <div className="mb-6 p-4 bg-cream/50 rounded-xl border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-sage rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-cream" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark-brown">{user?.name}</h3>
                        <p className="text-sm text-dark-brown/60">{user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-full">
                        <Shield className="w-4 h-4 text-accent" />
                        <span className="text-sm font-semibold text-dark-brown capitalize">{user?.role}</span>
                      </div>
                    </div>
                  </div>

                  {profileMessage && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                      profileMessage.type === 'success'
                        ? 'bg-sage/10 border border-sage/30'
                        : 'bg-soft-red/10 border border-soft-red/30'
                    }`}>
                      {profileMessage.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-soft-red flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${profileMessage.type === 'success' ? 'text-sage' : 'text-soft-red'}`}>
                        {profileMessage.text}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-dark-brown mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                        <input
                          id="name"
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                          required
                          disabled={profileLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-dark-brown mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                        <input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                          required
                          disabled={profileLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-dark-brown mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                        <input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                          disabled={profileLoading}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-cream font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <Save className="w-5 h-5" />
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 border-2 border-primary/20 text-primary font-semibold rounded-xl hover:bg-primary/5 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <div className="mb-6">
                    <h3 className="font-heading text-2xl font-bold text-primary mb-2">Change Password</h3>
                    <p className="text-dark-brown/70">Update your password to keep your account secure</p>
                  </div>

                  {passwordMessage && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                      passwordMessage.type === 'success'
                        ? 'bg-sage/10 border border-sage/30'
                        : 'bg-soft-red/10 border border-soft-red/30'
                    }`}>
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-soft-red flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-sage' : 'text-soft-red'}`}>
                        {passwordMessage.text}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-semibold text-dark-brown mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                        <input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                          placeholder="••••••••"
                          required
                          disabled={passwordLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-semibold text-dark-brown mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                        <input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                          placeholder="••••••••"
                          required
                          disabled={passwordLoading}
                          minLength={8}
                        />
                      </div>
                      <p className="text-xs text-dark-brown/60 mt-1">Minimum 8 characters</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-brown mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                        <input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                          placeholder="••••••••"
                          required
                          disabled={passwordLoading}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-cream font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <Lock className="w-5 h-5" />
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 border-2 border-primary/20 text-primary font-semibold rounded-xl hover:bg-primary/5 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
