import React, { useRef, useEffect } from 'react';
import type { AppDefinition, AppCategory, WindowInstance } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DockCategoryGroupProps {
  category: AppCategory;
  apps: AppDefinition[];
  isOpen: boolean;
  onToggle: () => void;
  onAppClick: (appId: string) => void;
  onClose: () => void;
  windows: WindowInstance[];
}

const DockCategoryGroup: React.FC<DockCategoryGroupProps> = ({ category, apps, isOpen, onToggle, onAppClick, onClose, windows }) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);


  if (apps.length === 0) {
    return null;
  }

  const handleAppClick = (appId: string) => {
    onAppClick(appId);
    onClose();
  };

  const categoryName = t(category);
  const isAiCategory = category === 'category_ai';

  return (
    <div className="relative" ref={groupRef}>
      {isOpen && (
        <div className="absolute bottom-full mb-2 w-48 taskbar-background backdrop-blur-3xl ring-1 ring-black/10 dark:ring-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 animate-fade-in-up">
          {apps.map((app) => {
            const runningInstances = windows.filter(w => w.appId === app.id && !w.isClosing);
            const isRunning = runningInstances.length > 0;
            const isMinimized = isRunning && runningInstances.every(w => w.isMinimized);
            const appName = t(app.name);

            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                className="w-full flex items-center text-left px-3 py-2 text-sm text-outline rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-colors duration-150 relative"
              >
                {app.icon ? (
                    <img src={app.icon} alt="" className="w-5 h-5 object-contain mr-2" />
                ) : (
                    <div className="w-5 h-5 mr-2" />
                )}
                <span>{appName}</span>
                {isRunning && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isMinimized ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={onToggle}
        className={`light-field-button h-12 px-4 ${isAiCategory ? 'ai-gradient-border' : ''}`}
        aria-label={`${t('aria_open_category')} ${categoryName}`}
        aria-expanded={isOpen}
      >
        <span className="text-xs text-outline whitespace-nowrap">{categoryName}</span>
      </button>
    </div>
  );
};

export default DockCategoryGroup;