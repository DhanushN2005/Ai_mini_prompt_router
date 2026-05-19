import { useState } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  isStreaming?: boolean;
  isError?: boolean;
}

export function useSSE(botId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [totalTokensSession, setTotalTokensSession] = useState(0);

  const clearHistory = () => {
    setMessages([]);
    setTotalTokensSession(0);
    localStorage.removeItem(`chat_history_${botId}`);
  };

  const loadHistory = () => {
    const localHistory = localStorage.getItem(`chat_history_${botId}`);
    if (localHistory) {
      try {
        const parsed = JSON.parse(localHistory) as Message[];
        setMessages(parsed);
        const tokens = parsed.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
        setTotalTokensSession(tokens);
      } catch {
        setMessages([]);
        setTotalTokensSession(0);
      }
    } else {
      setMessages([]);
      setTotalTokensSession(0);
    }
  };

  const sendPrompt = async (userPrompt: string, botProvider: string, botModel: string) => {
    if (!userPrompt.trim() || isAiResponding) return;

    setErrorMessage('');
    setIsAiResponding(true);

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', text: userPrompt }
    ];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_history_${botId}`, JSON.stringify(updatedMessages));

    const assistantPlaceholder: Message = {
      role: 'assistant',
      text: '',
      provider: botProvider,
      model: botModel,
      tokensUsed: 0,
      isStreaming: true
    };
    
    const streamingMessages = [...updatedMessages, assistantPlaceholder];
    setMessages(streamingMessages);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const token = localStorage.getItem('token');

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_id: botId,
          prompt: userPrompt,
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream is not supported by this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let aiResponseText = '';
      let meta: { provider?: string; model?: string; tokens_used?: number } | null = null;
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            if (data.token) {
              aiResponseText += data.token;
              setMessages([
                ...updatedMessages,
                {
                  role: 'assistant',
                  text: aiResponseText,
                  provider: botProvider,
                  model: botModel,
                  tokensUsed: 0,
                  isStreaming: true
                }
              ]);
            } else if (data.metadata) {
              meta = data.metadata;
            } else if (data.error) {
              // Show error INSIDE the assistant bubble — do not discard it
              const errorText = data.error as string;
              setIsAiResponding(false);
              setMessages([
                ...updatedMessages,
                {
                  role: 'assistant',
                  text: errorText,
                  provider: botProvider,
                  model: botModel,
                  tokensUsed: 0,
                  isError: true
                }
              ]);
              return;
            }
          } catch (e) {
            // Only log genuine JSON parse failures, not our intentional returns
            if (e instanceof SyntaxError) {
              console.error('Failed to parse SSE event frame:', line, e);
            }
          }
        }
      }

      setIsAiResponding(false);
      const finalTokens = meta?.tokens_used || Math.round(aiResponseText.length / 4);
      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          role: 'assistant',
          text: aiResponseText,
          provider: meta?.provider || botProvider,
          model: meta?.model || botModel,
          tokensUsed: finalTokens
        }
      ];

      setMessages(finalMessages);
      localStorage.setItem(`chat_history_${botId}`, JSON.stringify(finalMessages));
      setTotalTokensSession((prev) => prev + finalTokens);

    } catch (error: any) {
      console.error(error);
      setIsAiResponding(false);
      // Display the error inside the assistant bubble instead of discarding it
      const errText = error.message || 'AI Gateway execution failed.';
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          text: errText,
          provider: botProvider,
          model: botModel,
          tokensUsed: 0,
          isError: true
        }
      ]);
    }
  };

  return {
    messages,
    setMessages,
    isAiResponding,
    errorMessage,
    setErrorMessage,
    totalTokensSession,
    setTotalTokensSession,
    sendPrompt,
    clearHistory,
    loadHistory
  };
}
