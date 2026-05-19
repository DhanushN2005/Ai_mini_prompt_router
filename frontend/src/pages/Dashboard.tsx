import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  BarChart3, Zap, Cpu, Award, RefreshCw, ArrowRight, DollarSign, Activity, HardDrive
} from 'lucide-react';

interface CompletionLog {
  id: string; bot_name: string; provider: string; model: string;
  tokens_used: number; created_at: string;
}

interface SummaryMetrics {
  total_calls: number; total_tokens: number; total_bots: number;
  provider_metrics: Record<string, number>; recent_logs: CompletionLog[];
}

export default function Dashboard() {
  const [metrics, setMetrics]       = useState<SummaryMetrics | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      const response = await apiClient.get('/api/usage/summary');
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <RefreshCw className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="text-sm select-none" style={{ color: 'var(--text-muted)' }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  const totalCalls    = metrics?.total_calls || 0;
  const totalTokens   = metrics?.total_tokens || 0;
  const totalBots     = metrics?.total_bots || 0;
  const estimatedCost = ((totalTokens / 1000000) * 2.00).toFixed(4);

  const providers         = metrics?.provider_metrics || {};
  const maxProviderTokens = Math.max(...Object.values(providers), 1);

  const providerColors: Record<string, string> = {
    OpenAI:          '#10b981',
    Anthropic:       '#f97316',
    Gemini:          '#6366f1',
    'Google Gemini': '#6366f1',
    Groq:            '#ef4545'
  };

  return (
    <div className="h-full w-full overflow-y-auto px-6 md:px-8 py-8 page-enter" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 animate-fade-in" style={{ color: 'var(--brand)' }} />
            <span>Usage Analytics</span>
          </h1>
          <p className="text-sm mt-1 leading-normal font-medium" style={{ color: 'var(--text-muted)' }}>
            Real-time statistics, token consumption breakdown, and routing performance.
          </p>
        </div>

        <button
          onClick={handleRefresh} disabled={refreshing}
          className="self-start px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all outline-none"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: refreshing ? 'var(--brand)' : 'inherit' }} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Highlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-up">

        {/* Total Calls */}
        <div className="p-6 rounded-2xl transition-all relative overflow-hidden group card"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total API Requests</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              <Zap className="w-5 h-5 animate-pulse-glow" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight">{totalCalls}</h3>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live server completions</span>
          </p>
        </div>

        {/* Total Tokens */}
        <div className="p-6 rounded-2xl transition-all relative overflow-hidden group card"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tokens Consumed</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight">{totalTokens.toLocaleString()}</h3>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
            <span>Total parsed context</span>
          </p>
        </div>

        {/* Estimated Blended Cost */}
        <div className="p-6 rounded-2xl transition-all relative overflow-hidden group card"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Blended Cost</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight">${estimatedCost}</h3>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            <span>Average $2.00 per 1M tokens</span>
          </p>
        </div>

        {/* Active Assistants */}
        <div className="p-6 rounded-2xl transition-all relative overflow-hidden group card"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Active Assistants</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              <Award className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight">{totalBots}</h3>
          <p className="text-xs mt-2">
            <Link to="/bots" className="font-semibold inline-flex items-center gap-1 transition-colors hover:opacity-85" style={{ color: 'var(--brand)' }}>
              <span>Manage assistants</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Allocations breakdown panel */}
        <div className="lg:col-span-1 p-6 rounded-2xl shadow-lg flex flex-col h-fit card"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-sm font-bold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>Token Allocation</h3>

          {totalTokens === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No usage data logged.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>breakdown will appear once messages are processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(providers).map(([name, count]) => {
                const percentage   = totalTokens > 0 ? Math.round((count / totalTokens) * 100) : 0;
                const progressWidth = Math.max((count / maxProviderTokens) * 100, 2);

                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-semibold">{name}</span>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: 'var(--text-muted)' }}>{count.toLocaleString()} tokens</span>
                        <span className="px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>{percentage}%</span>
                      </div>
                    </div>

                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressWidth}%`, backgroundColor: providerColors[name] || 'var(--brand)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ledger Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl shadow-lg flex flex-col card"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-sm font-bold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>Recent Ledger</h3>

          {(!metrics?.recent_logs || metrics.recent_logs.length === 0) ? (
            <div className="flex-1 py-16 flex flex-col items-center justify-center text-center">
              <Cpu className="w-10 h-10 mb-3 animate-pulse" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No logs recorded.</p>
              <p className="text-xs mt-1 max-w-xs leading-normal" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
                Completions generated via the chat room will be securely logged and listed here in real-time.
              </p>
              <Link
                to="/"
                className="btn-primary mt-4 px-4 py-2 rounded-xl text-xs flex items-center justify-center"
              >
                Go to Chat Room
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[10px] uppercase font-bold select-none" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <th className="pb-3 px-1">Assistant</th>
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Model</th>
                    <th className="pb-3 text-right">Tokens</th>
                    <th className="pb-3 text-right px-1">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border)' }}>
                  {metrics.recent_logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-neutral-500/5">
                      <td className="py-3.5 font-semibold px-1 max-w-[120px] truncate">{log.bot_name}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[9px]"
                          style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                          {log.provider === 'Google Gemini' ? 'Gemini' : log.provider}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-[10px] max-w-[150px] truncate" style={{ color: 'var(--text-muted)' }}>{log.model}</td>
                      <td className="py-3.5 text-right font-semibold">{log.tokens_used.toLocaleString()}</td>
                      <td className="py-3.5 text-right px-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
