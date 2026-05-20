import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import { Menu, Bot } from 'lucide-react';

interface BotSummary { id: string; name: string; provider: string; }

export default function DashboardLayout() {
  const [bots, setBots] = useState<BotSummary[]>([]);
  
  // Mobile drawer visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Desktop collapse state synced with localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('isSidebarCollapsed') === 'true';
  });

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

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('isSidebarCollapsed', String(nextState));
  };

  return (
    <div
      className="h-screen w-screen flex overflow-hidden font-sans relative"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.3s'
      }}
    >
      {/* Premium background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Mobile drawer overlay backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute inset-0 z-30 backdrop-blur-md animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
      )}

      {/* Sidebar - Desktop collapsible & Mobile slide-over drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 h-full z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          bots={bots}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out relative ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Mobile top navigation header */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-4 lg:hidden select-none z-10 border-b"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl transition-colors hover:scale-105 border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-md flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AI Router
              </span>
            </div>
          </div>

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase select-none"
            style={{ backgroundColor: 'var(--brand)', color: '#fff' }}
          >
            {user?.name ? user.name[0] : 'U'}
          </div>
        </header>

        {/* Dynamic page content wrapped in transition animations */}
        <main className="flex-1 min-h-0 w-full overflow-hidden relative">
          <div key={location.pathname} className="page-enter h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
