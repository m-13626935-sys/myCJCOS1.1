
import React, { useState, useRef, useEffect } from 'react';
import type { AppProps, Language, TimeFormat, ColorMode, GradientConfig, ButtonBackground } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const SectionHeader: React.FC<{ title: string, previewStyle?: React.CSSProperties }> = ({ title, previewStyle }) => (
    <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold opacity-70 tracking-wider uppercase">{title}</h3>
        {previewStyle && (
            <div className="w-8 h-5 rounded-sm ring-1 ring-inset ring-white/20" style={previewStyle}></div>
        )}
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode, disabled?: boolean, previewStyle?: React.CSSProperties }> = ({ title, children, disabled = false, previewStyle }) => (
    <div className={`bg-white/5 dark:bg-black/10 backdrop-blur-md p-4 rounded-2xl mb-4 ring-1 ring-black/10 dark:ring-white/10 shadow-lg transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <SectionHeader title={title} previewStyle={previewStyle} />
        {children}
    </div>
);

const GradientPicker: React.FC<{
    gradient: GradientConfig;
    onGradientChange: (newGradient: GradientConfig) => void;
    idPrefix: string;
}> = ({ gradient, onGradientChange, idPrefix }) => {
    return (
        <div className="space-y-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label htmlFor={`${idPrefix}-from-color`} className="block text-sm mb-1 opacity-80">From</label>
                    <input
                        id={`${idPrefix}-from-color`}
                        type="color"
                        value={gradient.from}
                        onChange={(e) => onGradientChange({ ...gradient, from: e.target.value })}
                        className="w-full h-10 p-1 bg-transparent rounded-xl cursor-pointer border-2 border-white/20"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor={`${idPrefix}-to-color`} className="block text-sm mb-1 opacity-80">To</label>
                    <input
                        id={`${idPrefix}-to-color`}
                        type="color"
                        value={gradient.to}
                        onChange={(e) => onGradientChange({ ...gradient, to: e.target.value })}
                        className="w-full h-10 p-1 bg-transparent rounded-xl cursor-pointer border-2 border-white/20"
                    />
                </div>
            </div>
            <div>
                 <label htmlFor={`${idPrefix}-angle`} className="block text-sm mb-1 opacity-80">Angle: {gradient.angle}°</label>
                 <input
                    id={`${idPrefix}-angle`}
                    type="range"
                    min="0"
                    max="360"
                    value={gradient.angle}
                    onChange={(e) => onGradientChange({ ...gradient, angle: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
};


const SystemAppearanceSettings: React.FC<Partial<AppProps>> = ({ 
    setWallpaper, 
    setTextColor,
    textColor = "#FFFFFF",
    setTextShadow,
    textShadow = "rgba(0,0,0,0.7)",
    setLanguage,
    language,
    setTimeFormat,
    timeFormat,
    setColorMode,
    colorMode = 'light',
    setSystemBackgroundGradient,
    systemBackgroundGradient = { from: '#1a237e', to: '#004d40', angle: 145 },
}) => {
    const { t } = useLanguage();
    const [wallpaperUrl, setWallpaperUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (setWallpaper && wallpaperUrl) {
            setWallpaper(wallpaperUrl);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && setWallpaper) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setWallpaper(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Preview styles
    const systemPreviewStyle = (): React.CSSProperties => {
        switch(colorMode) {
            case 'light': return { background: '#e5e7eb' };
            case 'gradient': return { background: `linear-gradient(${systemBackgroundGradient.angle}deg, ${systemBackgroundGradient.from}, ${systemBackgroundGradient.to})` };
            case 'dark':
            default:
                return { background: '#111827' };
        }
    };

    const languageOptions: { code: Language; name: string }[] = [
        { code: 'zh', name: '中文 (简体)' },
        { code: 'en', name: 'English' },
        { code: 'ms', name: 'Bahasa Melayu' },
    ];
    
    const colorModeOptions: { id: ColorMode; name: string }[] = [
        { id: 'light', name: t('appearance_mode_light') },
        { id: 'gradient', name: t('appearance_mode_gradient') },
    ];
    
    return (
        <div className="h-full flex flex-col text-outline overflow-y-auto pr-2 -mr-4 pb-4">
            <h2 className="text-2xl font-bold mb-6">{t('settings_appearance_category')}</h2>

            <Section title={t('appearance_color_mode')} previewStyle={systemPreviewStyle()}>
                <div className="flex space-x-2 mb-4">
                    {colorModeOptions.map(opt => (
                         <button
                            key={opt.id}
                            onClick={() => setColorMode?.(opt.id)}
                            className={`flex-1 py-2 px-4 text-center rounded-xl transition-all border ${colorMode === opt.id ? 'bg-blue-500/80 border-transparent text-white' : 'bg-black/5 dark:bg-white/5 border-white/30 hover:bg-black/10 dark:hover:bg-white/10'}`}
                        >
                            {opt.name}
                        </button>
                    ))}
                </div>
                {colorMode === 'gradient' && systemBackgroundGradient && setSystemBackgroundGradient && (
                    <GradientPicker idPrefix="system" gradient={systemBackgroundGradient} onGradientChange={setSystemBackgroundGradient} />
                )}
            </Section>

            <Section title={t('appearance_wallpaper')} disabled={colorMode === 'gradient'}>
                <form onSubmit={handleUrlSubmit} className="flex items-center mb-3">
                    <input
                        type="text"
                        value={wallpaperUrl}
                        onChange={(e) => setWallpaperUrl(e.target.value)}
                        placeholder={t('appearance_paste_url')}
                        className="flex-grow p-2 rounded-l-xl bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
                    />
                    <button type="submit" className="px-4 py-2 bg-black/20 dark:bg-white/20 text-outline rounded-r-xl ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150">
                        {t('appearance_apply')}
                    </button>
                </form>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    aria-label={t('appearance_upload_aria')}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-black/20 dark:bg-white/20 text-outline rounded-xl ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150"
                >
                    {t('appearance_upload_local')}
                </button>
            </Section>

            <Section title={t('appearance_font_color')}>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="text-color-input" className="block text-sm font-medium mb-2">
                            {t('appearance_main_color')}
                        </label>
                        <input
                            id="text-color-input"
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor?.(e.target.value)}
                            className="w-full h-10 p-1 bg-transparent rounded-xl cursor-pointer border-2 border-white/20"
                            aria-label={t('appearance_select_main_color_aria')}
                        />
                    </div>
                    <div>
                        <label htmlFor="text-shadow-input" className="block text-sm font-medium mb-2">
                            {t('appearance_shadow_color')}
                        </label>
                        <input
                            id="text-shadow-input"
                            type="color"
                            value={textShadow}
                            onChange={(e) => setTextShadow?.(e.target.value)}
                            className="w-full h-10 p-1 bg-transparent rounded-xl cursor-pointer border-2 border-white/20"
                            aria-label={t('appearance_enter_shadow_color_aria')}
                        />
                    </div>
                 </div>
            </Section>

            <Section title={t('appearance_language_title')}>
                <div className="flex flex-col space-y-2">
                    {languageOptions.map(opt => (
                        <button
                            key={opt.code}
                            onClick={() => setLanguage?.(opt.code)}
                            className={`w-full py-2 text-left px-4 rounded-xl transition-all border ${language === opt.code ? 'bg-blue-500/80 border-transparent text-white' : 'bg-black/5 dark:bg-white/5 border-white/30 hover:bg-black/10 dark:hover:bg-white/10'}`}
                        >
                            {opt.name}
                        </button>
                    ))}
                </div>
            </Section>
            
            <Section title={t('appearance_time_format')}>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setTimeFormat?.('12h')}
                        className={`flex-1 py-2 rounded-xl transition-all border ${timeFormat === '12h' ? 'bg-blue-500/80 border-transparent text-white' : 'bg-black/5 dark:bg-white/5 border-white/30 hover:bg-black/10 dark:hover:bg-white/10'}`}
                    >
                        {t('time_format_12h')}
                    </button>
                    <button
                        onClick={() => setTimeFormat?.('24h')}
                        className={`flex-1 py-2 rounded-xl transition-all border ${timeFormat === '24h' ? 'bg-blue-500/80 border-transparent text-white' : 'bg-black/5 dark:bg-white/5 border-white/30 hover:bg-black/10 dark:hover:bg-white/10'}`}
                    >
                        {t('time_format_24h')}
                    </button>
                </div>
            </Section>
        </div>
    );
};

export default SystemAppearanceSettings;