// EnglishDictionaryApp.tsx
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import type { EnglishDictionaryEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const STORAGE_KEY = 'english_dictionary_last_state';

interface DictionaryState {
    query: string;
    result: EnglishDictionaryEntry | null;
    isEasterEgg: boolean;
    error: string | null;
}

const initialState: DictionaryState = {
    query: '',
    result: null,
    isEasterEgg: false,
    error: null,
};


const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
        <h3 className="text-sm font-semibold opacity-70 mb-2 tracking-wider uppercase">{title}</h3>
        {children}
    </div>
);

// 彩蛋名字列表（不区分大小写）
const EASTER_EGG_NAMES = [
    'chung jia cheng',
    'poo yi xuan',
    'brandon wong zu le',
    'carson john ahoi',
    'chai zhuo sheng',
    'go hao ze',
    'lin pei qi',
    'soo jia yang',
    'yim fu xing'
];

const EnglishDictionaryApp: React.FC = () => {
    const { t } = useLanguage();
    const [state, setState] = useState<DictionaryState>(() => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            return savedState ? JSON.parse(savedState) : initialState;
        } catch (e) {
            return initialState;
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const { query, result, isEasterEgg, error } = state;

     useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save dictionary state:", e);
        }
    }, [state]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setState(s => ({ ...s, error: null, result: null, isEasterEgg: false }));

        try {
            const normalizedQuery = query.trim().toLowerCase();
            if (EASTER_EGG_NAMES.includes(normalizedQuery)) {
                setState(s => ({ ...s, isEasterEgg: true }));
            } else {
                const data = await geminiService.getEnglishDictionaryEntry(normalizedQuery);
                setState(s => ({ ...s, result: data, isEasterEgg: false }));
            }
        } catch (err) {
            console.error('English Dictionary error:', err);
            const errorMessage = err instanceof Error ? t(err.message) : t('dictionary_error_unknown');
            setState(s => ({ ...s, error: errorMessage }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dataString = e.dataTransfer.getData('application/cjc-os-item');
        if (dataString) {
            try {
                const data = JSON.parse(dataString);
                if (data.type === 'text' && typeof data.content === 'string') {
                    setState(s => ({ ...s, query: s.query ? `${s.query} ${data.content}` : data.content }));
                }
            } catch (err) { console.error("Drop error:", err); }
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent text-outline">
            <header className="flex-shrink-0 mb-4">
                <form onSubmit={handleSearch} className="flex">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setState(s => ({ ...s, query: e.target.value }))}
                        placeholder={t('dictionary_placeholder_english')}
                        className="flex-grow p-3 text-lg rounded-l-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
                        disabled={isLoading}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="w-16 flex items-center justify-center rounded-r-md bg-black/20 dark:bg-white/20 text-outline ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150 disabled:bg-black/10 disabled:dark:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
                        aria-label={t('dictionary_search_aria')}
                    >
                        {isLoading ? (
                           <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                           <SearchIcon />
                        )}
                    </button>
                </form>
            </header>

            <main className="flex-grow overflow-y-auto pr-2 -mr-4 pb-2">
                {error && <div className="text-center p-4 bg-red-500/20 text-outline rounded-lg">{error}</div>}
                
                {!isLoading && !result && !error && !isEasterEgg && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-outline opacity-70">
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 opacity-20" viewBox="0 0 24 24" fill="currentColor"><path d="M4,9H7V4H4V9M10.5,4V9H13.5V4H10.5M4,15H7V20H4V15M17,11.25L13.5,15V20H10.5V15L7,11.25V10H17V11.25M17,4V9H20V4H17Z" /></svg>
                        <h2 className="text-xl font-semibold mt-4">{t('dictionary_initial_title_english')}</h2>
                        <p className="mt-1">{t('dictionary_initial_subtitle_english')}</p>
                    </div>
                )}
                
                {isLoading && (
                   <div className="space-y-4 animate-pulse">
                        <div className="h-16 bg-black/5 dark:bg-white/5 rounded-lg"></div>
                        <div className="h-24 bg-black/5 dark:bg-white/5 rounded-lg"></div>
                        <div className="h-32 bg-black/5 dark:bg-white/5 rounded-lg"></div>
                        <div className="h-20 bg-black/5 dark:bg-white/5 rounded-lg"></div>
                   </div>
                )}

                {/* 彩蛋显示区域 */}
                {isEasterEgg && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-8 rounded-2xl backdrop-blur-md ring-1 ring-white/30 dark:ring-black/30 max-w-md w-full">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-pulse">
                                {t('dictionary_easter_egg')}
                            </div>
                        </div>
                    </div>
                )}

                {result && !isEasterEgg && (
                    <div className="space-y-4">
                        <div className="text-center py-4">
                            <h1 className="text-5xl font-bold">{result.word}</h1>
                            <p className="text-xl opacity-70 mt-2 font-mono">/{result.ipa}/</p>
                        </div>
                        
                        <Section title={t('dictionary_section_definition')}>
                            <p className="text-base">{result.definition}</p>
                        </Section>

                        {result.exampleSentences?.length > 0 && (
                            <Section title={t('dictionary_section_examples')}>
                                <ul className="space-y-2 list-disc list-inside">
                                    {result.exampleSentences.map((sentence, index) => (
                                        <li key={index} className="italic">"{sentence}"</li>
                                    ))}
                                </ul>
                            </Section>
                        )}
                        
                        {result.wordForms?.length > 0 && (
                            <Section title={t('dictionary_section_word_forms')}>
                                <div className="flex flex-wrap gap-2">
                                    {result.wordForms.map((form, index) => (
                                        <span key={index} className="bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full text-sm">
                                            {form}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {result.etymology && (
                            <Section title={t('dictionary_section_etymology')}>
                                <p className="text-base leading-relaxed">{result.etymology}</p>
                            </Section>
                        )}
                        
                        {(result.synonyms?.length > 0 || result.antonyms?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.synonyms?.length > 0 && (
                                     <Section title={t('dictionary_section_synonyms')}>
                                        <div className="flex flex-wrap gap-2">
                                            {result.synonyms.map((word, index) => (
                                                <span key={index} className="bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full text-sm">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </Section>
                                )}
                               {result.antonyms?.length > 0 && (
                                     <Section title={t('dictionary_section_antonyms')}>
                                        <div className="flex flex-wrap gap-2">
                                            {result.antonyms.map((word, index) => (
                                                <span key={index} className="bg-red-100 dark:bg-red-900/50 px-3 py-1 rounded-full text-sm">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </Section>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default EnglishDictionaryApp;