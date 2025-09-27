import React from 'react';
import type { WindowInstance, AppDefinition } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface MinimizedTaskbarProps {
  windows: WindowInstance[];
  apps: AppDefinition[];
  onRestore: (id: string) => void;
}

const MinimizedIcon: React.FC<{
    app: AppDefinition;
    window: WindowInstance;
    onRestore: (id: string) => void;
}> = ({ app, window, onRestore }) => {
    const { t } = useLanguage();
    // The window title is more specific than the app name, e.g., for multiple chat windows.
    const windowTitle = window.title || t(app.name);

    return (
        <button
            onClick={() => onRestore(window.id)}
            className="jelly-button w-12 h-12 p-1"
            title={windowTitle}
            aria-label={`Restore ${windowTitle}`}
        >
            {app.icon ? 
                <img src={app.icon} alt={windowTitle} className="w-8 h-8 object-contain mx-auto" /> :
                <span className="text-xs text-outline">{windowTitle.substring(0, 3)}</span>
            }
        </button>
    );
};


const MinimizedTaskbar: React.FC<MinimizedTaskbarProps> = ({ windows, apps, onRestore }) => {
  const minimizedWindows = windows.filter(w => w.isMinimized);

  if (minimizedWindows.length === 0) {
    return null;
  }

  // Animate the entrance of the bar itself. Icons will just appear with it.
  return (
    <div 
        className="fixed top-1/2 right-4 z-20 transition-all duration-300 animate-fade-in-right"
        style={{ transform: 'translateY(-50%)' }}
        aria-label="Minimized applications"
        role="toolbar"
    >
      <div className="taskbar-background p-2 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
        {minimizedWindows.map(win => {
          const appDef = apps.find(app => app.id === win.appId);
          if (!appDef) return null;
          return <MinimizedIcon key={win.id} app={appDef} window={win} onRestore={onRestore} />;
        })}
      </div>
    </div>
  );
};

export default MinimizedTaskbar;
