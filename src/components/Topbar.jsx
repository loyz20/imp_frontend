import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import NotificationPanel from './NotificationPanel';

export default function Topbar({ onMenuToggle }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { unreadCount, togglePanel } = useNotificationStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all w-64 lg:w-80">
            <Search className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              placeholder="Cari menu, fitur, data..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
            />
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={togglePanel}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Bell className="w-5 h-5" strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>
            <NotificationPanel />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-gray-200" />

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[11px] text-gray-500 leading-tight">{user?.email || ''}</p>
              </div>
              <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            {/* Dropdown menu */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <Link to="/settings?tab=profil" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  Profil Saya
                </Link>
                <Link to="/settings?tab=keamanan" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  Pengaturan
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.8} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
