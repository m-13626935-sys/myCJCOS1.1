import React, { useState } from 'react';
import type { AppProps } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import SystemAppearanceSettings from '../components/settings/SystemAppearanceSettings';
import AISettings from '../components/settings/AISettings';
import SecuritySettings from '../components/settings/SecuritySettings';

type SettingsCategory = 'appearance' | 'ai' | 'security';

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
            id: 'ai',
            name: t('settings_ai_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a1.5 1.5 0 01.837 2.843l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223A1.5 1.5 0 1110 8.5v3a1.5 1.5 0 110-3v-1.5z"></path><path d="M3.34 6.342a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316zm10.32 0a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316z"></path></svg>
        },
        {
            id: 'security',
            name: t('settings_security_category'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
        }
    ];

    const renderContent = () => {
        switch (activeCategory) {
            case 'appearance':
                return <SystemAppearanceSettings {...props} />;
            case 'ai':
                return <AISettings aiSettings={props.aiSettings} setAiSettings={props.setAiSettings} />;
            case 'security':
                return <SecuritySettings />;
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