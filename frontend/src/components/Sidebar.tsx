import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Bot, MessageSquare, Settings, BarChart3, ChevronLeft, ChevronRight,
  PlusCircle, Cpu, LogOut, Sun, Moon, Key, HelpCircle
} from 'lucide-react';
import ApiCredentialsModal from './ApiCredentialsModal';

interface BotSummary {
  id: string;
  name: string;
  provider: string;
}

interface SidebarProps {
  bots: BotSummary[];
  onCloseMobile?: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ bots, onCloseMobile, onLogout, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const user = useAuth((state) => state.user);
  const { isDark, toggleTheme } = useTheme();

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [hasCustomKeys, setHasCustomKeys] = React.useState(false);

  // Monitor localStorage keys for glow pulsar
  const checkCustomKeys = () => {
    const active = !!(
      localStorage.getItem('openai_api_key') ||
      localStorage.getItem('anthropic_api_key') ||
      localStorage.getItem('gemini_api_key') ||
      localStorage.getItem('groq_api_key') ||
      localStorage.getItem('deepseek_api_key') ||
      localStorage.getItem('mistral_api_key') ||
      localStorage.getItem('xai_api_key') ||
      localStorage.getItem('meta_api_key')
    );
    setHasCustomKeys(active);
  };

  React.useEffect(() => {
    checkCustomKeys();
    window.addEventListener('api-keys-updated', checkCustomKeys);
    return () => window.removeEventListener('api-keys-updated', checkCustomKeys);
  }, []);

  const handleToggleCollapse = () => {
    onToggleCollapse();
    // Dispatch custom resize event to let layouts know to adapt quickly
    window.dispatchEvent(new Event('resize'));
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/bot/');
    }
    return location.pathname === path;
  };

  const getProviderTag = (prov: string) => {
    switch (prov.toLowerCase()) {
      case 'openai':        return 'GPT';
      case 'anthropic':     return 'Claude';
      case 'gemini':
      case 'google gemini': return 'Gemini';
      default:              return prov.substring(0, 5);
    }
  };

  const menuItems = [
    { path: '/', label: 'AI Chat Room', icon: MessageSquare },
    { path: '/bots', label: 'Bot Management', icon: Settings },
    { path: '/dashboard', label: 'Usage Analytics', icon: BarChart3 },
  ];

  return (
    <motion.div
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      className="h-full flex flex-col justify-between sidebar-bg relative border-r z-20"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-sidebar)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Collapse arrow toggle button (visible on desktop) */}
      <button
        onClick={handleToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full border items-center justify-center cursor-pointer hover:scale-105 z-30 transition-transform shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)'
        }}
      >
        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      {/* Brand Header */}
      <div
        className="h-16 shrink-0 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 outline-none select-none overflow-hidden"
          onClick={onCloseMobile}
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shrink-0 animate-pulse-glow">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  AI Router
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                  style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
                >
                  v1.2
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Close mobile button / sun/moon toggle */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              {onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="lg:hidden p-1 rounded-lg text-muted hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Links / List Scroll */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-none">
        
        {/* Navigation list */}
        <div className="space-y-1">
          {!isCollapsed && (
            <label
              className="text-[9px] font-bold uppercase tracking-widest px-3 block mb-2 select-none"
              style={{ color: 'var(--text-muted)' }}
            >
              Navigation
            </label>
          )}

          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className="relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group outline-none select-none"
                style={{
                  color: active ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {/* Active Indicator capsule background */}
                {active && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-blue-600 rounded-xl -z-10 shadow-md shadow-blue-500/20 border border-blue-400/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Subtle Hover effect */}
                {!active && (
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-200" />
                )}

                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-white' : 'text-neutral-400'}`} />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>

                {/* Left/Right expand chevron */}
                {!isCollapsed && (
                  <ChevronRight className={`w-3 h-3 opacity-30 transition-opacity group-hover:opacity-60 ${active ? 'text-white' : ''}`} />
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-16 bg-neutral-900 border border-white/10 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-lg pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* API Credentials Link */}
          <button
            onClick={() => {
              setIsSettingsOpen(true);
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group outline-none select-none text-left"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-200" />
            
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 shrink-0 text-neutral-400 group-hover:scale-105 transition-transform" />
              {!isCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  API Credentials
                </motion.span>
              )}
              {hasCustomKeys && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1 shrink-0" />
              )}
            </div>
            
            {!isCollapsed && <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-60" />}

            {isCollapsed && (
              <div className="absolute left-16 bg-neutral-900 border border-white/10 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-lg pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap flex items-center gap-2">
                <span>API Credentials</span>
                {hasCustomKeys && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </div>
            )}
          </button>
        </div>

        {/* Assistants bot list */}
        <div className="space-y-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 mb-1 select-none">
              <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Active Assistants
              </label>
              <Link to="/bots" onClick={onCloseMobile} className="text-blue-500 hover:scale-105 transition-transform">
                <PlusCircle className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {bots.length === 0 ? (
            !isCollapsed && (
              <div
                className="mx-1 p-3 rounded-xl text-center select-none"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No bots configured.</p>
                <Link to="/bots" className="font-bold text-[10px] text-blue-500 mt-1 inline-block hover:underline">
                  Create Assistant
                </Link>
              </div>
            )
          ) : (
            <div className="space-y-0.5">
              {bots.map((b) => {
                const botPath = `/bot/${b.id}`;
                const active = isActive(botPath);

                return (
                  <Link
                    key={b.id}
                    to={botPath}
                    onClick={onCloseMobile}
                    className="relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all group outline-none"
                    style={{
                      backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                      border: active ? '1px solid var(--border)' : '1px solid transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: active ? 600 : 400
                    }}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Cpu className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-500' : 'text-neutral-400'}`} />
                      {!isCollapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate text-[11px]">
                          {b.name}
                        </motion.span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase shrink-0"
                        style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}
                      >
                        {getProviderTag(b.provider)}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-16 bg-neutral-900 border border-white/10 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-lg pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                        {b.name} ({getProviderTag(b.provider)})
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Footer Profile Block */}
      {user && (
        <div
          className="p-3 shrink-0 flex flex-col gap-2.5"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}
        >
          {/* Avatar details */}
          <div className="flex items-center gap-3 px-1 overflow-hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold uppercase text-xs select-none shrink-0 shadow-sm"
              style={{ backgroundColor: 'var(--brand)', color: '#fff' }}
            >
              {user.name ? user.name[0] : 'U'}
            </div>
            
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="truncate select-none leading-tight"
                >
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggler inside footer if collapsed */}
          {isCollapsed && (
            <button
              onClick={toggleTheme}
              className="w-full py-1.5 rounded-lg flex items-center justify-center hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Log Out button */}
          {isCollapsed ? (
            <button
              onClick={onLogout}
              className="w-full py-2 rounded-xl flex items-center justify-center hover:bg-rose-500/10 text-rose-500 group relative transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <div className="absolute left-16 bg-neutral-900 border border-white/10 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-lg pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                Log Out
              </div>
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold outline-none border hover:bg-rose-500/5 hover:text-rose-500 hover:border-rose-500/20 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      )}

      {/* Render full screen Credentials Settings Portal Modal */}
      <ApiCredentialsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </motion.div>
  );
}
