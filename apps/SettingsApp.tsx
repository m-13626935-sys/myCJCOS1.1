import React, { useState } from 'react';
import type { AppProps } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import SystemAppearanceSettings from '../components/settings/SystemAppearanceSettings';
import AISettings from '../components/settings/AISettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import AboutSettings from '../components/settings/AboutSettings';

type SettingsCategory = 'appearance' | 'taskbar' | 'ai' | 'security' | 'about';

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
}> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between">
        <div>
            <h4 className="font-semibold">{label}</h4>
            <p className="text-sm opacity-70 max-w-sm">{description}</p>
        </div>
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);


const SettingsApp: React.FC<Partial<AppProps>> = (props) => {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');

    const categories: { id: SettingsCategory; name: string; icon: React.ReactElement }[] = [
        {
            id: 'appearance',
            name: t('settings_appearance_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 2.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3.5 3a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM12.5 2.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM11 3a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM5 12.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3.5 13a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM12.5 12.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM11 13a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"></path></svg>
        },
        {
            id: 'taskbar',
            name: t('settings_taskbar_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3 4.5A1.5 1.5 0 014.5 3h11A1.5 1.5 0 0117 4.5V11h- традиciя14V4.5zM3 12.5h14v2a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 14.5v-2z"></path></svg>
        },
        {
            id: 'ai',
            name: t('settings_ai_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a1.5 1.5 0 01.837 2.843l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223A1.5 1.5 0 1110 8.5v3a1.5 1.5 0 110-3v-1.5z"></path><path d="M3.34 6.342a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316zm10.32 0a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316z"></path></svg>
        },
        {
            id: 'security',
            name: t('settings_security_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
        },
        {
            id: 'about',
            name: t('settings_about_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
        }
    ];

    const renderContent = () => {
        switch (activeCategory) {
            case 'appearance':
                return <SystemAppearanceSettings {...props} />;
            case 'taskbar':
                 if (props.setIsAutoHideDockEnabled === undefined || props.isAutoHideDockEnabled === undefined || props.autoHideDuration === undefined || props.setAutoHideDuration === undefined) {
                    return <div>Settings not available.</div>;
                }
                return (
                     <div className="h-full flex flex-col">
                        <h2 className="text-2xl font-bold mb-6">{t('settings_taskbar_category')}</h2>
                        <div className="space-y-6">
                            <div className="bg-white/5 dark:bg-black/10 p-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/10">
                                <ToggleSwitch
                                    checked={props.isAutoHideDockEnabled}
                                    onChange={props.setIsAutoHideDockEnabled}
                                    label={t('settings_taskbar_autohide_label')}
                                    description={t('settings_taskbar_autohide_desc')}
                                />
                            </div>
                            <div className={`bg-white/5 dark:bg-black/10 p-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 transition-opacity ${!props.isAutoHideDockEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold">{t('settings_taskbar_autohide_duration_label')}</h4>
                                            <p className="text-sm opacity-70 max-w-sm">{t('settings_taskbar_autohide_duration_desc')}</p>
                                        </div>
                                        <span className="font-semibold text-base whitespace-nowrap">{t('settings_taskbar_seconds', { count: props.autoHideDuration })}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="1"
                                        value={props.autoHideDuration}
                                        onChange={(e) => props.setAutoHideDuration?.(parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer mt-2"
                                        disabled={!props.isAutoHideDockEnabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ai':
                return <AISettings aiSettings={props.aiSettings} setAiSettings={props.setAiSettings} />;
            case 'security':
                return <SecuritySettings />;
            case 'about':
                return <AboutSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-transparent text-outline -m-4">
            {/* Sidebar */}
            <aside className="w-full md:w-56 flex-shrink-0 p-4 border-r border-white/10 dark:border-black/30 flex flex-col">
                <h1 className="text-xl font-bold mb-6 px-2">{t('settings_title')}</h1>
                <nav className="flex flex-col space-y-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeCategory === cat.id ? 'bg-blue-600/80 text-white' : 'hover:bg-white/10 dark:hover:bg-black/20'}`}
                        >
                            {cat.icon}
                            <span className="font-medium">{cat.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default SettingsApp;