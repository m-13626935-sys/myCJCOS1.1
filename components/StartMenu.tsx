
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { AppDefinition, AppCategory, WindowInstance } from '../types';
import { CATEGORY_ORDER } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface StartMenuProps {
  isOpen: boolean;
  apps: AppDefinition[];
  onAppClick: (appId: string) => void;
  onRestart: () => void;
  onShutdown: () => void;
  onClose: () => void;
  onExited: () => void;
  windows: WindowInstance[];
  userName: string | null;
}

const RestartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696a8.25 8.25 0 00-11.664 0l-3.181 3.183" />
    </svg>
);

const ShutdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const StartMenu: React.FC<StartMenuProps> = ({ isOpen, apps, onAppClick, onRestart, onShutdown, onClose, onExited, windows, userName }) => {
    const { t } = useLanguage();
    const menuRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllApps, setShowAllApps] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);
    
    const handleAnimationEnd = () => {
        if (!isOpen) {
            onExited();
        }
    };

    const visibleApps = useMemo(() => apps.filter(app => app.category), [apps]);

    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) return visibleApps;
        return visibleApps.filter(app =>
            t(app.name).toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
    }, [visibleApps, searchQuery, t]);

    const pinnedApps = filteredApps; // All apps are "pinned" for now.
    
    const categorizedApps = useMemo(() => {
        const groups = filteredApps.reduce((acc, app) => {
            const category = app.category || 'uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(app);
            return acc;
        }, {} as Record<string, AppDefinition[]>);

        for(const category in groups) {
            groups[category].sort((a, b) => t(a.name).localeCompare(t(b.name), t('locale_code')))
        }

        return Object.keys(groups)
            .sort((a, b) => {
                const indexA = CATEGORY_ORDER.indexOf(a as AppCategory);
                const indexB = CATEGORY_ORDER.indexOf(b as AppCategory);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            })
            .reduce((acc, key) => {
                acc[key] = groups[key];
                return acc;
            }, {} as Record<string, AppDefinition[]>);

    }, [filteredApps, t]);


    const renderAppGrid = (appsToRender: AppDefinition[]) => (
        <div className="grid grid-cols-6 gap-x-2 gap-y-4">
            {appsToRender.length > 0 ? (
                appsToRender.map((app) => {
                    const runningInstances = windows.filter(w => w.appId === app.id && !w.isClosing);
                    const isRunning = runningInstances.length > 0;
                    const isMinimized = isRunning && runningInstances.every(w => w.isMinimized);
                    const appName = t(app.name);
                    return (
                        <button
                            key={app.id}
                            onClick={() => onAppClick(app.id)}
                            className="relative flex flex-col items-center justify-center text-center p-1 rounded-lg bg-gradient-to-b from-white/5 to-white/0 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-md hover:from-white/20 dark:hover:from-white/10 hover:shadow-lg active:shadow-inner active:scale-95 transition-all duration-200 group h-20"
                            aria-label={appName}
                        >
                            {app.icon && <img src={app.icon} alt="" className="w-8 h-8 object-contain mb-1" />}
                            <span className="text-xs text-outline w-full break-words">{appName}</span>
                            {isRunning && (
                                <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ring-1 ring-black/50 ${isMinimized ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                            )}
                        </button>
                    )
                })
            ) : (
                 <p className="col-span-6 text-center text-outline opacity-70 py-4">{t('start_menu_no_results')}</p>
            )}
        </div>
    );
    
    const renderAppList = (groupedApps: Record<string, AppDefinition[]>) => {
        const hasResults = Object.values(groupedApps).some(g => g.length > 0);
        if (!hasResults) {
            return <p className="text-center text-outline opacity-70 py-4">{t('start_menu_no_results')}</p>;
        }
        return (
             <div className="flex flex-col space-y-3">
                 {Object.entries(groupedApps).map(([category, appsInCategory]) => (
                    appsInCategory.length > 0 && (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-outline px-2 py-1 mb-1">
                                {t(category)}
                            </h4>
                            <div className="flex flex-col space-y-1">
                                {appsInCategory.map((app) => {
                                    const runningInstances = windows.filter(w => w.appId === app.id && !w.isClosing);
                                    const isRunning = runningInstances.length > 0;
                                    const isMinimized = isRunning && runningInstances.every(w => w.isMinimized);
                                    const appName = t(app.name);
                                    return (
                                        <button
                                            key={app.id}
                                            onClick={() => onAppClick(app.id)}
                                            className="relative flex items-center text-left p-2 rounded-md bg-white/[.02] dark:bg-black/5 ring-1 ring-inset ring-black/5 dark:ring-white/5 shadow-sm hover:bg-white/5 dark:hover:bg-white/10 hover:shadow-md active:shadow-inner active:scale-95 transition-all duration-200"
                                            aria-label={appName}
                                        >
                                            {app.icon ? (
                                                <img src={app.icon} alt="" className="w-6 h-6 object-contain mr-3" />
                                            ) : (
                                                <div className="w-6 h-6 mr-3" />
                                            )}
                                            <span className="text-sm text-outline">{appName}</span>
                                            {isRunning && (
                                                <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isMinimized ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                 ))}
            </div>
        );
    };


    return (
        <div
            ref={menuRef}
            onAnimationEnd={handleAnimationEnd}
            className={`absolute bottom-16 left-1/2 w-[560px] max-w-[95vw] h-[640px] max-h-[80vh] taskbar-background backdrop-blur-3xl ring-1 ring-black/10 dark:ring-white/10 rounded-xl shadow-2xl flex flex-col z-40 ${isOpen ? 'animate-fade-in-up' : 'animate-fade-out-down'}`}
        >
            <div className="p-4 flex-shrink-0">
                 <input
                    type="text"
                    placeholder={t('start_menu_search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 rounded-md bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 text-outline placeholder-outline"
                    autoFocus
                />
            </div>
            
            <div className="px-6 pb-6 pt-0 flex-grow overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-semibold text-base text-outline">
                        {showAllApps ? t('start_menu_all_apps') : t('start_menu_pinned')}
                    </h3>
                    <button
                        onClick={() => setShowAllApps(!showAllApps)}
                        className="text-sm font-medium text-outline hover:underline px-2 py-1 rounded-md"
                    >
                        {showAllApps ? t('start_menu_back_to_pinned') : `${t('start_menu_all_apps')} >`}
                    </button>
                </div>

                {showAllApps ? renderAppList(categorizedApps) : renderAppGrid(pinnedApps)}
            </div>

            <div className="mt-auto bg-white/[.02] dark:bg-black/5 rounded-b-xl px-6 py-3 flex justify-between items-center flex-shrink-0 text-outline">
                 <button className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-b from-white/5 to-white/0 dark:from-white/10 dark:to-white/0 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-md hover:from-white/20 dark:hover:from-white/10 hover:shadow-lg active:shadow-inner active:scale-95 transition-all duration-200">
                    <div className="text-outline">
                        <UserIcon />
                    </div>
                    <span className="text-sm font-medium text-outline">{userName || t('user')}</span>
                 </button>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={onRestart}
                        className="p-2 rounded-full bg-gradient-to-b from-white/5 to-white/0 dark:from-white/10 dark:to-white/0 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-lg hover:from-white/20 dark:hover:from-white/10 active:shadow-inner active:scale-95 transition-all duration-200 text-outline"
                        title={t('restart')}
                        aria-label={t('restart')}
                    >
                        <RestartIcon />
                    </button>
                    <button
                        onClick={onShutdown}
                        className="p-2 rounded-full bg-gradient-to-b from-white/5 to-white/0 dark:from-white/10 dark:to-white/0 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-lg hover:from-white/20 dark:hover:from-white/10 active:shadow-inner active:scale-95 transition-all duration-200 text-outline"
                        title={t('shutdown')}
                        aria-label={t('shutdown')}
                    >
                        <ShutdownIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartMenu;