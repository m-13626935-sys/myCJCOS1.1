import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { APPS, WIDGETS } from './constants';
import { useWindows } from './hooks/useWindows';
import Dock from './components/Dock';
import Window from './components/Window';
import StartupAnimation from './components/StartupAnimation';
import StartMenu from './components/StartMenu';
import ShutdownScreen from './components/ShutdownScreen';
import LockScreen from './components/LockScreen';
import Desktop from './components/Desktop';
import SetupScreen from './components/SetupScreen';
import WidgetPanel from './components/WidgetPanel';
import DesktopWidgetWrapper from './components/DesktopWidgetWrapper';
import MinimizedTaskbar from './components/MinimizedTaskbar';
import type { AppProps, AppDefinition, Language, DesktopWidgetInstance, TimeFormat, ColorMode, GradientConfig, ButtonBackground, AISettings } from './types';
import { useLanguage } from './contexts/LanguageContext';

const WIDGET_STORAGE_KEY = 'cjc5_desktop_widgets';
const TIME_FORMAT_STORAGE_KEY = 'cjc5_time_format';
const AI_SETTINGS_STORAGE_KEY = 'cjc5_ai_settings';
const CUSTOM_APPS_STORAGE_KEY = 'cjc_custom_apps';

const App: React.FC = () => {
  const { t, setLanguage, language } = useLanguage();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isStartMenuMounted, setIsStartMenuMounted] = useState(false);
  const [isShutdown, setIsShutdown] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2670");
  const [userName, setUserName] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textShadowColor, setTextShadowColor] = useState("rgba(0,0,0,0.7)");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isWidgetPanelOpen, setIsWidgetPanelOpen] = useState(false);
  const [desktopWidgets, setDesktopWidgets] = useState<DesktopWidgetInstance[]>([]);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h');
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [systemBackgroundGradient, setSystemBackgroundGradient] = useState<GradientConfig>({ from: '#1a237e', to: '#004d40', angle: 145 });
  const [customApps, setCustomApps] = useState<AppDefinition[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    try {
        const saved = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
        const defaults = { isEnabled: true, memoryEnabled: true, appIntegrationsEnabled: true };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
        return { isEnabled: true, memoryEnabled: true, appIntegrationsEnabled: true };
    }
  });

  useEffect(() => {
    const loadCustomApps = () => {
        try {
            const savedAppsJSON = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
            const savedApps: AppDefinition[] = savedAppsJSON ? JSON.parse(savedAppsJSON) : [];
            if (Array.isArray(savedApps)) {
                // For custom apps, we can't use the translation system for names.
                // Their names are stored directly. We need to adapt how they are displayed.
                // This is handled in components like DesktopIcon where they check if a translation exists.
                setCustomApps(savedApps);
            }
        } catch (e) {
            console.error("Failed to load custom apps:", e);
        }
    };
    
    loadCustomApps();

    window.addEventListener('custom-apps-updated', loadCustomApps);
    return () => {
        window.removeEventListener('custom-apps-updated', loadCustomApps);
    };
  }, []);

  const visibleApps = useMemo(() => {
    // For custom apps, the name is not a translation key. Components that render names
    // (like DesktopIcon, StartMenu) need to handle this by attempting translation first
    // and falling back to the name property if no translation is found. `t(app.name)` does this.
    const allApps = [...APPS, ...customApps];
    if (aiSettings.isEnabled) {
        return allApps;
    }
    return allApps.filter(app => !app.isAiFeature);
  }, [aiSettings.isEnabled, customApps]);
  
  const { windows, openWindow, closeWindow, focusWindow, minimizeWindow, restoreAndFocusWindow, updateWindowState, closeAllWindows, toggleMaximizeWindow, removeWindow } = useWindows(visibleApps, t);

  useEffect(() => {
    // Save AI settings to storage
    try {
        localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(aiSettings));
    } catch (e) {
        console.error("Failed to save AI settings to localStorage", e);
    }
  }, [aiSettings]);

  useEffect(() => {
    // Load widgets from storage
    try {
        const savedWidgets = localStorage.getItem(WIDGET_STORAGE_KEY);
        if (savedWidgets) {
            setDesktopWidgets(JSON.parse(savedWidgets));
        }
    } catch (e) {
        console.error("Failed to load widgets from localStorage", e);
    }
  }, []);

  useEffect(() => {
      // Save widgets to storage
      try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(desktopWidgets));
      } catch (e) {
        console.error("Failed to save widgets to localStorage", e);
      }
  }, [desktopWidgets]);

  useEffect(() => {
    // Check for saved user name on initial load.
    // The language is now loaded by the LanguageProvider.
    const savedName = localStorage.getItem('cjc5_username');
    const savedTimeFormat = localStorage.getItem(TIME_FORMAT_STORAGE_KEY) as TimeFormat;

    if (savedName) {
      setUserName(savedName);
      if (savedTimeFormat) {
          setTimeFormat(savedTimeFormat);
      }
      setIsSetupComplete(true);
    }
  }, []);

  useEffect(() => {
      localStorage.setItem(TIME_FORMAT_STORAGE_KEY, timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    if (userName) {
      document.title = t('document_title', { name: userName });
    } else {
      document.title = t('document_title_default');
    }
  }, [userName, t]);


  useEffect(() => {
    if (isStartMenuOpen) {
      setIsStartMenuMounted(true);
    }
  }, [isStartMenuOpen]);
  
  const handleSetWallpaper = useCallback((url: string) => {
    if (url) {
      setWallpaperUrl(url);
    }
  }, []);

  // --- APPEARANCE EFFECTS ---
  useEffect(() => {
    const bgElement = document.getElementById('system-background');
    if (!bgElement) return;

    // Manage light/dark class
    document.documentElement.classList.remove('dark');
    if (colorMode === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Manage background style
    if (colorMode === 'gradient') {
        bgElement.style.backgroundImage = `linear-gradient(${systemBackgroundGradient.angle}deg, ${systemBackgroundGradient.from}, ${systemBackgroundGradient.to})`;
        bgElement.style.backgroundColor = '';
    } else {
        bgElement.style.backgroundImage = wallpaperUrl ? `url('${wallpaperUrl}')` : 'none';
        bgElement.style.backgroundColor = colorMode === 'dark' ? '#111827' : '#e5e7eb';
    }
  }, [colorMode, systemBackgroundGradient, wallpaperUrl]);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-main-color', textColor);
  }, [textColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-shadow-color', textShadowColor);
  }, [textShadowColor]);

  // --- GLOBAL EVENT LISTENERS for AI ACTIONS ---
  useEffect(() => {
    const handleSetWallpaperEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ url: string }>;
      if (customEvent.detail?.url) {
        handleSetWallpaper(customEvent.detail.url);
      }
    };
    window.addEventListener('ai-set-wallpaper', handleSetWallpaperEvent);
    return () => {
      window.removeEventListener('ai-set-wallpaper', handleSetWallpaperEvent);
    };
  }, [handleSetWallpaper]);


  const launchApp = (appId: string, options?: { props?: Record<string, any>, title?: string }) => {
    const app = visibleApps.find(a => a.id === appId);
    if (!app) return;

    if (app.url) {
        window.open(app.url, '_blank', 'noopener,noreferrer');
        return;
    }

    const appWindows = windows.filter(w => w.appId === appId);
    const minimizedWindow = appWindows.find(w => w.isMinimized);
    const visibleWindows = appWindows.filter(w => !w.isClosing && !w.isMinimized);

    if (minimizedWindow) {
        restoreAndFocusWindow(minimizedWindow.id);
    } else if (visibleWindows.length > 0) {
        const topWindow = visibleWindows.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
        focusWindow(topWindow.id);
    } else if (app.component) {
        openWindow(appId, options);
    }
  };

  const handleRestart = () => {
    closeAllWindows();
    setIsStartMenuOpen(false);
    setTimeout(() => {
      setIsAuthenticated(false);
      setIsBooting(true);
    }, 300);
  };

  const handleShutdown = () => {
    closeAllWindows();
    setIsStartMenuOpen(false);
    setTimeout(() => {
      setIsShutdown(true);
    }, 300);
  };

  const handleAppClick = (appId: string) => {
    launchApp(appId);
    setIsStartMenuOpen(false);
  };
  
  const handleStartMenuExited = () => {
    setIsStartMenuMounted(false);
  };

  const handleSetupComplete = (name: string) => {
    const trimmedName = name.trim();
    setUserName(trimmedName);
    localStorage.setItem('cjc5_username', trimmedName);
    setIsSetupComplete(true);
  };

  // --- WIDGET LOGIC ---
  const handleWidgetDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const widgetId = e.dataTransfer.getData('widgetId');
      const widgetDef = WIDGETS.find(w => w.id === widgetId);
      if (!widgetDef) return;
      
      const offsetX = widgetDef.defaultSize.width / 2;
      const offsetY = 20; // drop a bit below cursor

      const newWidget: DesktopWidgetInstance = {
          instanceId: `widget-${Date.now()}`,
          widgetId,
          position: { x: e.clientX - offsetX, y: e.clientY - offsetY },
          zIndex: (Math.max(0, ...desktopWidgets.map(w => w.zIndex))) + 1,
      };
      setDesktopWidgets(prev => [...prev, newWidget]);
      setIsWidgetPanelOpen(false);
  }, [desktopWidgets]);
  
  const updateWidgetPosition = useCallback((instanceId: string, newPos: { x: number; y: number }) => {
      setDesktopWidgets(prev => prev.map(w => w.instanceId === instanceId ? { ...w, position: newPos } : w));
  }, []);

  const removeWidget = useCallback((instanceId: string) => {
      setDesktopWidgets(prev => prev.filter(w => w.instanceId !== instanceId));
  }, []);

  const focusWidget = useCallback((instanceId: string) => {
      setDesktopWidgets(prev => {
          const maxZ = Math.max(...prev.map(w => w.zIndex), 0);
          return prev.map(w => w.instanceId === instanceId ? { ...w, zIndex: maxZ + 1 } : w);
      });
  }, []);
  
  if (isBooting) {
    return <StartupAnimation onFinished={() => { setIsBooting(false); setIsShutdown(false); }} />;
  }
  
  if (!isSetupComplete) {
      return <SetupScreen onSetupComplete={handleSetupComplete} wallpaperUrl={wallpaperUrl} />;
  }

  if (!isAuthenticated) {
    return <LockScreen onUnlockSuccess={() => setIsAuthenticated(true)} wallpaperUrl={wallpaperUrl} userName={userName!} />;
  }

  if (isShutdown) {
    return <ShutdownScreen />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <WidgetPanel isOpen={isWidgetPanelOpen} onClose={() => setIsWidgetPanelOpen(false)} timeFormat={timeFormat} />
      <MinimizedTaskbar apps={visibleApps} windows={windows} onRestore={restoreAndFocusWindow} />
      {isStartMenuMounted && <StartMenu isOpen={isStartMenuOpen} apps={visibleApps} onAppClick={handleAppClick} onRestart={handleRestart} onShutdown={handleShutdown} onClose={() => setIsStartMenuOpen(false)} onExited={handleStartMenuExited} windows={windows} userName={userName} />}
      <main className="h-full w-full relative">
        <Desktop apps={visibleApps} onAppDoubleClick={launchApp} onWidgetDrop={handleWidgetDrop} timeFormat={timeFormat} />
        
        {desktopWidgets.map(widgetInstance => {
            const widgetDef = WIDGETS.find(w => w.id === widgetInstance.widgetId);
            if (!widgetDef) return null;
            
            const WidgetContent = widgetDef.component;
            const widgetProps: Partial<AppProps> = {};

            return (
                <DesktopWidgetWrapper
                    key={widgetInstance.instanceId}
                    instance={widgetInstance}
                    definition={widgetDef}
                    onPositionChange={(newPos) => updateWidgetPosition(widgetInstance.instanceId, newPos)}
                    onClose={() => removeWidget(widgetInstance.instanceId)}
                    onFocus={() => focusWidget(widgetInstance.instanceId)}
                >
                    <WidgetContent {...widgetProps} />
                </DesktopWidgetWrapper>
            );
        })}

        {windows.map((win) => {
          const AppDefinition = visibleApps.find(app => app.id === win.appId);
          // For custom apps, their name isn't a translation key. `t` will return the name itself.
          const AppContent = AppDefinition?.component || (() => null);
          
          const appProps: Partial<AppProps> = {
            close: () => closeWindow(win.id),
            launchApp: launchApp,
          };

          if (win.appId === 'image-studio') {
            appProps.setWallpaper = handleSetWallpaper;
          }
          
          if (win.appId === 'settings') {
            appProps.setWallpaper = handleSetWallpaper;
            appProps.setTextColor = setTextColor;
            appProps.textColor = textColor;
            appProps.setTextShadow = setTextShadowColor;
            appProps.textShadow = textShadowColor;
            appProps.setLanguage = setLanguage;
            appProps.language = language;
            appProps.setTimeFormat = setTimeFormat;
            appProps.timeFormat = timeFormat;
            appProps.setColorMode = setColorMode;
            appProps.colorMode = colorMode;
            appProps.setSystemBackgroundGradient = setSystemBackgroundGradient;
            appProps.systemBackgroundGradient = systemBackgroundGradient;
            appProps.aiSettings = aiSettings;
            appProps.setAiSettings = setAiSettings;
          }

          return (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              position={win.position}
              size={win.size}
              zIndex={win.zIndex}
              isMaximized={win.isMaximized}
              isMinimized={win.isMinimized}
              isClosing={win.isClosing}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onPositionChange={(newPos) => updateWindowState(win.id, { position: newPos })}
              onMaximizeToggle={() => toggleMaximizeWindow(win.id)}
              onCloseAnimationComplete={() => removeWindow(win.id)}
            >
              <AppContent {...appProps} {...win.props} />
            </Window>
          );
        })}
      </main>
      <Dock 
        apps={visibleApps} 
        onAppClick={launchApp} 
        onStartClick={() => setIsStartMenuOpen(prev => !prev)} 
        onWidgetsClick={() => setIsWidgetPanelOpen(prev => !prev)} 
        windows={windows} 
        timeFormat={timeFormat} 
        isAiEnabled={aiSettings.isEnabled} 
        aiSettings={aiSettings} 
      />
    </div>
  );
}

export default App;