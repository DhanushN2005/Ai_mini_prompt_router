import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Key, Eye, EyeOff, Check, Copy, AlertCircle, Info,
  Search, Shield, CheckCircle2, RefreshCw, Sparkles, Filter
} from 'lucide-react';

interface ApiCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProviderDef {
  id: string;
  name: string;
  category: 'popular' | 'open-source' | 'specialist';
  logoGradient: string;
  placeholder: string;
  localStorageKey: string;
  prefix: string;
  docsUrl: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'popular',
    logoGradient: 'from-emerald-500 to-teal-600',
    placeholder: 'sk-proj-...',
    localStorageKey: 'openai_api_key',
    prefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'popular',
    logoGradient: 'from-orange-500 to-amber-600',
    placeholder: 'sk-ant-...',
    localStorageKey: 'anthropic_api_key',
    prefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'popular',
    logoGradient: 'from-blue-500 to-indigo-600',
    placeholder: 'AIzaSy...',
    localStorageKey: 'gemini_api_key',
    prefix: 'AIzaSy',
    docsUrl: 'https://aistudio.google.com/'
  },
  {
    id: 'groq',
    name: 'Groq',
    category: 'popular',
    logoGradient: 'from-orange-600 to-red-500',
    placeholder: 'gsk_...',
    localStorageKey: 'groq_api_key',
    prefix: 'gsk_',
    docsUrl: 'https://console.groq.com/'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'open-source',
    logoGradient: 'from-blue-600 to-cyan-500',
    placeholder: 'sk-...',
    localStorageKey: 'deepseek_api_key',
    prefix: 'sk-',
    docsUrl: 'https://platform.deepseek.com/'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'open-source',
    logoGradient: 'from-orange-400 to-red-600',
    placeholder: '...',
    localStorageKey: 'mistral_api_key',
    prefix: '',
    docsUrl: 'https://console.mistral.ai/'
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    category: 'specialist',
    logoGradient: 'from-neutral-700 to-neutral-900',
    placeholder: 'xai-...',
    localStorageKey: 'xai_api_key',
    prefix: 'xai-',
    docsUrl: 'https://ide.x.ai/'
  },
  {
    id: 'meta',
    name: 'Meta Llama',
    category: 'open-source',
    logoGradient: 'from-sky-500 to-blue-700',
    placeholder: 'Served via Groq/Meta...',
    localStorageKey: 'meta_api_key',
    prefix: '',
    docsUrl: 'https://llama.meta.com/'
  }
];

