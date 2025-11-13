import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
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
import type { AppProps, AppDefinition, Language, DesktopWidgetInstance, TimeFormat, ColorMode, GradientConfig, ButtonBackground, AISettings, ThemeColors, AiSearchResult } from './types';
import { useLanguage } from './contexts/LanguageContext';
import AiSearch from './components/AiSearch';
import DesktopClock from './components/DesktopClock';
import CircleSearchOverlay from './components/CircleSearchOverlay';
import { geminiService } from './services/geminiService';
import { extractPaletteFromImage, generateThemeFromPalette } from './services/themeService';
import SnapPreview from './components/SnapPreview';

// --- Particle Effect System ---
interface Particle {
  id: number;
  x: number;
  y: number;
  translateX: string;
  translateY: string;
}
const PARTICLE_COUNT = 8;
const SPREAD = 50; // pixels

const useParticleEffect = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const addParticle = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
        newParticles.push({
            id: Date.now() + i,
            x,
            y,
            translateX: `${Math.cos(angle) * SPREAD}px`,
            translateY: `${Math.sin(angle) * SPREAD}px`,
        });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const onAnimationEnd = useCallback((id: number) => {
      setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  return { particles, addParticle, onAnimationEnd };
};

const Particles: React.FC<{ particles: Particle[]; onAnimationEnd: (id: number) => void }> = React.memo(({ particles, onAnimationEnd }) => {
    return (
        <>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        top: p.y,
                        left: p.x,
                        '--translateX': p.translateX,
                        '--translateY': p.translateY,
                    } as React.CSSProperties}
                    onAnimationEnd={() => onAnimationEnd(p.id)}
                />
            ))}
        </>
    );
});
// --- End Particle Effect System ---

