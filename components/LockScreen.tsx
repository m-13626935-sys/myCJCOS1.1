
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LockScreenProps {
  onUnlockSuccess: () => void;
  wallpaperUrl: string;
  userName: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlockSuccess, wallpaperUrl, userName }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleUnlock = () => {
    const savedPassword = localStorage.getItem('cjc5_password') || '1234';
    if (password === savedPassword) {
      setIsUnlocking(true);
      setTimeout(() => {
        onUnlockSuccess();
      }, 500); // Unlock animation time
    } else {
      setError(t('lockscreen_password_error'));
      setPassword('');
      setTimeout(() => setError(''), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  const formatTime = () => {
    return date.toLocaleTimeString(t('locale_code'), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = () => {
    return date.toLocaleDateString(t('locale_code'), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`h-screen w-screen flex items-center justify-center bg-cover bg-center relative overflow-hidden transition-opacity duration-500 ${isUnlocking ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundImage: `url('${wallpaperUrl}')` }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xl z-0"></div>
      
      <div className="z-10 flex flex-col items-center justify-center text-outline px-6 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-7xl font-light tracking-wide mb-2">
            {formatTime()}
          </div>
          <div className="text-xl font-medium opacity-90">
            {formatDate()}
          </div>
        </div>
        
        <div className="w-full bg-white/10 dark:bg-black/15 backdrop-blur-3xl rounded-2xl p-6 ring-1 ring-white/20 dark:ring-black/30 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">{t('document_title', { name: userName })}</h1>
            <p className="opacity-80">{t('lockscreen_enter_password')}</p>
          </div>
          
          <div className="mb-4 flex flex-col gap-4">
            <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full p-4 rounded-xl bg-black/20 dark:bg-white/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-xl tracking-widest"
                  placeholder="••••"
                  autoFocus
                />
                {error && (
                  <p className="absolute -bottom-6 left-0 right-0 text-center text-sm text-red-400 animate-pulse">
                    {error}
                  </p>
                )}
            </div>
          </div>
          
          <button
            onClick={handleUnlock}
            className="w-full py-3 bg-white/20 dark:bg-black/20 backdrop-blur-lg text-outline rounded-xl ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-white/30 dark:hover:bg-black/30 active:shadow-inner active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            {t('lockscreen_unlock')}
          </button>
        </div>
        
        <p className="mt-8 text-sm opacity-70 text-center max-w-xs">
          {t('lockscreen_password_hint')}
        </p>
      </div>
    </div>
  );
};

export default LockScreen;
