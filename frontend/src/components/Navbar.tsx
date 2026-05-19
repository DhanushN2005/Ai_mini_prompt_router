import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Bot, MessageSquare, Settings, BarChart3, ChevronRight,
  PlusCircle, Cpu, LogOut, X, Sun, Moon
} from 'lucide-react';

interface BotConfig { id: string; name: string; provider: string; }
interface NavbarProps {
  bots: BotConfig[];
  onCloseMobile?: () => void;
  onLogout: () => void;
}

export default function Navbar({ bots, onCloseMobile, onLogout }: NavbarProps) {
  const location = useLocation();
  const user = useAuth((state) => state.user);
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const getProviderTag = (prov: string) => {
    switch (prov) {
      case 'OpenAI':        return 'GPT';
      case 'Anthropic':     return 'Claude';
      case 'Gemini':
      case 'Google Gemini': return 'Gemini';
      default:              return prov;
    }
  };

  const navLinkClass = (active: boolean) =>
    `nav-link animate-slide-left ${active ? 'active' : ''}`;

  return (
    <div
      className="h-full flex flex-col justify-between sidebar-bg"
      style={{ borderRight: '1px solid var(--border)', transition: 'background-color 0.3s' }}
    >
      {/* Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-5"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <Link to="/" className="flex items-center gap-2.5 outline-none select-none" onClick={onCloseMobile}>
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg animate-pulse-glow">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AI Router</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
            style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}>v1.0</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={toggleTheme} title="Toggle theme"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav links + bots */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">

        {/* Main links */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest px-3 block mb-2 select-none"
            style={{ color: 'var(--text-muted)' }}>Navigation</label>

          <Link to="/" onClick={onCloseMobile}
            className={navLinkClass(isActive('/') || location.pathname.startsWith('/bot/'))}>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat Room</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Link>

          <Link to="/bots" onClick={onCloseMobile}
            className={navLinkClass(isActive('/bots'))}>
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Bot Management</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Link>

          <Link to="/dashboard" onClick={onCloseMobile}
            className={navLinkClass(isActive('/dashboard'))}>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span>Usage Analytics</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Link>
        </div>

        {/* Bot list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 mb-1 select-none">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Active Assistants
            </label>
            <Link to="/bots" onClick={onCloseMobile} title="Manage Bots"
              className="transition-colors hover:scale-110"
              style={{ color: 'var(--brand)' }}>
              <PlusCircle className="w-3.5 h-3.5" />
            </Link>
          </div>

          {bots.length === 0 ? (
            <div className="mx-1 p-4 rounded-xl text-center select-none"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <p className="text-xs leading-normal" style={{ color: 'var(--text-muted)' }}>No assistants yet.</p>
              <Link to="/bots" className="font-semibold text-xs mt-1 inline-block hover:underline"
                style={{ color: 'var(--brand)' }}>
                Create First Bot
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {bots.map((b, i) => {
                const botPath = `/bot/${b.id}`;
                const active  = isActive(botPath);
                return (
                  <Link key={b.id} to={botPath} onClick={onCloseMobile}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all outline-none animate-fade-in"
                    style={{
                      animationDelay: `${i * 40}ms`,
                      backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                      border: active ? '1px solid var(--border)' : '1px solid transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: active ? 600 : 400,
                    }}>
                    <div className="flex items-center gap-2.5 truncate">
                      <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }} />
                      <span className="truncate text-xs">{b.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {getProviderTag(b.provider)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User footer */}
      {user && (
        <div className="p-4 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold uppercase text-sm select-none shrink-0"
              style={{ backgroundColor: 'var(--brand)', color: '#fff' }}>
              {user.name ? user.name[0] : 'U'}
            </div>
            <div className="truncate select-none min-w-0">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-xs truncate leading-normal" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>

          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold outline-none transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