const WIDGET_STORAGE_KEY = 'gemini_os_desktop_widgets';
const TIME_FORMAT_STORAGE_KEY = 'gemini_os_time_format';
const AI_SETTINGS_STORAGE_KEY = 'gemini_os_ai_settings';
const CUSTOM_APPS_STORAGE_KEY = 'gemini_os_custom_apps';
const DOCK_AUTOHIDE_STORAGE_KEY = 'gemini_os_dock_autohide';
const DOCK_AUTOHIDE_DURATION_STORAGE_KEY = 'gemini_os_dock_autohide_duration';
const THEME_COLORS_STORAGE_KEY = 'gemini_os_theme_colors';
const INSPIRATIONAL_COPY_STORAGE_KEY = 'gemini_os_inspirational_copy';
const AUTO_THEME_ENABLED_STORAGE_KEY = 'gemini_os_auto_theme_enabled';
const WIDGET_Z_INDEX_BASE = 20;

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
  const [effectiveColorMode, setEffectiveColorMode] = useState<Omit<ColorMode, 'adaptive' | 'gradient'>>(colorMode === 'dark' ? 'dark' : 'light');
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
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);
  const [inspirationalCopy, setInspirationalCopyState] = useState<string | null>(null);
  const [isAutoHideDockEnabled, setIsAutoHideDockEnabled] = useState<boolean>(true);
  const [autoHideDuration, setAutoHideDuration] = useState<number>(10);
  const [isEdgeHovered, setIsEdgeHovered] = useState(false);
  const [isTempUiVisible, setIsTempUiVisible] = useState(false);
  const [isUiInteractionPaused, setUiInteractionPaused] = useState(false);
  const uiHideTimeoutRef = useRef<number | null>(null);
  const [isCircleSearchActive, setIsCircleSearchActive] = useState(false);
  const [isProcessingCircleSearch, setIsProcessingCircleSearch] = useState(false);
  const [initialAiSearchResult, setInitialAiSearchResult] = useState<AiSearchResult | null>(null);
  const [isAutoThemeEnabled, setIsAutoThemeEnabled] = useState<boolean>(true);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'top' | null>(null);

  const { particles, addParticle, onAnimationEnd: onParticleAnimationEnd } = useParticleEffect();

  const dragInfoRef = useRef<{ winId: string | null; startX: number; startY: number; isUnsnapping: boolean; }>({ winId: null, startX: 0, startY: 0, isUnsnapping: false });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.light-field-button')) {
            addParticle(e.clientX, e.clientY);
        }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [addParticle]);
  
  useEffect(() => {
    // Load theme colors from storage
    try {
        const savedTheme = localStorage.getItem(THEME_COLORS_STORAGE_KEY);
        if (savedTheme) {
            setThemeColors(JSON.parse(savedTheme));
            // If a theme exists, it should be the active color mode
            setColorMode('theme');
        }
        const savedCopy = localStorage.getItem(INSPIRATIONAL_COPY_STORAGE_KEY);
        if (savedCopy) {
            setInspirationalCopyState(savedCopy);
        }
        const savedAutoTheme = localStorage.getItem(AUTO_THEME_ENABLED_STORAGE_KEY);
        if (savedAutoTheme) {
            setIsAutoThemeEnabled(JSON.parse(savedAutoTheme));
        }
    } catch (e) {
        console.error("Failed to load theme data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem(AUTO_THEME_ENABLED_STORAGE_KEY, JSON.stringify(isAutoThemeEnabled));
    } catch (e) {
        console.error("Failed to save auto-theme setting", e);
    }
  }, [isAutoThemeEnabled]);

  const handleSetThemeColors = useCallback((colors: ThemeColors) => {
    setThemeColors(colors);
    setColorMode('theme');
    try {
      localStorage.setItem(THEME_COLORS_STORAGE_KEY, JSON.stringify(colors));
    } catch (e) {
      console.error("Failed to save theme colors to localStorage", e);
    }
  }, []);
  
  const handleSetInspirationalCopy = useCallback((copy: string) => {
    setInspirationalCopyState(copy);
     try {
      localStorage.setItem(INSPIRATIONAL_COPY_STORAGE_KEY, copy);
    } catch (e) {
      console.error("Failed to save inspirational copy to localStorage", e);
    }
  }, []);

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
  }, [aiSettings.isEnabled, customApps, t]);
  
  const { windows, openWindow, closeWindow, focusWindow, minimizeWindow, restoreAndFocusWindow, updateWindowState, closeAllWindows, toggleMaximizeWindow, removeWindow, finishMinimize, finishRestore, snapWindow, unsnapWindow, snapWindowToLayout, focusWindows } = useWindows(visibleApps, t);
  const isAnyWindowMaximized = useMemo(() => windows.some(w => w.isMaximized && !w.isMinimized && !w.isClosing), [windows]);
  
  const focusedWindowId = useMemo(() => {
    if (windows.length === 0) return null;
    return windows.reduce((top, current) => (current.zIndex > top.zIndex ? current : top)).id;
  }, [windows]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const atTop = e.clientY <= 40; // Increased threshold for top bar
        const atBottom = e.clientY >= window.innerHeight - 8; // 8px threshold for dock
        setIsEdgeHovered(atTop || atBottom);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!isAutoHideDockEnabled || !isAnyWindowMaximized) {
        setIsTempUiVisible(false);
        if (uiHideTimeoutRef.current) clearTimeout(uiHideTimeoutRef.current);
        return;
    }

    if (uiHideTimeoutRef.current) {
        clearTimeout(uiHideTimeoutRef.current);
    }

    if (isEdgeHovered || isUiInteractionPaused) {
        setIsTempUiVisible(true);
    } else {
        uiHideTimeoutRef.current = window.setTimeout(() => {
            setIsTempUiVisible(false);
        }, autoHideDuration * 1000); // 10 seconds
    }

    return () => {
        if (uiHideTimeoutRef.current) clearTimeout(uiHideTimeoutRef.current);
    };
  }, [isEdgeHovered, isUiInteractionPaused, isAutoHideDockEnabled, isAnyWindowMaximized, autoHideDuration]);

  const isDockVisible = !isAutoHideDockEnabled || isStartMenuOpen || !isAnyWindowMaximized || (isAnyWindowMaximized && isTempUiVisible);
  const isTopBarVisible = !isAnyWindowMaximized || isTempUiVisible;

  useEffect(() => {
    // Load dock auto-hide setting from storage
    try {
      const savedToggle = localStorage.getItem(DOCK_AUTOHIDE_STORAGE_KEY);
      setIsAutoHideDockEnabled(savedToggle !== 'false');

      const savedDuration = localStorage.getItem(DOCK_AUTOHIDE_DURATION_STORAGE_KEY);
      if (savedDuration) {
          const duration = parseInt(savedDuration, 10);
          if (!isNaN(duration)) {
              setAutoHideDuration(duration);
          }
      }
    } catch (e) {
      console.error("Failed to load dock settings", e);
    }
  }, []);

  useEffect(() => {
    // Save dock auto-hide setting to storage
    try {
      localStorage.setItem(DOCK_AUTOHIDE_STORAGE_KEY, String(isAutoHideDockEnabled));
    } catch (e) {
      console.error("Failed to save dock auto-hide setting", e);
    }
  }, [isAutoHideDockEnabled]);

  useEffect(() => {
    // Save dock auto-hide duration to storage
    try {
        localStorage.setItem(DOCK_AUTOHIDE_DURATION_STORAGE_KEY, String(autoHideDuration));
    } catch (e) {
        console.error("Failed to save dock auto-hide duration setting", e);
    }
  }, [autoHideDuration]);

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
    const savedName = localStorage.getItem('gemini_os_username');
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
  
  const handleSetWallpaper = useCallback(async (url: string) => {
    if (url) {
      setWallpaperUrl(url);
      if (isAutoThemeEnabled) {
        setIsGeneratingTheme(true);
        try {
          const palette = await extractPaletteFromImage(url);
          const newTheme = generateThemeFromPalette(palette);
          handleSetThemeColors(newTheme);
        } catch (e) {
          console.error("Failed to auto-generate theme from wallpaper:", e);
          setColorMode('dark');
        } finally {
          setIsGeneratingTheme(false);
        }
      }
    }
  }, [isAutoThemeEnabled, handleSetThemeColors]);

  // --- APPEARANCE EFFECTS ---
  useEffect(() => {
    const updateEffectiveMode = () => {
        if (colorMode === 'adaptive') {
            const hour = new Date().getHours();
            setEffectiveColorMode((hour >= 6 && hour < 18) ? 'light' : 'dark');
        } else if (colorMode === 'gradient') {
            setEffectiveColorMode('light'); 
        } else {
            setEffectiveColorMode(colorMode);
        }
    };
    updateEffectiveMode();
    if (colorMode === 'adaptive') {
        const intervalId = setInterval(updateEffectiveMode, 60000);
        return () => clearInterval(intervalId);
    }
  }, [colorMode]);

  useEffect(() => {
    const bgElement = document.getElementById('system-background');
    const rootEl = document.documentElement;
    if (!bgElement) return;

    // Manage light/dark/theme class
    rootEl.classList.remove('dark', 'theme-active');
    if (effectiveColorMode === 'dark') {
      rootEl.classList.add('dark');
    } else if (effectiveColorMode === 'theme' && themeColors) {
      rootEl.classList.add('theme-active');
      Object.entries(themeColors).forEach(([key, value]) => {
          const cssVarName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          rootEl.style.setProperty(cssVarName, value as string);
      });
    }

    // Manage background style
    if (colorMode === 'gradient') {
      bgElement.style.backgroundImage = `linear-gradient(${systemBackgroundGradient.angle}deg, ${systemBackgroundGradient.from}, ${systemBackgroundGradient.to})`;
      bgElement.style.backgroundColor = '';
    } else {
      bgElement.style.backgroundImage = wallpaperUrl ? `url('${wallpaperUrl}')` : 'none';
      bgElement.style.backgroundColor = (effectiveColorMode === 'dark' || effectiveColorMode === 'theme') ? '#111827' : '#e5e7eb';
    }
  }, [effectiveColorMode, colorMode, systemBackgroundGradient, wallpaperUrl, themeColors]);


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
    localStorage.setItem('gemini_os_username', trimmedName);
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
          zIndex: (Math.max(WIDGET_Z_INDEX_BASE, ...desktopWidgets.map(w => w.zIndex))) + 1,
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
          const maxZ = Math.max(...prev.map(w => w.zIndex), WIDGET_Z_INDEX_BASE);
          return prev.map(w => w.instanceId === instanceId ? { ...w, zIndex: maxZ + 1 } : w);
      });
  }, []);

  const handleSearchInteraction = useCallback(() => {
    setUiInteractionPaused(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setUiInteractionPaused(false);
  }, []);
  
  // --- CIRCLE SEARCH LOGIC ---
  const handleCircleSearchStart = () => {
    setIsCircleSearchActive(true);
    handleSearchInteraction();
  };

  const handleCircleCapture = async (region: { x: number, y: number, width: number, height: number }) => {
    setIsCircleSearchActive(false);
    setIsProcessingCircleSearch(true);
    
    try {
        const rootEl = document.getElementById('root');
        if (!rootEl) throw new Error("Root element not found");

        const canvas = await html2canvas(rootEl, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null, // Transparent background
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height
        });

        const base64Image = canvas.toDataURL('image/png').split(',')[1];
        
        const identifiedQuery = await geminiService.identifyRegion(base64Image);
        
        // Now perform a grounded search with the identified query
        const searchResult = await geminiService.performAiSearch(identifiedQuery);
        
        setInitialAiSearchResult(searchResult);

    } catch (err) {
        console.error("Circle Search failed:", err);
        setInitialAiSearchResult({ type: 'text', text: t('ai_search_error'), sources: [] });
    } finally {
        setIsProcessingCircleSearch(false);
        handleSearchClose();
    }
  };

  // --- WINDOW SNAPPING LOGIC ---
  const handleWindowDragStart = useCallback((winId: string, event: MouseEvent) => {
      focusWindow(winId);
      dragInfoRef.current = { winId, startX: event.clientX, startY: event.clientY, isUnsnapping: false };
  }, [focusWindow]);

  const handleWindowDrag = useCallback((winId: string, event: MouseEvent) => {
      const win = windows.find(w => w.id === winId);
      if (!win) return;

      if (win.snapState && !dragInfoRef.current.isUnsnapping) {
          const dx = event.clientX - dragInfoRef.current.startX;
          const dy = event.clientY - dragInfoRef.current.startY;
          if (Math.sqrt(dx * dx + dy * dy) > 20) { // Drag threshold
              unsnapWindow(winId);
              dragInfoRef.current.isUnsnapping = true;
          }
          return;
      }
      
      if (win.isMaximized) return;

      if (event.clientY < 5) {
          setSnapPreview('top');
      } else if (event.clientX < 5) {
          setSnapPreview('left');
      } else if (event.clientX > window.innerWidth - 5) {
          setSnapPreview('right');
      } else {
          setSnapPreview(null);
      }
  }, [windows, unsnapWindow]);

  const handleWindowDragEnd = useCallback((winId: string, event: MouseEvent) => {
      if (snapPreview) {
          const win = windows.find(w => w.id === winId);
          if (win && !win.isMaximized) { // Prevent re-maximizing
             if (snapPreview === 'top') {
                  toggleMaximizeWindow(winId);
              } else {
                  snapWindow(winId, snapPreview);
              }
          }
      }
      setSnapPreview(null);
      dragInfoRef.current = { winId: null, startX: 0, startY: 0, isUnsnapping: false };
  }, [snapPreview, snapWindow, toggleMaximizeWindow, windows]);


  if (isBooting) {
    return <StartupAnimation onFinished={() => { setIsBooting(false); setIsShutdown(false); }} />;
  }
  
  if (!isSetupComplete) {
      return <SetupScreen onSetupComplete={handleSetupComplete} wallpaperUrl={wallpaperUrl} />;
  }

  if (!isAuthenticated) {
    return <LockScreen onUnlockSuccess={() => setIsAuthenticated(true)} wallpaperUrl={wallpaperUrl} userName={userName!} inspirationalCopy={inspirationalCopy} />;
  }

  if (isShutdown) {
    return <ShutdownScreen />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Particles particles={particles} onAnimationEnd={onParticleAnimationEnd} />
      {isCircleSearchActive && <CircleSearchOverlay onCapture={handleCircleCapture} onCancel={() => setIsCircleSearchActive(false)} />}
      <SnapPreview side={snapPreview} />
      
      <header className={`fixed top-8 left-1/2 -translate-x-1/2 w-full flex flex-col items-center pointer-events-none space-y-4 transition-transform duration-300 ease-in-out ${isTopBarVisible ? 'translate-y-0' : '-translate-y-48'} ${isAnyWindowMaximized && isTempUiVisible ? 'z-50' : 'z-10'}`}>
            <DesktopClock timeFormat={timeFormat} />
            <div className="w-full max-w-2xl pointer-events-auto">
                <AiSearch
                  onInteraction={handleSearchInteraction}
                  onClose={handleSearchClose}
                  onCircleSearchStart={handleCircleSearchStart}
                  isProcessingCircleSearch={isProcessingCircleSearch}
                  initialResult={initialAiSearchResult}
                />
            </div>
      </header>

      <WidgetPanel isOpen={isWidgetPanelOpen} onClose={() => setIsWidgetPanelOpen(false)} timeFormat={timeFormat} />
      <MinimizedTaskbar apps={visibleApps} windows={windows} onRestore={restoreAndFocusWindow} />
      {isStartMenuMounted && <StartMenu isOpen={isStartMenuOpen} apps={visibleApps} onAppClick={handleAppClick} onRestart={handleRestart} onShutdown={handleShutdown} onClose={() => setIsStartMenuOpen(false)} onExited={handleStartMenuExited} windows={windows} userName={userName} />}
      <main className="h-full w-full relative">
        <Desktop
            apps={visibleApps}
            onAppDoubleClick={launchApp}
            onWidgetDrop={handleWidgetDrop}
            isTopBarVisible={isTopBarVisible}
        />
        
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
            appProps.setThemeColors = handleSetThemeColors;
            appProps.setInspirationalCopy = handleSetInspirationalCopy;
            appProps.close = () => closeWindow(win.id);
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
            appProps.setThemeColors = handleSetThemeColors;
            appProps.themeColors = themeColors;
            appProps.aiSettings = aiSettings;
            appProps.setAiSettings = setAiSettings;
            appProps.isAutoHideDockEnabled = isAutoHideDockEnabled;
            appProps.setIsAutoHideDockEnabled = setIsAutoHideDockEnabled;
            appProps.autoHideDuration = autoHideDuration;
            appProps.setAutoHideDuration = setAutoHideDuration;
            appProps.isAutoThemeEnabled = isAutoThemeEnabled;
            appProps.setIsAutoThemeEnabled = setIsAutoThemeEnabled;
          }

          return (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              position={win.position}
              size={win.size}
              zIndex={win.zIndex}
              isFocused={win.id === focusedWindowId}
              isMaximized={win.isMaximized}
              isMinimized={win.isMinimized}
              isClosing={win.isClosing}
              isMinimizing={win.isMinimizing}
              isRestoring={win.isRestoring}
              snapState={win.snapState}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onPositionChange={(newPos) => updateWindowState(win.id, { position: newPos })}
              onMaximizeToggle={() => toggleMaximizeWindow(win.id)}
              onCloseAnimationComplete={() => removeWindow(win.id)}
              onMinimizeAnimationComplete={() => finishMinimize(win.id)}
              onRestoreAnimationComplete={() => finishRestore(win.id)}
              onDragStart={handleWindowDragStart}
              onDrag={handleWindowDrag}
              onDragEnd={handleWindowDragEnd}
              onSnap={(layout, area) => snapWindowToLayout(win.id, layout, area)}
              isAiFeature={AppDefinition?.isAiFeature}
            >
              <AppContent {...appProps} {...win.props} />
            </Window>
          );
        })}
      </main>
      <Dock 
        apps={visibleApps} 
        windows={windows} 
        onAppClick={launchApp} 
        onStartClick={() => setIsStartMenuOpen(prev => !prev)} 
        onWidgetsClick={() => setIsWidgetPanelOpen(prev => !prev)} 
        timeFormat={timeFormat} 
        isAiEnabled={aiSettings.isEnabled} 
        aiSettings={aiSettings}
        isDockVisible={isDockVisible}
        focusedWindowId={focusedWindowId}
        onFocusWindow={focusWindow}
        onFocusWindows={focusWindows}
      />
    </div>
  );
}

export default App;