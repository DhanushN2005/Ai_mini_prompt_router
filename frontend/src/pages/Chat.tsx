import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useSSE } from '../hooks/useSSE';
import ChatMessage from '../components/ChatMessage';
import {
  Bot, Send, Sparkles, Loader, Cpu, FileText, Terminal, Trash2
} from 'lucide-react';

interface BotDetail {
  id: string; name: string; provider: string; model: string;
  description?: string; system_prompt: string;
}

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OpenAI:         { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  Anthropic:      { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Gemini:         { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  'Google Gemini':{ bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  Groq:           { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
};

export default function Chat() {
  const { botId } = useParams<{ botId?: string }>();
  const isBotSelected = !!botId;

  const [bot, setBot]               = useState<BotDetail | null>(null);
  const [input, setInput]           = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);

  const { messages, isAiResponding, errorMessage, setErrorMessage,
          totalTokensSession, sendPrompt, clearHistory, loadHistory } = useSSE(botId || '');

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isAiResponding]);

  useEffect(() => {
    if (!isBotSelected) { setBot(null); return; }
    (async () => {
      setIsBotLoading(true); setErrorMessage('');
      try {
        const res = await apiClient.get(`/api/bots/${botId}`);
        setBot(res.data); loadHistory();
      } catch { setErrorMessage('Bot configuration could not be retrieved.'); }
      finally { setIsBotLoading(false); }
    })();
  }, [botId, isBotSelected]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiResponding || !bot) return;
    const prompt = input.trim(); setInput('');
    await sendPrompt(prompt, bot.provider, bot.model);
  };

  /* ── No bot selected ──────────────────────────────────────────── */
  if (!isBotSelected) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8 relative overflow-hidden select-none page-enter"
        style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full blur-[90px] pointer-events-none"
          style={{ background: 'rgba(37,99,235,0.05)' }} />

        <div className="text-center max-w-md z-10 animate-fade-up">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-glow">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
            AI Routing Gateway
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
            Select an assistant from the sidebar to start chatting, or create a new custom agent.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/bots',      Icon: Cpu,      label: 'Configure Bot',    sub: 'Set prompts & providers' },
              { to: '/dashboard', Icon: Terminal,  label: 'View Analytics',   sub: 'Token usage & statistics' },
            ].map(({ to, Icon, label, sub }) => (
              <Link key={to} to={to}
                className="p-5 rounded-2xl text-left transition-all hover:-translate-y-0.5 card"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <Icon className="w-5 h-5 mb-2.5" style={{ color: 'var(--brand)' }} />
                <h4 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{label}</h4>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading bot ──────────────────────────────────────────────── */
  if (isBotLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="text-sm select-none" style={{ color: 'var(--text-muted)' }}>Loading chat…</p>
        </div>
      </div>
    );
  }

  const provColor = PROVIDER_COLORS[bot?.provider || ''] || { bg: 'var(--bg-elevated)', text: 'var(--text-muted)', border: 'var(--border)' };

  /* ── Main chat ────────────────────────────────────────────────── */
  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* Header */}
      {bot && (
        <header className="h-14 shrink-0 flex items-center justify-between px-6 select-none"
          style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{bot.name}</h2>
                <span className="border text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0"
                  style={{ backgroundColor: provColor.bg, color: provColor.text, borderColor: provColor.border }}>
                  {bot.provider}
                </span>
              </div>
              <p className="text-[11px] truncate leading-normal" style={{ color: 'var(--text-muted)' }}>
                {bot.description || 'Custom chat agent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Session</span>
              <span className="text-xs font-semibold font-mono" style={{ color: 'var(--brand)' }}>{totalTokensSession} Tokens</span>
            </div>
            <button onClick={clearHistory} disabled={messages.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </header>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Empty state */}
          {messages.length === 0 && bot && (
            <div className="flex flex-col items-center justify-center min-h-[35vh] text-center max-w-sm mx-auto select-none animate-fade-up">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--brand)' }}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                Ready to assist
              </h3>
              <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                Send your first message to start the conversation with this agent.
              </p>
              {bot.system_prompt && (
                <div className="w-full p-3.5 rounded-xl text-left"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      System Prompt
                    </span>
                  </div>
                  <p className="text-[11px] font-mono leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {bot.system_prompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((m, idx) => <ChatMessage key={idx} message={m} />)}

          {/* Typing indicator */}
          {isAiResponding && messages[messages.length - 1]?.isStreaming === undefined && (
            <div className="flex gap-3 items-start animate-fade-in">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--brand)' }}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 py-3">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--brand)', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--brand)', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--brand)', animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 md:px-8 py-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text" required
            disabled={isAiResponding}
            placeholder={isAiResponding ? 'AI is thinking…' : 'Type your message…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl py-3 px-4 text-sm outline-none border"
            style={{ fontSize: '15px' }}
          />
          <button type="submit"
            disabled={!input.trim() || isAiResponding}
            className="btn-primary px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            style={{ borderRadius: '0.75rem' }}>
            {isAiResponding
              ? <Loader className="w-4.5 h-4.5 animate-spin" />
              : <Send className="w-4.5 h-4.5" />
            }
          </button>
        </form>
      </div>
    </div>
  );
}
