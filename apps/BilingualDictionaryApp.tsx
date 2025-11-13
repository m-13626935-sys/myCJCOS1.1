import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import type { BilingualDictionaryEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const STORAGE_KEY = 'bilingual_dictionary_last_state';

interface DictionaryState {
    query: string;
    result: BilingualDictionaryEntry | null;
    easterEggMessage: string | null;
    error: string | null;
}

const initialState: DictionaryState = {
    query: '',
    result: null,
    easterEggMessage: null,
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

const EASTER_EGG_MESSAGES: Record<string, string> = {
    // Chinese Names
    '郑家诚': 'Gemini AI 虚构 OS 作者郑家诚生日快乐！',
    '浦宜璇': '浦宜璇生日快乐！',
    '黄祖乐': '黄祖乐生日快乐！',
    '嘉胜': '嘉胜生日快乐！',
    '蔡卓昇': '蔡卓昇生日快乐！',
    '吴昊泽': '吴昊泽生日快乐！',
    '凌珮淇': '凌珮淇生日快乐！',
    '苏家扬': '苏家扬生日快乐！',
    '严富城': '严富城生日快乐！',
    // English/Pinyin Names
    'chung jia cheng': 'Gemini AI 虚构 OS 作者郑家诚生日快乐！',
    'poo yi xuan': '浦宜璇生日快乐！',
    'brandon wong zu le': '黄祖乐生日快乐！',
    'carson john ahoi': '嘉胜生日快乐！',
    'chai zhuo sheng': '蔡卓昇生日快乐！',
    'go hao ze': '吴昊泽生日快乐！',
    'lin pei qi': '凌珮淇生日快乐！',
    'soo jia yang': '苏家扬生日快乐！',
    'yim fu xing': '严富城生日快乐！'
};

const BilingualDictionaryApp: React.FC = () => {
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
    const { query, result, easterEggMessage, error } = state;

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
        setState(s => ({ ...s, error: null, result: null, easterEggMessage: null }));

        try {
            const normalizedQuery = query.trim().toLowerCase();
            const message = EASTER_EGG_MESSAGES[normalizedQuery];
            if (message) {
                setState(s => ({ ...s, easterEggMessage: message }));
            } else {
                // FIX: 'getBilingualDictionaryEntry' does not exist.
                // Instead, detect if the query is Chinese and call the appropriate dictionary service.
                const isChinese = /[\u4e00-\u9fa5]/.test(normalizedQuery);
                const data = await (isChinese
                    ? geminiService.getChineseDictionaryEntry(normalizedQuery)
                    : geminiService.getEnglishDictionaryEntry(normalizedQuery));
                setState(s => ({ ...s, result: data, easterEggMessage: null }));
            }
        } catch (err) {
            console.error('Bilingual Dictionary error:', err);
            const errorMessage = err instanceof Error ? t(err.message) : t('dictionary_error_unknown');
            setState(s => ({ ...s, error: errorMessage }));
        } finally {
            setIsLoading(false);
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
                        placeholder={t('dictionary_placeholder_bilingual')}
                        className="flex-grow p-3 text-lg rounded-l-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
                        disabled={isLoading}
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
                
                {!isLoading && !result && !error && !easterEggMessage && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-outline opacity-70">
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 opacity-20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.78 2.22a2.5 2.5 0 0 0-3.54 0L3.53 14.93a2.5 2.5 0 0 0 0 3.54l5.66 5.66a2.5 2.5 0 0 0 3.54 0L21.41 12.3a1 1 0 0 0 0-1.42L12.7 2.17a1 1 0 0 0-1.41 0L3.06 10.4a1 1 0 0 0 0 1.41L11.29 20a1 1 0 0 0 1.42 0l8.22-8.23a1 1 0 0 0 0-1.41L12.7 2.17" /></svg>
                        <h2 className="text-xl font-semibold mt-4">{t('dictionary_initial_title_bilingual')}</h2>
                        <p className="mt-1">{t('dictionary_initial_subtitle_bilingual')}</p>
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

                {easterEggMessage && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-8 rounded-2xl backdrop-blur-md ring-1 ring-white/30 dark:ring-black/30 max-w-md w-full">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-pulse">
                                {easterEggMessage}
                            </div>
                        </div>
                    </div>
                )}

                {result && !easterEggMessage && (
                    <div className="space-y-4">
                        <div className="text-center py-4">
                            <h1 className="text-5xl font-bold">{result.word}</h1>
                            <p className="text-xl opacity-70 mt-2 font-mono">{result.pronunciation}</p>
                        </div>
                        
                        <Section title={result.language === 'zh' ? '中文释义 (Primary)' : 'English Definition (Primary)'}>
                            <p className="text-base">{result.primaryDefinition}</p>
                        </Section>

                        <Section title={result.language === 'zh' ? 'English Definition (Secondary)' : '中文释义 (Secondary)'}>
                            <p className="text-base">{result.secondaryDefinition}</p>
                        </Section>

                        {result.examples?.length > 0 && (
                            <Section title={t('dictionary_section_examples')}>
                                 <div className="space-y-3">
                                    {result.examples.map((item, index) => (
                                        <div key={index} className="border-l-2 border-black/20 dark:border-white/20 pl-3">
                                            <p className="text-base italic">"{item.original}"</p>
                                            <p className="text-base italic text-outline/80">"{item.translation}"</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                        
                        {result.etymology && (
                            <Section title={t('dictionary_section_etymology')}>
                                 <p className="text-base leading-relaxed">{result.etymology}</p>
                            </Section>
                        )}
                        
                        {result.relatedWords && result.relatedWords.length > 0 && (
                             <Section title={t('dictionary_section_related')}>
                                <div className="flex flex-wrap gap-2">
                                    {result.relatedWords.map((word, index) => (
                                        <span key={index} className="bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full text-sm">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default BilingualDictionaryApp;