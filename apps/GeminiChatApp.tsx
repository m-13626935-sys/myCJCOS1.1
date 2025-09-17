import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// Fix: Make props optional to allow for default translated values and generic launch.
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

  // Fix: Provide a stable, unique session ID if one isn't passed to ensure history is saved correctly.
  const [internalSessionId] = useState(() => sessionIdProp || `generic-chat-${Date.now()}`);
  
  // Fix: Use translated strings for default prop values instead of hardcoded Chinese.
  const systemInstruction = systemInstructionProp ?? t('gemini_chat_default_sys');
  const initialMessage = initialMessageProp ?? t('gemini_chat_default_init');
  const placeholder = placeholderProp ?? t('gemini_chat_default_placeholder');

  const historyStorageKey = `chat_history_${internalSessionId}`;

  const [history, setHistory] = useState<ChatMessage[]>(() => {
    if (!internalSessionId) {
        return [{ role: 'model', text: initialMessage }];
    }
    try {
        const savedHistory = localStorage.getItem(historyStorageKey);
        // Only restore if there's content, otherwise start fresh
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
    const currentHistory = [...history]; // Capture history before state updates

    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelResponse: ChatMessage = { role: 'model', text: '' };
    setHistory(prev => [...prev, modelResponse]);

    try {
      // Pass the history that includes the new user message, as our service is designed to handle it
      const stream = await geminiService.streamChat(internalSessionId, input, [...currentHistory, userMessage], systemInstruction);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text;
        setHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            lastMessage.text = fullText;
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
            // Fix: Use translated error message
            lastMessage.text = t('gemini_chat_error_message');
        }
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, history, internalSessionId, systemInstruction, t]);

  return (
    <div className="h-full flex flex-col bg-transparent text-outline">
      <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xl px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-black/25 dark:bg-blue-800/50 backdrop-blur-lg ring-1 ring-inset ring-white/30' : 'bg-white/20 dark:bg-black/10 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10'} ${!!msg.text ? 'cursor-grab' : ''}`}
              draggable={!!msg.text}
              onDragStart={(e) => {
                  if (!msg.text) return;
                  const data = { type: 'text', content: msg.text };
                  e.dataTransfer.setData('application/cjc-os-item', JSON.stringify(data));
                  e.dataTransfer.effectAllowed = 'copy';
                  e.stopPropagation(); 
              }}
            >
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-outline">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && history[history.length-1]?.role === 'model' && (
            <div className="flex justify-start">
                 <div className="max-w-xl px-4 py-2 rounded-lg bg-white/20 dark:bg-black/10 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10">
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
      <form onSubmit={handleSubmit} className="mt-4 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-grow p-2 rounded-l-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-r-md bg-black/20 dark:bg-white/20 text-outline ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150 disabled:bg-black/10 disabled:dark:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
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
