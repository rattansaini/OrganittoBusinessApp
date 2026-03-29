import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Bell, User, Settings, LogOut, Menu, X, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const notificationCount = 3;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    {
      name: 'Finance',
      path: '/finance',
      submenu: [
        { name: 'Add Expense', path: '/expenses/add' },
        { name: 'Expense List', path: '/expenses' },
        { name: 'Reports', path: '/expenses/reports' },
        { name: 'Investments', path: '/investments' },
      ]
    },
    { name: 'Products', path: '/products' },
    { name: 'Calculator', path: '/calculator' },
    { name: 'Vendors', path: '/vendors' },
    { name: 'Documents', path: '/documents' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isFinanceActive = () => location.pathname.startsWith('/expenses') || location.pathname.startsWith('/investments') || location.pathname === '/finance';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-primary/10 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src="/whatsapp_image_2025-10-29_at_11.28.27.jpeg"
              alt="Organitto - The Organic Choice"
              className="h-10 md:h-12 w-auto object-contain logo-transparent"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.path} className="relative">
                {link.submenu ? (
                  <>
                    <button
                      onMouseEnter={() => setShowFinanceMenu(true)}
                      onMouseLeave={() => setShowFinanceMenu(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 ${
                        isFinanceActive()
                          ? 'bg-primary text-cream shadow-soft'
                          : 'text-dark-brown hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {link.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showFinanceMenu && (
                      <div
                        onMouseEnter={() => setShowFinanceMenu(true)}
                        onMouseLeave={() => setShowFinanceMenu(false)}
                        className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-soft-lg border-2 border-primary/10 overflow-hidden z-50"
                      >
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.path}
                            to={sublink.path}
                            className={`block px-4 py-3 text-sm font-medium transition-all duration-300 ${
                              isActive(sublink.path)
                                ? 'bg-primary/10 text-primary'
                                : 'text-dark-brown hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {sublink.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={link.path}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive(link.path)
                        ? 'bg-primary text-cream shadow-soft'
                        : 'text-dark-brown hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-dark-brown hover:bg-primary/10 rounded-lg transition-all duration-300">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-primary/10 rounded-lg transition-all duration-300"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-sage rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-cream" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-dark-brown">{user?.name}</p>
                  <p className="text-xs text-dark-brown/60 capitalize">{user?.role}</p>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-soft-lg border-2 border-primary/10 overflow-hidden z-20">
                    <div className="p-4 bg-cream/50 border-b-2 border-primary/10">
                      <p className="font-semibold text-dark-brown">{user?.name}</p>
                      <p className="text-sm text-dark-brown/60">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-accent/20 rounded-full">
                        <Shield className="w-3 h-3 text-accent" />
                        <span className="text-xs font-semibold text-dark-brown capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-dark-brown hover:bg-primary/10 rounded-lg transition-all duration-300"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-medium">Settings</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 text-soft-red hover:bg-soft-red/10 rounded-lg transition-all duration-300"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-dark-brown hover:bg-primary/10 rounded-lg transition-all duration-300"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <nav className="lg:hidden py-4 border-t-2 border-primary/10">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => !link.submenu && setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive(link.path) || (link.name === 'Finance' && isFinanceActive())
                        ? 'bg-primary text-cream shadow-soft'
                        : 'text-dark-brown hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {link.name}
                  </Link>
                  {link.submenu && (
                    <div className="ml-4 mt-2 flex flex-col gap-2">
                      {link.submenu.map((sublink) => (
                        <Link
                          key={sublink.path}
                          to={sublink.path}
                          onClick={() => setShowMobileMenu(false)}
                          className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            isActive(sublink.path)
                              ? 'bg-primary/20 text-primary'
                              : 'text-dark-brown/70 hover:bg-primary/10 hover:text-primary'
                          }`}
                        >
                          {sublink.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
