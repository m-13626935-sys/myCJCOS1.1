

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const PASSWORD_STORAGE_KEY = 'gemini_os_password';

const SecuritySettings: React.FC = () => {
    const { t } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const savedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY) || '1234';

        if (currentPassword !== savedPassword) {
            setError(t('security_error_incorrect_current'));
            return;
        }

        if (newPassword.length < 4) {
            setError(t('security_error_too_short'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('security_error_mismatch'));
            return;
        }

        localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
        setSuccess(t('security_success_message'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
            setSuccess(null);
        }, 3000);
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6">{t('settings_security_category')}</h2>
            <div className="bg-white/5 dark:bg-black/10 p-6 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 max-w-md">
                <h3 className="text-lg font-semibold mb-4">{t('security_change_password_title')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="current-password" className="block text-sm font-medium mb-1 opacity-80">{t('security_current_password')}</label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-2 rounded-xl bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="new-password" className="block text-sm font-medium mb-1 opacity-80">{t('security_new_password')}</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 rounded-xl bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium mb-1 opacity-80">{t('security_confirm_new_password')}</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 rounded-xl bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                            required
                        />
                    </div>
                    
                    <div className="pt-2">
                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-500 transition-colors">
                            {t('security_save_button')}
                        </button>
                    </div>

                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                    {success && <p className="text-sm text-green-400 mt-2">{success}</p>}
                </form>
            </div>
        </div>
    );
};

export default SecuritySettings;