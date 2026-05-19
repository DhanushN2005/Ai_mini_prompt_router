import React from 'react';
import { Bot, User, AlertCircle, Wifi } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../hooks/useSSE';

interface ChatMessageProps {
  message: Message;
}

function parseErrorMessage(text: string): { title: string; detail: string } {
  if (text.includes('429') || text.toLowerCase().includes('quota'))
    return { title: 'API Quota Exceeded', detail: 'You exceeded your free tier limit. Wait for quota reset or upgrade your plan.' };
  if (text.includes('401') || text.toLowerCase().includes('api key') || text.toLowerCase().includes('unauthorized'))
    return { title: 'Invalid API Key', detail: 'The API key is missing or incorrect. Update your .env file and restart the server.' };
  if (text.includes('503') || text.toLowerCase().includes('overloaded') || text.toLowerCase().includes('unavailable'))
    return { title: 'Provider Unavailable', detail: 'The AI provider is overloaded or under maintenance. Try again shortly.' };
  if (text.toLowerCase().includes('network') || text.toLowerCase().includes('failed to fetch'))
    return { title: 'Network Error', detail: 'Could not reach the backend. Ensure the server is running.' };
  return { title: 'AI Generation Failed', detail: text };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  /* ── Error bubble ─────────────────────────────────── */
  if (message.isError) {
    const { title, detail } = parseErrorMessage(message.text);
    return (
      <div className="flex gap-3 w-full justify-start animate-fade-up">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
          <Wifi className="w-4 h-4" />
        </div>
        <div className="max-w-[75%] rounded-2xl px-4 py-3"
          style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--error-text)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--error-text)' }}>{title}</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--error-muted)' }}>{detail}</p>
          {message.model && (
            <p className="mt-2 text-[10px] font-semibold uppercase" style={{ color: 'var(--error-muted)', opacity: 0.7 }}>
              {message.model}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Normal message bubble ────────────────────────── */
  return (
    <div className={`flex gap-3 w-full animate-fade-up ${isUser ? 'justify-end' : 'justify-start'}`}>

      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--brand)', boxShadow: 'var(--shadow-card)' }}>
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[80%] w-fit break-words leading-relaxed text-[15px] relative group
        ${isUser ? 'rounded-3xl px-5 py-3' : 'py-1'}`}
        style={isUser
          ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }
          : { color: 'var(--text-primary)' }
        }>

        {isUser
          ? <div className="whitespace-pre-wrap">{message.text}</div>
          : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
            </div>
          )
        }

        {!isUser && !message.isStreaming && message.provider && (
          <div className="mt-2.5 flex items-center gap-2 select-none text-[11px] font-medium"
            style={{ color: 'var(--text-muted)' }}>
            <span className="uppercase">{message.model}</span>
            <span>•</span>
            <span>{message.tokensUsed} Tokens</span>
          </div>
        )}

        {message.isStreaming && (
          <span className="w-2 h-4 inline-block animate-pulse ml-1 rounded-sm"
            style={{ backgroundColor: 'var(--brand)' }} />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ backgroundColor: 'var(--brand)', color: '#fff', boxShadow: 'var(--shadow-brand)' }}>
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
