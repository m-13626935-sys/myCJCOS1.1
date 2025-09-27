import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import type { AppProps } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ImageStudioApp: React.FC<Partial<AppProps>> = ({ setWallpaper }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const generatedUrl = await geminiService.generateImage(prompt);
      setImageUrl(generatedUrl);
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? t(err.message) : t('error_unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col text-outline">
      <form onSubmit={handleSubmit} className="flex items-center mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('image_studio_placeholder')}
          className="flex-grow p-2 rounded-l-xl bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="px-4 py-2 bg-black/20 dark:bg-white/20 text-outline rounded-r-xl ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150 disabled:bg-black/10 disabled:dark:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : t('image_studio_generate')}
        </button>
      </form>
      
      <div className="flex-grow flex items-center justify-center bg-black/5 dark:bg-black/20 rounded-2xl p-2">
        {isLoading && <div className="opacity-70">{t('image_studio_generating')}</div>}
        {error && <div className="text-outline p-4 text-center">{error}</div>}
        {imageUrl && !isLoading && (
            <div className="relative group w-full h-full">
                <img 
                    src={imageUrl} 
                    alt={prompt} 
                    className="w-full h-full object-contain rounded-xl"
                    draggable={false}
                />
                {setWallpaper && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                        <button
                            onClick={() => setWallpaper(imageUrl!)}
                            className="px-4 py-2 text-outline font-semibold bg-black/40 rounded-xl border border-white/50 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
                        >
                            {t('image_studio_set_wallpaper')}
                        </button>
                    </div>
                )}
            </div>
        )}
        {!isLoading && !error && !imageUrl && (
            <div className="text-center opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">{t('image_studio_prompt')}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageStudioApp;