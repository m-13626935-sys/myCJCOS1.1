import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import type { ChatMessage, GroundingChunk } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface GeminiChatAppProps {
  systemInstruction?: string;
  initialMessage?: string;
  placeholder?: string;
  sessionId?: string;
}

const GeminiChatApp: React.FC<GeminiChatAppProps> = ({
  systemInstruction: systemInstructionProp,
  initialMessage: initialMessageProp,
  placeholder: placeholderProp,
  sessionId: sessionIdProp,
}) => {
  const { t } = useLanguage();
  
  const [internalSessionId] = useState(() => sessionIdProp || `generic-chat-${Date.now()}`);
  
  const systemInstructionDefault = systemInstructionProp ?? t('gemini_chat_default_sys');
  const initialMessage = initialMessageProp ?? t('gemini_chat_default_init');

  const historyStorageKey = `chat_history_${internalSessionId}`;

  const [history, setHistory] = useState<ChatMessage[]>(() => {
    if (!internalSessionId) {
        return [{ role: 'model', text: initialMessage }];
    }
    try {
        const savedHistory = localStorage.getItem(historyStorageKey);
        return savedHistory && JSON.parse(savedHistory).length > 0
            ? JSON.parse(savedHistory)
            : [{ role: 'model', text: initialMessage }];
    } catch (e) {
        console.error("Failed to load chat history:", e);
        return [{ role: 'model', text: initialMessage }];
    }
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const placeholder = placeholderProp ?? t('gemini_chat_default_placeholder');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    if (!internalSessionId) return;
    try {
        localStorage.setItem(historyStorageKey, JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
  }, [history, historyStorageKey, internalSessionId]);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const currentHistory = [...history];

    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelResponse: ChatMessage = { role: 'model', text: '' };
    setHistory(prev => [...prev, modelResponse]);

    try {
      const stream = await geminiService.streamChat(internalSessionId, input, [...currentHistory, userMessage], systemInstructionDefault);
      
      let fullText = '';
      let sources: GroundingChunk[] = [];
      for await (const chunk of stream) {
        fullText += chunk.text;
        const chunkSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunkSources && chunkSources.length > 0) {
            sources = chunkSources;
        }

        setHistory(prev => {
          const newHistory = [...prev];
          const lastMessageIndex = newHistory.length - 1;
          const lastMessage = newHistory[lastMessageIndex];

          if (lastMessage && lastMessage.role === 'model') {
            newHistory[lastMessageIndex] = {
              ...lastMessage,
              text: fullText,
              sources: sources,
            };
          }
          return newHistory;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setHistory(prev => {
        const newHistory = [...prev];
        const lastMessage = newHistory[newHistory.length - 1];
        if (lastMessage) {
            lastMessage.text = t('gemini_chat_error_message');
        }
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, history, internalSessionId, systemInstructionDefault, t]);

  return (
    <div className="h-full flex flex-col bg-transparent text-outline -m-4">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xl px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-black/25 dark:bg-blue-800/50 backdrop-blur-lg ring-1 ring-inset ring-white/30' : 'bg-white/20 dark:bg-black/10 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10'}`}
            >
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-outline">{msg.text}</div>
               {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-400/50 dark:border-gray-500/50">
                    <h4 className="text-xs font-bold mb-1">{t('assistant_sources')}</h4>
                    <ul className="list-disc list-inside space-y-1">
                        {msg.sources.map((source, i) => source.web?.uri && (
                            <li key={i} className="text-xs">
                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-outline hover:underline break-all">
                                    {source.web.title || source.web.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && history[history.length - 1]?.role === 'model' && (
            <div className="flex justify-start">
                 <div className="max-w-xl px-4 py-2 rounded-xl bg-white/20 dark:bg-black/10 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="m-4 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-grow p-2 rounded-l-xl bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-r-xl bg-black/20 dark:bg-white/20 text-outline ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150 disabled:bg-black/10 disabled:dark:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default GeminiChatApp;