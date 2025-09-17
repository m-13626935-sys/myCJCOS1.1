import { useState, useCallback, useEffect } from 'react';
import type { WindowInstance, AppDefinition } from '../types';

const Z_INDEX_BASE = 10;
const DOCK_HEIGHT = 56; // Corresponds to h-14 in Tailwind CSS

export function useWindows(apps: AppDefinition[], t: (key: string) => string) {
  const [windows, setWindows] = useState<WindowInstance[]>([]);

  const openWindow = useCallback((appId: string, options?: { props?: Record<string, any>, title?: string }) => {
    setWindows(prevWindows => {
      // For apps that should only have one instance, we can focus the existing one.
      // This logic can be extended based on an app property, e.g., `isSingleton`.
      // For now, let's allow multiple chat windows but focus an existing one if launched from a generic source.
      if (!options?.title && prevWindows.some(w => w.appId === appId)) {
         const existingWindow = prevWindows.find(w => w.appId === appId);
         if (existingWindow) {
            return prevWindows.map(w => ({
              ...w,
              zIndex: w.id === existingWindow.id ? Z_INDEX_BASE + prevWindows.length : w.zIndex,
            })).sort((a,b) => a.zIndex - b.zIndex);
         }
      }

      const appDef = apps.find(app => app.id === appId);
      if (!appDef || !appDef.component) return prevWindows;

      const newWindow: WindowInstance = {
        id: `${appId}-${Date.now()}`,
        appId,
        title: options?.title || t(appDef.name),
        position: { x: 100 + prevWindows.length * 40, y: 100 + prevWindows.length * 40 },
        size: appDef.defaultSize || { width: 640, height: 480 },
        zIndex: Z_INDEX_BASE + prevWindows.length,
        isMaximized: false,
        isMinimized: false,
        isClosing: false,
        props: options?.props,
      };

      return [...prevWindows, newWindow];
    });
  }, [apps, t]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, isClosing: true } : w))
    );
  }, []);
  
  const removeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), Z_INDEX_BASE);
      return prev.map(w => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev =>
        prev.map(w => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const restoreAndFocusWindow = useCallback((id: string) => {
    setWindows(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex), Z_INDEX_BASE);
        return prev.map(w =>
            w.id === id ? { ...w, isMinimized: false, zIndex: maxZ + 1 } : w
        );
    });
  }, []);

  const toggleMaximizeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
          if (w.isMaximized) {
            // Restore to previous state
            return {
              ...w,
              isMaximized: false,
              position: w.previousState?.position || { x: 100, y: 100 },
              size: w.previousState?.size || { width: 640, height: 480 },
              previousState: undefined,
            };
          } else {
            // Maximize the window
            return {
              ...w,
              isMaximized: true,
              previousState: { position: w.position, size: w.size },
              position: { x: 0, y: 0 },
              size: { width: window.innerWidth, height: window.innerHeight - DOCK_HEIGHT },
            };
          }
        }
        return w;
      })
    );
  }, []);

  const updateWindowState = useCallback((id: string, updates: Partial<WindowInstance>) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  const closeAllWindows = useCallback(() => {
    // Animate all windows out
    setWindows(prev => prev.map(w => ({ ...w, isClosing: true })));
    // Remove them after animation
    setTimeout(() => setWindows([]), 200);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindows(currentWindows =>
        currentWindows.map(w => {
          if (w.isMaximized) {
            return {
              ...w,
              size: {
                width: window.innerWidth,
                height: window.innerHeight - DOCK_HEIGHT,
              },
            };
          }
          return w;
        })
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return { windows, openWindow, closeWindow, focusWindow, minimizeWindow, restoreAndFocusWindow, updateWindowState, closeAllWindows, toggleMaximizeWindow, removeWindow };
}