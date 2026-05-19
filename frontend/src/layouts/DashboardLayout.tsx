import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import { Menu, Bot } from 'lucide-react';

interface BotSummary { id: string; name: string; provider: string; }

export default function DashboardLayout() {
  const [bots, setBots]               = useState<BotSummary[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user     = useAuth((state) => state.user);
  const logout   = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const fetchBots = async () => {
    try {
      const res = await apiClient.get('/api/bots');
      setBots(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchBots();
    const handler = () => fetchBots();
    window.addEventListener('refresh-bots', handler);
    return () => window.removeEventListener('refresh-bots', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div
      className="h-screen w-screen flex overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background-color 0.3s' }}
    >
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute inset-0 z-30 backdrop-blur-sm animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-[272px] z-40 flex flex-col
        transition-transform duration-300 ease-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Navbar bots={bots} onCloseMobile={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Mobile top bar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:hidden select-none"
          style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-md flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AI Router</span>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase select-none"
            style={{ backgroundColor: 'var(--brand)', color: '#fff' }}>
            {user?.name ? user.name[0] : 'U'}
          </div>
        </header>

        {/* Page content with page enter animation */}
        <main className="flex-1 min-h-0 w-full overflow-hidden">
          <div key={location.pathname} className="page-enter h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
