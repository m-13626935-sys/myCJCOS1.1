import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import type { AiSearchResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AiSearchProps {
    onInteraction: () => void;
    onClose: () => void;
    onCircleSearchStart: () => void;
    isProcessingCircleSearch: boolean;
    initialResult: AiSearchResult | null;
}

const CircleSearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M15.5 2.5a.75.75 0 00-1.06-.04l-1.33 1.15a6.5 6.5 0 10-2.16 12.01l1.47-1.02a5 5 0 111.42-9.13l1.58-1.36A.75.75 0 0015.5 2.5z" />
      <path d="M16.25 5a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5V11.5a.75.75 0 001.5 0V8.5H19a.75.75 0 000-1.5h-2.75V5z" />
    </svg>
);


const AiSearch: React.FC<AiSearchProps> = ({ onInteraction, onClose, onCircleSearchStart, isProcessingCircleSearch, initialResult }) => {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<AiSearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (initialResult) {
            setResult(initialResult);
            // Don't set the query, just show the result from the circle search.
            setQuery('');
        }
    }, [initialResult]);

    const handleCloseResults = useCallback(() => {
        setResult(null);
        setError(null);
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }

        if (result || error) {
            closeTimeoutRef.current = window.setTimeout(() => {
                handleCloseResults();
            }, 10000); // 10 seconds
        }

        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [result, error, handleCloseResults]);

    const handleResultPanelMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    };

    const handleResultPanelMouseLeave = () => {
        if (result || error) {
            closeTimeoutRef.current = window.setTimeout(() => {
                handleCloseResults();
            }, 10000); // 10 seconds
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        onInteraction();

        try {
            const res = await geminiService.performAiSearch(query);
            setResult(res);
        } catch (err) {
            console.error("AI Search Error:", err);
            setError(t('ai_search_error'));
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl text-outline">
            <form onSubmit={handleSubmit} className="relative ai-gradient-border rounded-full">
                <input
                    type="text"
                    value={query}
                    onFocus={onInteraction}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onInteraction();
                    }}
                    placeholder={t('ai_search_placeholder')}
                    className="w-full p-4 pl-12 pr-28 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-3xl text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-base shadow-lg ring-1 ring-inset ring-white/30"
                    disabled={isLoading}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline opacity-70 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a1.5 1.5 0 01.837 2.843l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223A1.5 1.5 0 1110 8.5v3a1.5 1.5 0 110-3v-1.5z"></path><path d="M3.34 6.342a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316zm10.32 0a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316z"></path></svg>
                </div>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={onCircleSearchStart}
                        className="light-field-button w-10 h-10 rounded-full"
                        title={t('ai_search_circle_search_title')}
                        aria-label={t('ai_search_circle_search_aria')}
                        disabled={isLoading || isProcessingCircleSearch}
                    >
                        {isProcessingCircleSearch ? (
                             <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <CircleSearchIcon />
                        )}
                    </button>
                    <button
                        type="submit"
                        className="light-field-button w-10 h-10 rounded-full"
                        disabled={isLoading || !query.trim()}
                        aria-label={t('ai_search_button_aria')}
                    >
                   {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                   ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
                   )}
                    </button>
                </div>
            </form>

            {(result || error) && (
                <div
                    onMouseEnter={handleResultPanelMouseEnter}
                    onMouseLeave={handleResultPanelMouseLeave}
                    className="mt-4 bg-black/10 dark:bg-white/10 backdrop-blur-3xl p-4 rounded-2xl ring-1 ring-inset ring-white/30 animate-fade-in-up relative ai-gradient-border">
                    <button
                        onClick={handleCloseResults}
                        className="absolute top-2 right-2 light-field-button w-8 h-8 rounded-full text-xl"
                        aria-label={t('ai_search_close_aria')}
                    >
                        &times;
                    </button>
                    {error && <p className="text-red-400">{error}</p>}
                    {result?.type === 'text' && (
                        <div className="flex flex-col lg:flex-row gap-4 pr-8">
                            {/* Main Content Box */}
                            <div className="flex-grow bg-black/5 dark:bg-white/5 p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                                <p className="whitespace-pre-wrap">{result.text}</p>
                            </div>

                            {/* References Box */}
                            {result.sources.length > 0 && (
                                <div className="w-full lg:w-72 flex-shrink-0 bg-black/5 dark:bg-white/5 p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                                    <h4 className="text-sm font-semibold mb-2">{t('ai_search_references')}</h4>
                                    <ul className="space-y-1 list-disc list-inside">
                                        {result.sources.map((source, i) => source.web?.uri && (
                                            <li key={i} className="text-sm truncate">
                                                <a
                                                    href={source.web.uri}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-outline hover:underline"
                                                    title={source.web.title || source.web.uri}
                                                >
                                                    {source.web.title || source.web.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-center opacity-60 mt-4 pt-2 border-t border-white/20">{t('ai_search_disclaimer')}</p>
                </div>
            )}
        </div>
    );
};

export default AiSearch;