import React from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
}

export default function StreamingText({ text, isStreaming = false }: StreamingTextProps) {
  return (
    <div className="relative inline">
      <span className="whitespace-pre-wrap">{text}</span>
      {isStreaming && (
        <span className="w-2 h-4 bg-brand-500 inline-block animate-pulse ml-1 rounded-sm align-middle" />
      )}
    </div>
  );
}
