import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppDefinition } from '../types';

const CUSTOM_APPS_STORAGE_KEY = 'cjc_custom_apps';

const AddApp: React.FC = () => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!name.trim() || !url.trim()) {
            setError(t('add_app_error_required'));
            return;
        }

        try {
            // Basic URL validation
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error('Invalid URL');
            }
            new URL(url);
        } catch (_) {
            setError(t('add_app_error_invalid_url'));
            return;
        }

        const newApp: AppDefinition = {
            id: `custom-${Date.now()}`,
            name: name.trim(), // Store the name directly, as we can't add to translations dynamically
            url: url.trim(),
            icon: iconUrl.trim() || undefined,
            category: 'category_custom',
        };

        try {
            const savedAppsJSON = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
            const savedApps: AppDefinition[] = savedAppsJSON ? JSON.parse(savedAppsJSON) : [];
            
            savedApps.push(newApp);

            localStorage.setItem(CUSTOM_APPS_STORAGE_KEY, JSON.stringify(savedApps));
            
            window.dispatchEvent(new CustomEvent('custom-apps-updated'));

            setSuccess(t('add_app_success', { name: newApp.name }));
            
            setName('');
            setUrl('');
            setIconUrl('');

            setTimeout(() => setSuccess(null), 3000);

        } catch (err) {
            console.error("Failed to save custom app:", err);
            setError(t('add_app_error_generic'));
        }
    };

    return (
        <div className="h-full flex flex-col text-outline">
            <h1 className="text-2xl font-bold mb-4">{t('app_add_app')}</h1>
            <p className="text-sm opacity-70 mb-6">{t('add_app_description')}</p>
            
            <div className="flex gap-8">
                <form onSubmit={handleSubmit} className="flex-grow space-y-4">
                    <div>
                        <label htmlFor="app-name" className="block text-sm font-medium mb-1">{t('add_app_name_label')}</label>
                        <input
                            id="app-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('add_app_name_placeholder')}
                            className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="app-url" className="block text-sm font-medium mb-1">{t('add_app_url_label')}</label>
                        <input
                            id="app-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={t('add_app_url_placeholder')}
                            className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="app-icon-url" className="block text-sm font-medium mb-1">{t('add_app_icon_label')}</label>
                        <input
                            id="app-icon-url"
                            type="url"
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                            placeholder={t('add_app_icon_placeholder')}
                            className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 active:shadow-inner active:scale-95 transition-all duration-150"
                        >
                            {t('add_app_button')}
                        </button>
                    </div>
                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                    {success && <p className="text-sm text-green-400 mt-2">{success}</p>}
                </form>

                <div className="flex-shrink-0 w-40 flex flex-col items-center">
                    <p className="text-sm font-semibold mb-2">{t('add_app_preview')}</p>
                    <div className="jelly-button flex-col w-28 h-24 p-1">
                        {iconUrl ? (
                            <img src={iconUrl} alt="Icon Preview" className="w-12 h-12 object-contain mb-1" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.nextElementSibling?.classList.remove('hidden') }} onLoad={(e) => { e.currentTarget.style.display = 'block'; e.currentTarget.nextElementSibling?.nextElementSibling?.classList.add('hidden') }} />
                        ) : null}
                         <div className={`w-12 h-12 mb-1 flex items-center justify-center bg-gray-500/20 rounded-lg ${iconUrl ? 'hidden' : ''}`}>?</div>
                        <span className="text-sm text-outline text-center break-words w-full">
                            {name || t('add_app_name_placeholder')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddApp;
