import { useState, useCallback, useEffect } from 'react';
import type { WindowInstance, AppDefinition } from '../types';

const Z_INDEX_BASE = 30;

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
        snapState: null,
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
  
  const focusWindows = useCallback((windowIds: string[]) => {
    setWindows(prev => {
        if (windowIds.length === 0) return prev;
        const maxZ = Math.max(...prev.map(w => w.zIndex), Z_INDEX_BASE);
        
        const windowMap = new Map(prev.map(w => [w.id, w]));

        const windowsToFocus = windowIds
            .map(id => windowMap.get(id))
            .filter((w): w is WindowInstance => !!w)
            .sort((a, b) => a.zIndex - b.zIndex);

        let currentZ = maxZ + 1;
        const updatedWindows = new Map<string, WindowInstance>();

        for (const win of windowsToFocus) {
            updatedWindows.set(win.id, {
                ...win,
                isMinimized: false,
                isRestoring: win.isMinimized ? true : win.isRestoring,
                zIndex: currentZ++,
            });
        }
        
        return prev.map(w => updatedWindows.get(w.id) || w);
    });
  }, []);


  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev =>
        prev.map(w => (w.id === id ? { ...w, isMinimizing: true, isMinimized: false } : w))
    );
  }, []);

  const finishMinimize = useCallback((id: string) => {
    setWindows(prev =>
        prev.map(w => (w.id === id ? { ...w, isMinimized: true, isMinimizing: false } : w))
    );
  }, []);

  const restoreAndFocusWindow = useCallback((id: string) => {
    setWindows(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex), Z_INDEX_BASE);
        return prev.map(w =>
            w.id === id ? { ...w, isMinimized: false, isRestoring: true, zIndex: maxZ + 1 } : w
        );
    });
  }, []);

  const finishRestore = useCallback((id: string) => {
    setWindows(prev =>
        prev.map(w => (w.id === id ? { ...w, isRestoring: false } : w))
    );
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
              snapState: null,
              position: w.previousState?.position || { x: 100, y: 100 },
              size: w.previousState?.size || { width: 640, height: 480 },
              previousState: undefined,
            };
          } else {
            // Maximize the window
            return {
              ...w,
              isMaximized: true,
              snapState: null,
              previousState: { position: w.position, size: w.size },
              position: { x: 0, y: 0 },
              size: { width: window.innerWidth, height: window.innerHeight },
            };
          }
        }
        return w;
      })
    );
  }, []);

  const snapWindowToLayout = useCallback((id: string, layout: string, area: string) => {
    setWindows(prev => prev.map(w => {
        if (w.id === id) {
            const previousState = w.isMaximized || w.snapState ? w.previousState : { position: w.position, size: w.size };
            let newPos = { x: 0, y: 0 };
            let newSize = { width: window.innerWidth, height: window.innerHeight };

            switch (layout) {
                case '50-50-horizontal':
                    newSize.width /= 2;
                    if (area === 'right') newPos.x = window.innerWidth / 2;
                    break;
                case 'main-side-right':
                    if (area === 'main') {
                        newSize.width *= 2 / 3;
                    } else { // 'side'
                        newSize.width /= 3;
                        newPos.x = window.innerWidth * 2 / 3;
                    }
                    break;
                case 'thirds-vertical':
                    newSize.width /= 3;
                    if (area === 'middle') newPos.x = window.innerWidth / 3;
                    if (area === 'right') newPos.x = (window.innerWidth / 3) * 2;
                    break;
                case 'quadrants':
                    newSize.width /= 2;
                    newSize.height /= 2;
                    if (area.includes('right')) newPos.x = window.innerWidth / 2;
                    if (area.includes('bottom')) newPos.y = window.innerHeight / 2;
                    break;
            }

            return {
                ...w,
                isMaximized: false,
                snapState: { layout, area },
                previousState,
                position: newPos,
                size: newSize,
            };
        }
        return w;
    }));
  }, []);

  const snapWindow = useCallback((id: string, side: 'left' | 'right') => {
    snapWindowToLayout(id, '50-50-horizontal', side);
  }, [snapWindowToLayout]);

  const unsnapWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
        if (w.id === id) {
            if (w.snapState && w.previousState) {
                return {
                    ...w,
                    isMaximized: false,
                    snapState: null,
                    position: w.previousState.position,
                    size: w.previousState.size,
                    previousState: undefined,
                };
            }
        }
        return w;
    }));
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
                height: window.innerHeight,
              },
            };
          }
          if (w.snapState) {
            const { layout, area } = w.snapState;
            let newPos = { x: 0, y: 0 };
            let newSize = { width: window.innerWidth, height: window.innerHeight };

            switch (layout) {
                case '50-50-horizontal':
                    newSize.width /= 2;
                    if (area === 'right') newPos.x = window.innerWidth / 2;
                    break;
                case 'main-side-right':
                    if (area === 'main') {
                        newSize.width = window.innerWidth * 2 / 3;
                    } else { // 'side'
                        newSize.width = window.innerWidth / 3;
                        newPos.x = window.innerWidth * 2 / 3;
                    }
                    break;
                case 'thirds-vertical':
                    newSize.width /= 3;
                    if (area === 'middle') newPos.x = window.innerWidth / 3;
                    if (area === 'right') newPos.x = (window.innerWidth / 3) * 2;
                    break;
                case 'quadrants':
                    newSize.width /= 2;
                    newSize.height /= 2;
                    if (area.includes('right')) newPos.x = window.innerWidth / 2;
                    if (area.includes('bottom')) newPos.y = window.innerHeight / 2;
                    break;
            }
            return { ...w, position: newPos, size: newSize };
          }
          return w;
        })
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return { windows, openWindow, closeWindow, focusWindow, minimizeWindow, restoreAndFocusWindow, updateWindowState, closeAllWindows, toggleMaximizeWindow, removeWindow, finishMinimize, finishRestore, snapWindow, unsnapWindow, snapWindowToLayout, focusWindows };
}