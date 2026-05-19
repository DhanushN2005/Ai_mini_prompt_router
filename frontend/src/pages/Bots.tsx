import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import BotCard from '../components/BotCard';
import {
  Bot, Plus, Cpu, FileText, Sparkles, AlertCircle, Loader, CheckCircle, ArrowLeft, X, Sliders, ChevronDown, ChevronUp
} from 'lucide-react';

interface BotConfig {
  id: string; name: string; provider: string; model: string;
  description?: string; system_prompt: string; temperature?: number;
  max_tokens?: number; top_p?: number; top_k?: number;
  presence_penalty?: number; frequency_penalty?: number; created_at: string;
}

interface ModelOption { value: string; label: string; }

export default function Bots() {
  const [bots, setBots]             = useState<BotConfig[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);

  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider]     = useState('OpenAI');
  const [model, setModel]           = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const [temperature, setTemperature] = useState<number | ''>(0.7);
  const [maxTokens, setMaxTokens]     = useState<number | ''>('');
  const [topP, setTopP]               = useState<number | ''>('');
  const [topK, setTopK]               = useState<number | ''>('');
  const [presencePenalty, setPresencePenalty]   = useState<number | ''>('');
  const [frequencyPenalty, setFrequencyPenalty] = useState<number | ''>('');

  const [modelsList, setModelsList] = useState<Record<string, ModelOption[]>>({
    OpenAI: [], Anthropic: [], Gemini: [], Groq: []
  });

  const [isSaving, setIsSaving]               = useState(false);
  const [formError, setFormError]             = useState('');
  const [successMessage, setSuccessMessage]   = useState('');
  const [showPersonaDrawer, setShowPersonaDrawer] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const loadBots = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/bots');
      setBots(response.data);
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const response = await apiClient.get('/api/bots/models');
      if (response.data) {
        setModelsList(response.data);
      }
    } catch {
      setModelsList({
        OpenAI: [
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Default)' },
          { value: 'gpt-4o', label: 'GPT-4o (Default)' }
        ],
        Anthropic: [
          { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Default)' },
          { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Default)' }
        ],
        Gemini: [
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Default)' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Default)' }
        ],
        Groq: [
          { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Default)' }
        ]
      });
    }
  };

  useEffect(() => {
    loadBots();
    loadModels();
  }, []);

  useEffect(() => {
    const available = modelsList[provider] || [];
    const exists = available.some((m) => m.value === model);
    if (!exists && available.length > 0) {
      setModel(available[0].value);
    }
  }, [provider, modelsList]);

  const openCreateForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setProvider('OpenAI');
    setModel('');
    setSystemPrompt('');
    setTemperature(0.7);
    setMaxTokens('');
    setTopP('');
    setTopK('');
    setPresencePenalty('');
    setFrequencyPenalty('');
    setShowAdvancedSettings(false);
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  };

  const openEditForm = async (botId: string) => {
    setFormError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/bots/${botId}`);
      const b = response.data;
      setEditingId(botId);
      setName(b.name);
      setDescription(b.description || '');
      setProvider(b.provider);
      setModel(b.model);
      setSystemPrompt(b.system_prompt);
      setTemperature(b.temperature ?? 0.7);
      setMaxTokens(b.max_tokens ?? '');
      setTopP(b.top_p ?? '');
      setTopK(b.top_k ?? '');
      setPresencePenalty(b.presence_penalty ?? '');
      setFrequencyPenalty(b.frequency_penalty ?? '');
      setShowAdvancedSettings(false);
      setShowForm(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/bots/${deleteTarget}`);
      setDeleteTarget(null);
      loadBots();
      window.dispatchEvent(new Event('refresh-bots'));
    } catch (error) {
      console.error('Failed to delete bot:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSaving(true);

    const providerCasingMap: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Gemini',
      groq: 'Groq',
      google: 'Gemini'
    };
    const normalizedProvider = providerCasingMap[provider.toLowerCase()] || provider;

    const payload = {
      name,
      description,
      provider: normalizedProvider,
      model,
      system_prompt: systemPrompt,
      temperature: temperature === '' ? null : Number(temperature),
      max_tokens: maxTokens === '' ? null : Number(maxTokens),
      top_p: topP === '' ? null : Number(topP),
      top_k: topK === '' ? null : Number(topK),
      presence_penalty: presencePenalty === '' ? null : Number(presencePenalty),
      frequency_penalty: frequencyPenalty === '' ? null : Number(frequencyPenalty)
    };

    try {
      if (editingId) {
        await apiClient.patch(`/api/bots/${editingId}`, payload);
        setSuccessMessage('Assistant updated successfully!');
      } else {
        await apiClient.post('/api/bots', payload);
        setSuccessMessage('Assistant configured successfully!');
      }

      window.dispatchEvent(new Event('refresh-bots'));
      loadBots();

      setTimeout(() => {
        setShowForm(false);
      }, 1000);
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError('API action failed. Verify credentials and variables.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-6 py-8 relative page-enter"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* CASE 1: FORM DRAWER VIEW */}
      {showForm ? (
        <div className="max-w-2xl mx-auto animate-fade-up">
          <div className="mb-6">
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 text-sm font-semibold select-none outline-none hover:opacity-80 transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assistants</span>
            </button>
          </div>

          <div className="p-8 rounded-2xl relative shadow-2xl animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {editingId ? 'Edit Assistant' : 'Configure New Assistant'}
                </h1>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Customize your AI instructions and provider routing settings.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3 select-none animate-fade-down"
                style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--error-text)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--error-text)' }}>{formError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 select-none animate-fade-down">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-emerald-500 text-sm leading-relaxed">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Assistant Name
                </label>
                <input
                  type="text" required placeholder="E.g., Creative Writing Editor, SQL Expert"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl py-3 px-4 text-sm outline-none border"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Description
                </label>
                <input
                  type="text" placeholder="Give a short detail of this bot's purpose..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl py-3 px-4 text-sm outline-none border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Provider */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    AI Provider Routing
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={provider} onChange={(e) => setProvider(e.target.value)}
                      className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none border cursor-pointer select-none"
                    >
                      {Object.keys(modelsList).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Model Selection
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={model} onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none border cursor-pointer select-none"
                    >
                      {(modelsList[provider] || []).map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    System Instructions (Prompt)
                  </label>
                  <button
                    type="button" onClick={() => setShowPersonaDrawer(true)}
                    className="flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer select-none"
                    style={{ color: 'var(--brand)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Persona Guide</span>
                  </button>
                </div>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-4.5 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                  <textarea
                    required rows={6}
                    placeholder="Explain exactly how the AI should behave, speak, and enforce boundaries..."
                    value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full rounded-xl py-4 pl-11 pr-4 text-sm outline-none border font-mono leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Advanced settings */}
              <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center gap-2 text-sm font-semibold select-none outline-none w-full"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Advanced Model Settings</span>
                  {showAdvancedSettings ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </button>

                {showAdvancedSettings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Temperature
                      </label>
                      <input
                        type="number" step="0.1" min="0" max="2" placeholder="0.7 (Default)"
                        value={temperature} onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Max Tokens
                      </label>
                      <input
                        type="number" placeholder="Leave empty for auto"
                        value={maxTokens} onChange={(e) => setMaxTokens(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Top P
                      </label>
                      <input
                        type="number" step="0.05" min="0" max="1" placeholder="1.0"
                        value={topP} onChange={(e) => setTopP(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Top K
                      </label>
                      <input
                        type="number" placeholder="0"
                        value={topK} onChange={(e) => setTopK(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Presence Penalty
                      </label>
                      <input
                        type="number" step="0.1" min="-2" max="2" placeholder="0.0"
                        value={presencePenalty} onChange={(e) => setPresencePenalty(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Frequency Penalty
                      </label>
                      <input
                        type="number" step="0.1" min="-2" max="2" placeholder="0.0"
                        value={frequencyPenalty} onChange={(e) => setFrequencyPenalty(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-xl py-2.5 px-3 text-sm outline-none border"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSaving} className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-3.5">
                {isSaving ? (
                  <><Loader className="w-5 h-5 animate-spin" /><span>Saving configurations…</span></>
                ) : (
                  <span>Save Assistant</span>
                )}
              </button>
            </form>
          </div>

          {/* Persona Drawer Modal */}
          {showPersonaDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowPersonaDrawer(false)} />
              <div className="relative w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-slide-left"
                style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                      <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>System Prompt Personas</h3>
                    </div>
                    <button type="button" onClick={() => setShowPersonaDrawer(false)}
                      className="text-sm font-semibold p-1 hover:opacity-85" style={{ color: 'var(--text-muted)' }}>
                      Close
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Select one of our premium, pre-configured personas below to auto-populate your prompt field:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        title: "Code Architect & Developer",
                        summary: "Generates clean, optimal, well-commented code blocks and explains trade-offs.",
                        prompt: "You are an expert senior software developer and systems architect. Analyze all coding requests carefully. Provide highly optimized, cleanly structured, and thoroughly commented code blocks. Explain your design decisions and any complexity trade-offs clearly."
                      },
                      {
                        title: "Customer Support Specialist",
                        summary: "Polite, empathetic, patient, and highly structured technical support agent.",
                        prompt: "You are an empathetic, polite, and highly professional customer support representative. Address the user's concerns with patience. Structure your answers clearly, validate their feelings, and offer step-by-step instructions to solve their queries."
                      },
                      {
                        title: "Marketing Copywriter",
                        summary: "Persuasive, highly engaging, and conversion-focused product content.",
                        prompt: "You are a creative copywriter and content strategist. Write high-conversion product copy, engaging blog posts, and persuasive social media hooks. Focus on punchy taglines, active voice, and clear call-to-actions."
                      }
                    ].map((p, idx) => (
                      <div key={idx} className="p-4 rounded-xl transition-all group card"
                        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        <h4 className="font-semibold text-sm transition-colors group-hover:text-brand" style={{ color: 'var(--text-primary)' }}>
                          {p.title}
                        </h4>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{p.summary}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSystemPrompt(p.prompt);
                            setShowPersonaDrawer(false);
                          }}
                          className="btn-primary mt-3 text-[11px] font-semibold py-1.5 px-3 rounded-lg select-none cursor-pointer"
                        >
                          Apply Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CASE 2: BOTS GRID LISTING */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Bot Configurations</h1>
              <p className="text-sm mt-1 leading-normal" style={{ color: 'var(--text-muted)' }}>
                Create and manage your customized prompt routing bots.
              </p>
            </div>
            <button onClick={openCreateForm} className="btn-primary flex items-center justify-center gap-2 py-2.5 px-4 self-start sm:self-auto">
              <Plus className="w-4.5 h-4.5" />
              <span>Create Assistant</span>
            </button>
          </div>

          {isLoading ? (
            <div className="h-[50vh] w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
                <p className="text-sm select-none" style={{ color: 'var(--text-muted)' }}>Loading bots…</p>
              </div>
            </div>
          ) : bots.length === 0 ? (
            <div className="h-[50vh] w-full border border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center select-none max-w-2xl mx-auto mt-6"
              style={{ borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 animate-bounce"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--brand)' }}>
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>No Assistants Found</h3>
              <p className="text-sm mt-2 max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Configure your system prompt instructions and LLM routing rules to create your first assistant bot.
              </p>
              <button onClick={openCreateForm} className="btn-primary mt-5 py-2 px-4">
                Create New Bot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bots.map((b) => (
                <BotCard key={b.id} bot={b} onEdit={openEditForm} onDeleteRequest={(id) => setDeleteTarget(id)} />
              ))}
            </div>
          )}

          {/* Delete modal */}
          {deleteTarget && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4 select-none animate-fade-in">
              <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Delete Assistant</h3>
                    <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>
                      Are you absolutely sure you want to delete this assistant? This action is irreversible and will delete all custom settings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t pt-4 mt-6" style={{ borderColor: 'var(--border)' }}>
                  <button
                    disabled={isDeleting} onClick={() => setDeleteTarget(null)}
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    className="font-semibold py-2 px-4 rounded-xl text-xs transition-colors hover:opacity-90"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting} onClick={handleDelete}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isDeleting && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
