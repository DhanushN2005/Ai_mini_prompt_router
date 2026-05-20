import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Bot, MessageSquare, Settings, BarChart3, ChevronRight,
  PlusCircle, Cpu, LogOut, X, Sun, Moon, Key, Eye, EyeOff, Check
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

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [openaiKey, setOpenaiKey] = React.useState('');
  const [anthropicKey, setAnthropicKey] = React.useState('');
  const [geminiKey, setGeminiKey] = React.useState('');
  const [groqKey, setGroqKey] = React.useState('');

  const [showOpenai, setShowOpenai] = React.useState(false);
  const [showAnthropic, setShowAnthropic] = React.useState(false);
  const [showGemini, setShowGemini] = React.useState(false);
  const [showGroq, setShowGroq] = React.useState(false);

  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success'>('idle');

  React.useEffect(() => {
    if (isSettingsOpen) {
      setOpenaiKey(localStorage.getItem('openai_api_key') || '');
      setAnthropicKey(localStorage.getItem('anthropic_api_key') || '');
      setGeminiKey(localStorage.getItem('gemini_api_key') || '');
      setGroqKey(localStorage.getItem('groq_api_key') || '');
      setSaveStatus('idle');
    }
  }, [isSettingsOpen]);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (openaiKey.trim()) localStorage.setItem('openai_api_key', openaiKey.trim());
    else localStorage.removeItem('openai_api_key');

    if (anthropicKey.trim()) localStorage.setItem('anthropic_api_key', anthropicKey.trim());
    else localStorage.removeItem('anthropic_api_key');

    if (geminiKey.trim()) localStorage.setItem('gemini_api_key', geminiKey.trim());
    else localStorage.removeItem('gemini_api_key');

    if (groqKey.trim()) localStorage.setItem('groq_api_key', groqKey.trim());
    else localStorage.removeItem('groq_api_key');

    setSaveStatus('success');
    setTimeout(() => {
      setIsSettingsOpen(false);
      setSaveStatus('idle');
    }, 800);
  };

  const hasCustomKeys = () => {
    return !!(
      localStorage.getItem('openai_api_key') ||
      localStorage.getItem('anthropic_api_key') ||
      localStorage.getItem('gemini_api_key') ||
      localStorage.getItem('groq_api_key')
    );
  };

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

          <button
            onClick={() => {
              setIsSettingsOpen(true);
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all outline-none select-none nav-link animate-slide-left hover:bg-neutral-500/5 text-left"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4" />
              <span>API Credentials</span>
              {hasCustomKeys() && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
              )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>
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

      {/* API Keys Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="w-full max-w-md p-6 rounded-2xl flex flex-col relative overflow-hidden select-none animate-scale-in card"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border)', 
              boxShadow: 'var(--shadow-card)',
              color: 'var(--text-primary)'
            }}
          >
            <button 
              onClick={() => setIsSettingsOpen(false)}
              type="button"
              className="absolute top-4 right-4 text-muted hover:text-primary transition-colors outline-none"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg text-white">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">API Credentials</h3>
                <p className="text-[11px] leading-normal" style={{ color: 'var(--text-muted)' }}>
                  Keys are saved in your local browser only.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKeys} className="space-y-4">
              {/* OpenAI key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenai ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none border"
                    style={{ 
                      backgroundColor: 'var(--bg-base)', 
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenai(!showOpenai)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors outline-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Anthropic key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    type={showAnthropic ? "text" : "password"}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none border"
                    style={{ 
                      backgroundColor: 'var(--bg-base)', 
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropic(!showAnthropic)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors outline-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gemini key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showGemini ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none border"
                    style={{ 
                      backgroundColor: 'var(--bg-base)', 
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors outline-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Groq key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    type={showGroq ? "text" : "password"}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none border"
                    style={{ 
                      backgroundColor: 'var(--bg-base)', 
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroq(!showGroq)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors outline-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-85 transition-opacity outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-elevated)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'success'}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 outline-none"
                >
                  {saveStatus === 'success' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved Credentials</span>
                    </>
                  ) : (
                    <span>Save Credentials</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
