
import React from 'react';
import type { AppProps, AISettings } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

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

const AISettings: React.FC<Partial<AppProps>> = ({ aiSettings, setAiSettings }) => {
    const { t } = useLanguage();
    if (!aiSettings || !setAiSettings) {
        return <div>Settings not available.</div>;
    }

    const handleToggle = (key: keyof AISettings) => {
        setAiSettings({ ...aiSettings, [key]: !aiSettings[key] });
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6">{t('settings_ai_category')}</h2>
            <div className="space-y-6">
                <div className="bg-white/5 dark:bg-black/10 p-4 rounded-xl ring-1 ring-black/10 dark:ring-white/10">
                    <ToggleSwitch
                        checked={aiSettings.isEnabled}
                        onChange={() => handleToggle('isEnabled')}
                        label={t('settings_ai_enable_toggle_label')}
                        description={t('settings_ai_enable_toggle_desc')}
                    />
                </div>
                
                <div className={`transition-opacity ${!aiSettings.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="bg-white/5 dark:bg-black/10 p-4 rounded-xl ring-1 ring-black/10 dark:ring-white/10 mb-6">
                        <ToggleSwitch
                            checked={aiSettings.memoryEnabled}
                            onChange={() => handleToggle('memoryEnabled')}
                            label={t('settings_ai_memory_toggle_label')}
                            description={t('settings_ai_memory_toggle_desc')}
                        />
                    </div>

                    <div className="bg-white/5 dark:bg-black/10 p-4 rounded-xl ring-1 ring-black/10 dark:ring-white/10 mb-6">
                        <ToggleSwitch
                            checked={aiSettings.appIntegrationsEnabled}
                            onChange={() => handleToggle('appIntegrationsEnabled')}
                            label={t('settings_ai_binding_toggle_label')}
                            description={t('settings_ai_binding_toggle_desc')}
                        />
                    </div>

                    <div className="bg-white/5 dark:bg-black/10 p-4 rounded-xl ring-1 ring-black/10 dark:ring-white/10">
                        <h4 className="font-semibold">{t('settings_ai_integrations_title')}</h4>
                        <p className="text-sm opacity-70 mb-4">{t('settings_ai_integrations_desc')}</p>
                        <ul className="space-y-2 text-sm list-disc list-inside pl-2 opacity-90">
                            <li>{t('settings_ai_integration_schedule')}</li>
                            <li>{t('settings_ai_integration_clock')}</li>
                            <li>{t('settings_ai_integration_appearance')}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings;