import React, { useState } from 'react';
import type { Language } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SetupScreenProps {
  onSetupComplete: (name: string) => void;
  wallpaperUrl: string;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete, wallpaperUrl }) => {
  const { t, setLanguage } = useLanguage();
  const [step, setStep] = useState<'language' | 'name'>('language');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSetupComplete(name.trim());
    } else {
      setError(t('setup_name_error'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setStep('name');
  };

  // Language options are hard-coded in their native names for universal understanding
  const languageOptions: { code: Language; name: string }[] = [
    { code: 'zh', name: '中文 (简体)' },
    { code: 'en', name: 'English' },
    { code: 'ms', name: 'Bahasa Melayu' },
  ];

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center bg-cover bg-center text-outline p-4 transition-opacity duration-500"
      style={{ backgroundImage: `url('${wallpaperUrl}')` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl z-0"></div>

      {step === 'language' && (
        <div className="z-10 w-full max-w-md text-center">
            <div className="bg-white/15 dark:bg-black/15 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl border border-white/20 animate-fade-in">
                <div className="mb-2 space-y-1">
                    <h1 className="text-4xl font-bold text-outline">选择您的语言</h1>
                    <h2 className="text-3xl font-semibold text-outline opacity-95">Select Your Language</h2>
                    <h2 className="text-3xl font-semibold text-outline opacity-95">Pilih Bahasa Anda</h2>
                </div>
                <div className="text-lg opacity-80 mb-8 space-y-0.5">
                    <p>为系统选择您的首选语言。</p>
                    <p>Choose your preferred language for the system.</p>
                    <p>Pilih bahasa pilihan anda untuk sistem.</p>
                </div>
                <div className="flex flex-col space-y-4">
                    {languageOptions.map(opt => (
                        <button
                            key={opt.code}
                            onClick={() => handleLanguageSelect(opt.code)}
                            className="w-full py-4 text-lg font-semibold bg-black/20 dark:bg-white/10 backdrop-blur-md text-outline rounded-xl shadow-lg ring-1 ring-inset ring-white/30 hover:bg-white/20 dark:hover:bg-black/30 hover:-translate-y-1 transform transition-all duration-200"
                        >
                            {opt.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {step === 'name' && (
        <div className="z-10 w-full max-w-md text-center">
            <div className="bg-white/15 dark:bg-black/15 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl border border-white/20 animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 text-outline">{t('setup_welcome_title')}</h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 text-outline">{t('setup_welcome_subtitle')}</p>
                <form onSubmit={handleNameSubmit} className="w-full">
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-4 mb-4 rounded-xl bg-black/20 dark:bg-white/10 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-xl shadow-lg ring-1 ring-inset ring-white/30"
                            placeholder={t('setup_name_placeholder')}
                            autoFocus
                        />
                         {error && <p className="absolute -bottom-1 left-0 right-0 text-center text-sm text-red-400 animate-pulse">{error}</p>}
                    </div>
                    
                    <div>
                        <button
                          type="submit"
                          disabled={!name.trim()}
                          className="w-full mt-2 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 active:shadow-inner active:translate-y-0 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-2 text-lg font-semibold"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                          <span>{t('setup_submit_button')}</span>
                        </button>
                        <p className="text-xs opacity-70 mt-6">{t('setup_terms_hint')}</p>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;