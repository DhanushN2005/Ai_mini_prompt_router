import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Eye, EyeOff, Bot, Lock, Mail, User, AlertCircle, Loader, Sun, Moon,
  Cpu, ArrowRight, Zap, CheckCircle2, ShieldCheck, TrendingDown
} from 'lucide-react';

export default function Signup() {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError]   = useState('');

  // Routing Simulator dynamic state
  const [simProvider, setSimProvider] = useState('Anthropic');
  const [simStatus, setSimStatus]     = useState('Ready');

  const loginStore = useAuth((state) => state.login);
  const isLoading  = useAuth((state) => state.isLoading);
  const setLoading = useAuth((state) => state.setLoading);
  const navigate   = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Prompt Router simulation loop
  useEffect(() => {
    const providers = ['OpenAI', 'Anthropic', 'Gemini', 'Groq'];
    const statuses = ['Optimizing latency...', 'Checking budget...', 'Routing SSE...', 'Ready'];
    let idx = 0;
    const interval = setInterval(() => {
      setSimProvider(providers[idx % providers.length]);
      setSimStatus(statuses[idx % statuses.length]);
      idx++;
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const { data } = await axios.post(`${apiUrl}/api/auth/signup`, { name, email, password });
      loginStore(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
        'Failed to connect. Ensure MongoDB and the server are running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
      className="min-h-screen flex flex-col lg:flex-row overflow-hidden transition-colors duration-300 font-sans"
    >
      {/* ── LEFT HAND SIDE: INTERACTIVE SHOWCASE PANEL ──────────────── */}
      <div
        className="hidden lg:flex lg:w-7/12 p-12 flex-col justify-between relative overflow-hidden select-none"
        style={{
          borderRight: '1px solid var(--border)',
          background: isDark
            ? 'radial-gradient(circle at 10% 20%, rgba(37,99,235,0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99,102,241,0.06) 0%, transparent 50%), var(--bg-surface)'
            : 'radial-gradient(circle at 10% 20%, rgba(37,99,235,0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99,102,241,0.03) 0%, transparent 50%), var(--bg-surface)'
        }}
      >
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Top Branding Header */}
        <div className="flex items-center gap-3 relative z-10 animate-fade-in">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AI Prompt Router
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
            style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}>v1.0</span>
        </div>

        {/* Mid-Hero Content */}
        <div className="max-w-xl my-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6"
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
            <Zap className="w-3 h-3 animate-pulse" /> Let's Get Started
          </span>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-4 animate-fade-up">
            Configure Multi-LLM <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Personas Seamlessly</span>
          </h1>

          <p className="text-base leading-relaxed mb-10 animate-fade-up delay-100" style={{ color: 'var(--text-muted)' }}>
            Create an account to deploy tenant-isolated AI assistants, customize temperature thresholds, and route prompt payloads in real-time.
          </p>

          {/* Interactive Router Simulator Mock */}
          <div
            className="rounded-2xl p-5 shadow-lg border animate-scale-in mb-10 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Dynamic Routing Gateway
              </span>
            </div>

            {/* Sim input */}
            <div className="font-mono text-xs space-y-3.5">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 shrink-0 font-bold">$ prompt:</span>
                <span style={{ color: 'var(--text-secondary)' }}>"Write a summary of real-time multi-LLM orchestration..."</span>
              </div>

              {/* Dynamic route path */}
              <div className="flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed animate-pulse"
                style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}>
                <Cpu className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{simStatus}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
                      {simProvider}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick value props */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: CheckCircle2, text: "Server-Sent Event (SSE) Streaming" },
              { Icon: TrendingDown, text: "Smart Token Cost Optimization" },
              { Icon: ShieldCheck, text: "Isolated Tenancy Security" },
              { Icon: Cpu, text: "Dynamic Model Config Drawers" }
            ].map(({ Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                <Icon className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs relative z-10" style={{ color: 'var(--text-muted)' }}>
          Powered by Mini Prompt Router Engine • SECURE MD5/SHA256 Encrypted
        </div>
      </div>

      {/* ── RIGHT HAND SIDE: FORM CONTAINER ─────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">

        {/* Background glow blobs */}
        <div className="lg:hidden absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none animate-float"
          style={{ background: isDark ? 'rgba(56,139,253,0.05)' : 'rgba(37,99,235,0.04)' }} />

        {/* Theme Toggle Top-Right */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 animate-fade-in"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-md z-10 animate-scale-in">
          <div className="auth-card p-8 shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

            {/* Mobile Header Logo */}
            <div className="flex flex-col items-center mb-8 lg:mb-10 text-center">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-pulse-glow">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Create account
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Register to build secure multi-provider agent gateways
              </p>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3 animate-fade-down animate-pulse-glow"
                style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" style={{ color: 'var(--error-text)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--error-text)' }}>{formError}</p>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text" required placeholder="John Doe"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none border"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email" required placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none border"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl py-3 pl-11 pr-12 text-sm outline-none border"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3">
                {isLoading ? (
                  <><Loader className="w-4.5 h-4.5 animate-spin" /><span>Registering account…</span></>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Let's Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-7 pt-5 text-center text-sm border-t"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--brand)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
