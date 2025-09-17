import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import type { GroundingChunk } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// Manually define types for the Web Speech API to fix TypeScript errors.
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}


// Let TypeScript know about the SpeechRecognition API on the window object.
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface Message {
  by: 'user' | 'assistant' | 'system';
  text: string;
  sources?: GroundingChunk[];
  attachment?: {
    data: string; // base64 encoded data
    mimeType: string;
  };
}

const STORAGE_KEY = 'assistant_app_history';

const MicrophoneIcon = ({ isListening, startAria, stopAria }: { isListening: boolean; startAria: string; stopAria: string; }) => (
    <div className="relative w-20 h-20">
        {isListening && (
            <div className="absolute inset-0 bg-gray-400 dark:bg-blue-400 rounded-full animate-ping opacity-75"></div>
        )}
        <div
            aria-label={isListening ? stopAria : startAria}
            className="relative w-20 h-20 bg-black/20 dark:bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-outline ring-1 ring-inset ring-white/50 dark:ring-black/30 shadow-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-black/50 active:scale-95 active:shadow-inner cursor-pointer"
        >
            {/* Inner gloss effect */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 bg-white/20 rounded-full blur-md"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </div>
    </div>
);


const GoogleAssistantApp: React.FC = () => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [{ by: 'system', text: t('assistant_initial_message') }];
        } catch {
            return [{ by: 'system', text: t('assistant_initial_message') }];
        }
    });
    
    const [textInput, setTextInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachment, setAttachment] = useState<{ data: string; mimeType: string; name: string } | null>(null);
    const [showSummarize, setShowSummarize] = useState(false);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);
    
    useEffect(() => {
        setMessages(prev => {
            if (prev.length <= 1 && (!prev[0] || prev[0].by === 'system')) {
                return [{ by: 'system', text: t('assistant_initial_message') }];
            }
            return prev;
        });
    }, [t]);

    const speak = useCallback((text: string) => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = t('locale_code');
      const voices = speechSynthesis.getVoices();
      // Try to find a voice that matches the language code exactly, then fallback to just the language
      const perfectMatchVoice = voices.find(voice => voice.lang === t('locale_code'));
      const languageMatchVoice = voices.find(voice => voice.lang.startsWith(t('locale_code').split('-')[0]));
      
      if (perfectMatchVoice) {
        utterance.voice = perfectMatchVoice;
      } else if (languageMatchVoice) {
        utterance.voice = languageMatchVoice;
      }
      speechSynthesis.speak(utterance);
    }, [t]);

    const getAssistantResponse = useCallback(async (query: string, fileAttachment: { data: string; mimeType: string; } | null) => {
        setIsLoading(true);
        setError(null);
        try {
            if (fileAttachment) {
                const { text } = await geminiService.generateContentMultiModal(query, fileAttachment);
                setMessages(prev => [...prev, { by: 'assistant', text }]);
                speak(text);
            } else {
                const { text, sources } = await geminiService.groundedSearch(query);
                setMessages(prev => [...prev, { by: 'assistant', text, sources }]);
                speak(text);
            }
        } catch (e) {
            const errorMessage = t('assistant_error_generic');
            setError(errorMessage);
            setMessages(prev => [...prev, { by: 'assistant', text: errorMessage }]);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [speak, t]);

    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            setError(t('assistant_error_unsupported_browser'));
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = t('locale_code');
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error, event.message);
            if (event.error === 'no-speech' || event.error === 'aborted') {
                setIsListening(false);
                return;
            }

            let errorMessage = t('assistant_error_generic');
            const messageLower = (event.message || '').toLowerCase();

            if (event.error === 'not-allowed' || messageLower.includes('permission denied')) {
                errorMessage = t('assistant_error_mic_permission');
            } else if (event.error === 'audio-capture' || messageLower.includes('device not found') || messageLower.includes('failed to start')) {
                errorMessage = t('assistant_error_mic_not_found');
            }
            
            setError(errorMessage);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                const userMessage: Message = { by: 'user', text: transcript };
                setMessages(prev => [...prev, userMessage]);
                getAssistantResponse(transcript, null);
            }
        };

        recognitionRef.current = recognition;
        
        return () => {
          recognition.abort();
          speechSynthesis.cancel();
        };

    }, [SpeechRecognitionAPI, getAssistantResponse, t]);

    const handleListen = async () => {
        if (isLoading || !recognitionRef.current) return;
        speechSynthesis.cancel();
        setTextInput('');

        if (isListening) {
            recognitionRef.current.stop();
            return;
        }

        // Proactive check
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                setError(t('assistant_error_unsupported_browser'));
                return;
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMic = devices.some(device => device.kind === 'audioinput');
            if (!hasMic) {
                setError(t('assistant_error_mic_not_found'));
                return;
            }
            setError(null);
            recognitionRef.current.start();
        } catch (err) {
            console.error("Error checking for microphone:", err);
            if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                setError(t('assistant_error_mic_permission'));
            } else {
                setError(t('assistant_error_mic_generic'));
            }
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = textInput.trim();
        if ((!query && !attachment) || isLoading) return;

        setShowSummarize(false);
        speechSynthesis.cancel();
        if (isListening) {
            recognitionRef.current?.abort();
        }

        const userMessage: Message = { by: 'user', text: query };
        if (attachment) {
            userMessage.attachment = { data: attachment.data, mimeType: attachment.mimeType };
        }
        
        setMessages(prev => [...prev, userMessage]);
        setTextInput('');
        
        await getAssistantResponse(query, attachment);
        setAttachment(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          setError(t('assistant_error_file_too_large'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64String = result.substring(result.indexOf(',') + 1);
          setAttachment({
            data: base64String,
            mimeType: file.type,
            name: file.name,
          });
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input
      }
    };

    const handleSummarize = async () => {
        const textToSummarize = textInput.trim();
        if (!textToSummarize || isLoading) return;

        if (isListening) {
            recognitionRef.current?.abort();
        }

        setShowSummarize(false);
        setTextInput('');

        const userMessage: Message = { by: 'user', text: `${t('assistant_summarize_action_prefix')}: "${textToSummarize.substring(0, 30)}..."` };
        setMessages(prev => [...prev, userMessage]);
        
        setIsLoading(true);
        setError(null);
        try {
            const { text } = await geminiService.summarizeText(textToSummarize);
            setMessages(prev => [...prev, { by: 'assistant', text }]);
            speak(text);
        } catch (e) {
            const errorMessage = t('assistant_error_generic');
            setError(errorMessage);
            setMessages(prev => [...prev, { by: 'assistant', text: errorMessage }]);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent text-outline">
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.by === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-lg shadow ${msg.by === 'user' ? 'bg-black/25 dark:bg-blue-800/50 backdrop-blur-lg ring-1 ring-inset ring-white/30' : 'bg-white/20 dark:bg-black/10 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10'}`}>
                            {msg.attachment && (
                                <div className="mb-2">
                                    {msg.attachment.mimeType.startsWith('image/') ? (
                                        <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} alt="User upload" className="max-h-48 rounded-md"/>
                                    ) : (
                                        <video src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} controls className="max-h-48 rounded-md w-full" />
                                    )}
                                </div>
                            )}
                            {msg.text && <div className="prose prose-sm max-w-none whitespace-pre-wrap text-outline">{msg.text}</div>}
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
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-xl p-3 rounded-lg bg-white/15 dark:bg-black/20 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    </div>
                )}
                 {error && (
                    <div className="text-center text-outline text-sm p-2 bg-red-500/20 rounded-lg">{error}</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="pt-4 flex-shrink-0 flex flex-col space-y-4">
                {attachment && (
                    <div className="px-2 relative self-start">
                        <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm">
                            {attachment.mimeType.startsWith('image/') ? (
                                <img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt={attachment.name} className="max-h-24 rounded-md"/>
                            ) : (
                                <div className="flex items-center space-x-2 p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a2 2 0 010 3.24l-4.55 3.76M3 6h12a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
                                    <span className="text-sm truncate max-w-[200px]">{attachment.name}</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg" aria-label="Remove attachment">&times;</button>
                    </div>
                )}
                {showSummarize && (
                    <div className="px-2">
                        <button 
                            onClick={handleSummarize}
                            className="w-full px-4 py-2 text-sm bg-blue-500/50 text-outline rounded-md ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-blue-500/70 active:shadow-inner active:scale-95 transition-all duration-150"
                        >
                            {t('assistant_summarize_button')}
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center px-2">
                    <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={handleFileChange} />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 mr-2 rounded-md bg-black/20 dark:bg-white/20 text-outline ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150"
                        aria-label={t('assistant_attach_file_aria')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input
                        type="text"
                        value={textInput}
                        onPaste={(e) => {
                            const pastedText = e.clipboardData.getData('text');
                            if (pastedText.length > 200) {
                                setShowSummarize(true);
                            }
                        }}
                        onChange={(e) => {
                            setTextInput(e.target.value);
                            if (e.target.value.length < 200) {
                                setShowSummarize(false);
                            } else {
                                setShowSummarize(true);
                            }
                        }}
                        placeholder={t('assistant_placeholder')}
                        className="flex-grow p-2 rounded-l-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
                        disabled={isLoading || isListening}
                    />
                    <button
                        type="submit"
                        disabled={isLoading && (!textInput.trim() && !attachment)}
                        className="p-2 rounded-r-md bg-black/20 dark:bg-white/20 text-outline ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150 disabled:bg-black/10 disabled:dark:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
                        aria-label={t('assistant_submit_aria')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
                <div className="flex flex-col items-center justify-center" onClick={handleListen}>
                    <MicrophoneIcon isListening={isListening} startAria={t('assistant_aria_start_listening')} stopAria={t('assistant_aria_stop_listening')} />
                    <p className="text-sm opacity-70 mt-3">
                        {isListening ? t('assistant_listening') : (isLoading ? t('assistant_thinking') : t('assistant_mic_prompt'))}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GoogleAssistantApp;
