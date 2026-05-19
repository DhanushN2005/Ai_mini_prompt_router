import React from 'react';
import { Cpu, Calendar, MessageSquare, Edit3, Trash2 } from 'lucide-react';

interface BotConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  description?: string;
  system_prompt: string;
  created_at: string;
}

interface BotCardProps {
  bot: BotConfig;
  onEdit: (id: string) => void;
  onDeleteRequest: (id: string) => void;
}

const PROVIDER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  OpenAI:         { bg: 'rgba(16,185,129,0.08)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
  Anthropic:      { bg: 'rgba(249,115,22,0.08)',  text: '#f97316', border: 'rgba(249,115,22,0.2)' },
  Gemini:         { bg: 'rgba(99,102,241,0.08)',  text: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  'Google Gemini':{ bg: 'rgba(99,102,241,0.08)',  text: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  Groq:           { bg: 'rgba(239,68,68,0.08)',   text: '#ef4545', border: 'rgba(239,68,68,0.2)' },
};

export default function BotCard({ bot, onEdit, onDeleteRequest }: BotCardProps) {
  const badge = PROVIDER_BADGES[bot.provider] || { bg: 'var(--bg-elevated)', text: 'var(--text-muted)', border: 'var(--border)' };

  return (
    <div
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      className="rounded-2xl p-6 transition-all hover:scale-[1.01] hover:border-brand-subtle flex flex-col justify-between group animate-fade-up relative overflow-hidden"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--brand)' }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 select-none shadow-sm"
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {bot.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span
                  style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
                  className="inline-block border text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                >
                  {bot.provider}
                </span>
                <span
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  className="inline-block text-[9px] font-mono px-2 py-0.5 rounded-full uppercase"
                >
                  {bot.model}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed min-h-[2rem] line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {bot.description || 'No description provided.'}
        </p>

        {/* System Prompt Preview */}
        <div
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          className="mt-4 rounded-xl p-3.5 select-none"
        >
          <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
            System Instructions
          </span>
          <p className="text-xs font-mono truncate leading-normal" style={{ color: 'var(--text-secondary)' }}>
            {bot.system_prompt}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 border-t pt-4 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          <Calendar className="w-3.5 h-3.5" />
          <span>Created {new Date(bot.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* Action Chat link */}
          <button
            onClick={() => window.location.href = `/bot/${bot.id}`}
            style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
            className="flex-1 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          {/* Action Edit */}
          <button
            onClick={() => onEdit(bot.id)}
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            className="hover:text-brand hover:border-brand-border p-2 rounded-xl text-xs flex items-center justify-center transition-all active:scale-90"
            title="Edit Bot"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Action Delete */}
          <button
            onClick={() => onDeleteRequest(bot.id)}
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            className="hover:text-red-500 hover:border-red-200 p-2 rounded-xl text-xs flex items-center justify-center transition-all active:scale-90"
            title="Delete Bot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