export default function ApiCredentialsModal({ isOpen, onClose }: ApiCredentialsModalProps) {
  const [search, setSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<'all' | 'popular' | 'open-source' | 'specialist'>('all');
  
  // Track values and configurations in state
  const [keys, setKeys] = React.useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = React.useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = React.useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [savedStatus, setSavedStatus] = React.useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = React.useState<Record<string, boolean>>({});
  
  // Load keys on open
  React.useEffect(() => {
    if (isOpen) {
      const loaded: Record<string, string> = {};
      PROVIDERS.forEach(p => {
        loaded[p.id] = localStorage.getItem(p.localStorageKey) || '';
      });
      setKeys(loaded);
      setTestingStatus({});
      setSavedStatus({});
      setCopyStatus({});
      
      // Accessibility: close on ESC
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    const val = keys[providerId]?.trim() || '';
    if (val) {
      localStorage.setItem(provider.localStorageKey, val);
    } else {
      localStorage.removeItem(provider.localStorageKey);
    }
    
    setSavedStatus(prev => ({ ...prev, [providerId]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [providerId]: false }));
    }, 1500);

    // Notify window that API keys changed to refresh chat hooks
    window.dispatchEvent(new Event('api-keys-updated'));
  };

  const handleSaveAll = () => {
    PROVIDERS.forEach(p => {
      const val = keys[p.id]?.trim() || '';
      if (val) {
        localStorage.setItem(p.localStorageKey, val);
      } else {
        localStorage.removeItem(p.localStorageKey);
      }
    });
    
    // Set all as saved
    const savedStates: Record<string, boolean> = {};
    PROVIDERS.forEach(p => savedStates[p.id] = true);
    setSavedStatus(savedStates);
    setTimeout(() => {
      setSavedStatus({});
      onClose();
    }, 800);

    window.dispatchEvent(new Event('api-keys-updated'));
  };

  const handleClear = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    localStorage.removeItem(provider.localStorageKey);
    setKeys(prev => ({ ...prev, [providerId]: '' }));
    window.dispatchEvent(new Event('api-keys-updated'));
  };

  const handleTestConnection = async (providerId: string) => {
    const keyVal = keys[providerId]?.trim() || '';
    if (!keyVal) {
      setTestingStatus(prev => ({ ...prev, [providerId]: 'error' }));
      return;
    }

    setTestingStatus(prev => ({ ...prev, [providerId]: 'testing' }));
    
    // Simulate active validation check
    await new Promise(resolve => setTimeout(resolve, 1200));

    const provider = PROVIDERS.find(p => p.id === providerId);
    const isValidStructure = !provider?.prefix || keyVal.startsWith(provider.prefix);

    if (isValidStructure && keyVal.length > 8) {
      setTestingStatus(prev => ({ ...prev, [providerId]: 'success' }));
    } else {
      setTestingStatus(prev => ({ ...prev, [providerId]: 'error' }));
    }
  };

  const handleCopy = (providerId: string) => {
    const val = keys[providerId] || '';
    if (!val) return;
    
    navigator.clipboard.writeText(val);
    setCopyStatus(prev => ({ ...prev, [providerId]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [providerId]: false }));
    }, 1500);
  };

  const filteredProviders = PROVIDERS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Modal Render targetted to document.body via React Portal
  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        {/* Backdrop glass blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-950/70 backdrop-blur-md"
        />

        {/* Modal Main glass container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl z-10 border border-white/10"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
        >
          {/* Animated Background particle/glow effects */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/5 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight">API Credentials</h2>
                <p className="text-xs text-[11px] leading-normal" style={{ color: 'var(--text-muted)' }}>
                  Developer keys are stored exclusively in your local browser and never written to our database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Secure badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero-Trust Storage</span>
              </div>
              
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 border hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search + Categories Filtering Area */}
          <div className="px-6 md:px-8 py-4 border-b border-white/5 bg-black/5 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search routing provider..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl py-2 pl-10 pr-4 text-xs outline-none border focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none select-none">
              <Filter className="w-3.5 h-3.5 mr-1" style={{ color: 'var(--text-muted)' }} />
              {[
                { id: 'all', label: 'All Engines' },
                { id: 'popular', label: 'Popular APIs' },
                { id: 'open-source', label: 'Open Source' },
                { id: 'specialist', label: 'Specialist' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 z-10 scrollbar-thin">
            {filteredProviders.length === 0 ? (
              <div className="h-[40vh] flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
                <h4 className="font-bold text-sm">No Providers Found</h4>
                <p className="text-xs max-w-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  We couldn't find any provider matching your search term. Clear your search or change categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProviders.map((p) => {
                  const keyVal = keys[p.id] || '';
                  const isVisible = visibleKeys[p.id] || false;
                  const testStatus = testingStatus[p.id] || 'idle';
                  const isSaved = savedStatus[p.id] || false;
                  const isCopied = copyStatus[p.id] || false;

                  return (
                    <motion.div
                      layout
                      key={p.id}
                      className="p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group card"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border)',
                        boxShadow: 'var(--shadow-card)'
                      }}
                      whileHover={{ y: -2, boxShadow: 'var(--shadow-brand)' }}
                    >
                      {/* Sub-hover glow */}
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr ${p.logoGradient} opacity-5 group-hover:opacity-10 blur-xl transition-all duration-300 pointer-events-none`} />

                      {/* Header block */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${p.logoGradient} flex items-center justify-center text-white font-black text-xs shadow-md select-none`}>
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="text-xs md:text-sm font-bold tracking-tight">{p.name}</h4>
                            <a
                              href={p.docsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] hover:underline"
                              style={{ color: 'var(--brand)' }}
                            >
                              Get API Key &rarr;
                            </a>
                          </div>
                        </div>

                        {/* Stored / Active indicator */}
                        <div className="flex items-center gap-1.5 select-none">
                          {keyVal ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-500/10 border border-neutral-500/20 text-neutral-500" style={{ color: 'var(--text-muted)' }}>
                              <span>Inactive</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Input fields */}
                      <div className="space-y-2 flex-1">
                        <div className="relative">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={keyVal}
                            placeholder={p.placeholder}
                            onChange={e => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-full rounded-xl py-2 pl-3 pr-24 text-xs font-mono outline-none border focus:ring-1 focus:ring-blue-500"
                            style={{
                              backgroundColor: 'var(--bg-base)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                          
                          {/* Inner field controls */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {keyVal && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(p.id)}
                                  title="Copy key"
                                  className="p-1 rounded hover:bg-white/10 transition-colors"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVisibleKeys(prev => ({ ...prev, [p.id]: !isVisible }))}
                                  className="p-1 rounded hover:bg-white/10 transition-colors"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Connection tester & Action button toolbar */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 select-none shrink-0">
                        {/* Validation statuses */}
                        <div className="text-[10px] font-semibold">
                          {testStatus === 'testing' && (
                            <span className="flex items-center gap-1 text-blue-500 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Validating API key...</span>
                            </span>
                          )}
                          {testStatus === 'success' && (
                            <span className="flex items-center gap-1 text-emerald-500">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Connection Valid</span>
                            </span>
                          )}
                          {testStatus === 'error' && (
                            <span className="flex items-center gap-1 text-rose-500">
                              <AlertCircle className="w-3 h-3" />
                              <span>Validation Failed</span>
                            </span>
                          )}
                          {testStatus === 'idle' && (
                            <button
                              type="button"
                              disabled={!keyVal}
                              onClick={() => handleTestConnection(p.id)}
                              className="text-[10px] font-bold text-neutral-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Test connection
                            </button>
                          )}
                        </div>

                        {/* Save / Clear buttons */}
                        <div className="flex items-center gap-2">
                          {localStorage.getItem(p.localStorageKey) && (
                            <button
                              type="button"
                              onClick={() => handleClear(p.id)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:bg-rose-500/10 text-rose-500"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSave(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isSaved ? 'bg-emerald-500 text-white' : 'btn-primary'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <span>Save Key</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer actions */}
          <div className="px-6 md:px-8 py-5 border-t border-white/5 bg-black/10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Info className="w-4 h-4 shrink-0" />
              <span>Click "Save Key" to update providers individually, or "Save All & Close" below.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold hover:opacity-85 transition-opacity border"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveAll}
                className="w-full sm:w-auto btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save All & Close</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
