
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BarChart2, Trophy, Shield, LogOut, Menu, UserCircle, Building2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const isAdminOrHOD = user && (user.role === 'hod' || user.is_president || user.is_vice_president);
  if (isAdminOrHOD) {
    links.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  const isExecutive = user && (user.is_president || user.is_vice_president);
  if (isExecutive) {
    links.push({ to: '/departments-overview', icon: Building2, label: 'Departments' });
  }

  const isHod = user && user.role === 'hod';
  if (isHod) {
    links.push({ to: '/department-progress', icon: Building2, label: 'My Department' });
  }

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 flex md:hidden items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur border border-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Dark overlay — mobile only, visible when isOpen */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          w-64 glass-panel border-r-0 border-l-0 border-t-0 border-b-0 rounded-none h-screen
          fixed left-0 top-0 flex flex-col z-50
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:flex
        `}
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-[#9AD872]">
            ProTrack
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Progress Made Visible.</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-neonBlue/10 text-neonBlue border border-neonBlue/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <link.icon size={20} />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-4">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-neonBlue/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">Level {user?.level ?? 1}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
