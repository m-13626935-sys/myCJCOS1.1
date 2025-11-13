import React, { useState, useEffect, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { extractPaletteFromImage, generateThemeFromPalette } from '../services/themeService';
import type { AppProps, ThemeColors } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ImageStudioApp: React.FC<Partial<AppProps>> = ({ setWallpaper, setThemeColors, setInspirationalCopy, close }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingExtras, setIsGeneratingExtras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<[number, number, number][]>([]);
  const [generatedTheme, setGeneratedTheme] = useState<ThemeColors | null>(null);
  const [inspirationalCopy, setCopy] = useState<string | null>(null);

  const loadingMessages = useMemo(() => [
    t('image_studio_generating'),
    t('image_studio_loading_1'),
    t('image_studio_loading_2'),
    t('image_studio_loading_3'),
  ], [t]);
  
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (isLoading) {
      let i = 0;
      setLoadingMessage(loadingMessages[0]); // Reset on start
      const interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading, loadingMessages]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    setPalette([]);
    setGeneratedTheme(null);
    setCopy(null);

    try {
      const generatedUrl = await geminiService.generateImage(prompt);
      setImageUrl(generatedUrl);
      setIsLoading(false); // Stop main loader, start secondary
      
      setIsGeneratingExtras(true);
      const [extractedPalette, copy] = await Promise.all([
          extractPaletteFromImage(generatedUrl),
          geminiService.generateInspirationalCopy({ data: generatedUrl.split(',')[1], mimeType: 'image/jpeg' })
      ]);

      setPalette(extractedPalette);
      setGeneratedTheme(generateThemeFromPalette(extractedPalette));
      setCopy(copy);

    } catch (err) {
      console.error('Image Studio error:', err);
      setError(err instanceof Error ? t(err.message) : t('error_unknown'));
      setIsLoading(false);
    } finally {
      setIsGeneratingExtras(false);
    }
  };
  
  const handleApplyThemeAndWallpaper = () => {
    if (imageUrl && generatedTheme && setWallpaper && setThemeColors && close && inspirationalCopy && setInspirationalCopy) {
        setWallpaper(imageUrl);
        setThemeColors(generatedTheme);
        setInspirationalCopy(inspirationalCopy);
        close();
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
      
      <div className="flex-grow flex items-center justify-center bg-black/5 dark:bg-black/20 rounded-2xl p-2 mb-4">
        {isLoading && <div className="opacity-70 transition-opacity duration-500 text-center">{loadingMessage}</div>}
        {error && <div className="text-outline p-4 text-center">{error}</div>}
        {imageUrl && !isLoading && (
            <div className="relative group w-full h-full">
                <img 
                    src={imageUrl} 
                    alt={prompt} 
                    className="w-full h-full object-contain rounded-xl"
                    draggable={false}
                />
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

       {!isLoading && (palette.length > 0 || inspirationalCopy) && (
        <div className="flex-shrink-0 animate-fade-in">
             <div className="space-y-3">
                 {palette.length > 0 && (
                    <div>
                         <h2 className="text-lg font-semibold mb-2 text-center">{t('theme_studio_palette')}</h2>
                         <div className="flex justify-center items-center gap-2 p-2 bg-black/5 dark:bg-black/20 rounded-xl">
                             {palette.map((rgb, i) => (
                                <div key={i} className="w-8 h-8 rounded-full shadow-md" style={{ backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` }} />
                             ))}
                         </div>
                    </div>
                 )}
                {isGeneratingExtras ? (
                     <div className="text-center text-sm opacity-70 animate-pulse">Generating theme...</div>
                ) : inspirationalCopy && (
                    <blockquote className="my-2 italic text-sm opacity-90 text-center">
                        <p>"{inspirationalCopy}"</p>
                    </blockquote>
                )}
             </div>
             <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={handleApplyThemeAndWallpaper}
                    disabled={!generatedTheme || !inspirationalCopy}
                    className="w-full light-field-button py-3 text-base font-semibold disabled:opacity-50"
                >
                    設为壁纸
                </button>
             </div>
        </div>
      )}
    </div>
  );
};

export default ImageStudioApp;