import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { AppDefinition, AppCategory, WindowInstance, TimeFormat, CalendarEvent, AISettings } from '../types';
import Clock from './Clock';
import DockCategoryGroup from './DockCategoryGroup';
import { CATEGORY_ORDER } from '../constants';
import AssistantPopup from './AssistantPopup';
import { useLanguage } from '../contexts/LanguageContext';

// ---- TaskbarSchedule Component ----
const SCHEDULE_STORAGE_KEY = 'schedule_app_events';

const getNextEvent = (): CalendarEvent | null => {
    try {
        const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (!saved) return null;

        const events = JSON.parse(saved) as CalendarEvent[];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // FIX: The original map created objects where `startTime` was a Date object,
        // which mismatches the `CalendarEvent` type that expects a string.
        // This version filters and sorts the original array without changing the type of its items.
        const upcomingEventsToday = events
            .filter(e => {
                const eventDate = new Date(e.startTime);
                return eventDate >= today &&
                       eventDate.getFullYear() === today.getFullYear() &&
                       eventDate.getMonth() === today.getMonth() &&
                       eventDate.getDate() === today.getDate() &&
                       eventDate > now;
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return upcomingEventsToday[0] || null;
    } catch {
        return null;
    }
};

const TaskbarSchedule: React.FC<{ onAppClick: (appId: string) => void }> = ({ onAppClick }) => {
    const { t } = useLanguage();
    const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(getNextEvent);
    const intervalRef = useRef<number | null>(null);

    const updateSchedule = useCallback(() => {
        setNextEvent(getNextEvent());
    }, []);

    useEffect(() => {
        updateSchedule();
        window.addEventListener('storage', updateSchedule);
        window.addEventListener('schedule-updated', updateSchedule);
        return () => {
            window.removeEventListener('storage', updateSchedule);
            window.removeEventListener('schedule-updated', updateSchedule);
        };
    }, [updateSchedule]);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Set an interval to re-check for the next event, e.g., every minute
        intervalRef.current = window.setInterval(updateSchedule, 60000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [updateSchedule]);

    if (!nextEvent) {
        return null;
    }

    const eventTime = new Date(nextEvent.startTime).toLocaleTimeString(t('locale_code'), {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return (
        <button
            onClick={() => onAppClick('schedule')}
            className="jelly-button h-10 px-3 text-outline flex items-center space-x-2"
            aria-label={`${t('schedule_taskbar_upcoming')}: ${nextEvent.title} at ${eventTime}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zM4.5 8.25a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-11z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold truncate max-w-[150px]">{nextEvent.title}</span>
            <span className="text-sm font-mono opacity-80">{eventTime}</span>
        </button>
    );
};


// ---- TaskbarTimer Component ----
const TIMER_STORAGE_KEY = 'clock_app_timer_state';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  endTime: number;
  inputs: { h: string; m: string; s: string };
  isFinished: boolean;
}

const getTimerState = (): TimerState | null => {
    try {
        const savedStateJSON = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON) as TimerState;
            if (savedState.isRunning) {
                const newTimeLeft = savedState.endTime - Date.now();
                if (newTimeLeft > 0) {
                    return { ...savedState, timeLeft: newTimeLeft };
                }
                 return { ...savedState, isRunning: false, timeLeft: 0, isFinished: true };
            }
            return savedState;
        }
    } catch (e) { console.error("Failed to load timer state for taskbar:", e); }
    return null;
};

const formatCountdown = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSeconds / 3600).toString();
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return totalSeconds >= 3600 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const TaskbarTimer: React.FC<{ onAppClick: (appId: string) => void }> = ({ onAppClick }) => {
    const [timerState, setTimerState] = useState<TimerState | null>(getTimerState);
    const intervalRef = React.useRef<number | null>(null);
    const { t } = useLanguage();

    const updateTimer = useCallback(() => {
        setTimerState(getTimerState());
    }, []);

    useEffect(() => {
        updateTimer();
        window.addEventListener('storage', updateTimer);
        window.addEventListener('timer-updated', updateTimer);
        return () => {
            window.removeEventListener('storage', updateTimer);
            window.removeEventListener('timer-updated', updateTimer);
        };
    }, [updateTimer]);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timerState?.isRunning) {
            intervalRef.current = window.setInterval(() => {
                const newTimeLeft = timerState.endTime - Date.now();
                if (newTimeLeft > 0) {
                    setTimerState(s => s ? { ...s, timeLeft: newTimeLeft } : null);
                } else {
                    updateTimer();
                }
            }, 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timerState?.isRunning, timerState?.endTime, updateTimer]);
    
    const totalSecondsSet = timerState ? (parseInt(timerState.inputs.h) || 0) * 3600 + (parseInt(timerState.inputs.m) || 0) * 60 + (parseInt(timerState.inputs.s) || 0) : 0;
    const isTimerActive = timerState && (timerState.timeLeft > 0 || timerState.isRunning) && totalSecondsSet > 0 && !timerState.isFinished;

    if (!isTimerActive) {
        return null;
    }
    
    return (
        <button
            onClick={() => onAppClick('clock')}
            className="jelly-button h-10 px-3 text-outline flex items-center space-x-2"
            aria-label={t('app_clock')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
            </svg>
            <span className="font-mono text-sm">{formatCountdown(timerState.timeLeft)}</span>
        </button>
    );
};


interface DockProps {
  apps: AppDefinition[];
  onAppClick: (appId: string) => void;
  onStartClick: () => void;
  onWidgetsClick: () => void;
  windows: WindowInstance[];
  timeFormat: TimeFormat;
  isAiEnabled: boolean;
  aiSettings: AISettings;
}

const StartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3,11H11V3H3M5,5H9V9H5M3,21H11V13H3M5,15H9V19H5M13,21H21V13H13M15,15H19V19H15M13,3V11H21V3M15,5H19V9H15Z" />
    </svg>
);

const WidgetsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 11h8V3H3v8zm0 10h8v-8H3v8zm10-10h8V3h-8v8zm0 10h8v-8h-8v8z" />
    </svg>
);

const AiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L14 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
    </svg>
);

const Dock: React.FC<DockProps> = ({ apps, onAppClick, onStartClick, onWidgetsClick, windows, timeFormat, isAiEnabled, aiSettings }) => {
  const { t } = useLanguage();
  const [openCategory, setOpenCategory] = useState<AppCategory | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const assistantRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAssistantOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (assistantRef.current && !assistantRef.current.contains(event.target as Node)) {
        setIsAssistantOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssistantOpen]);

  const categorizedApps = useMemo(() => {
    return apps.reduce((acc, app) => {
      if (app.category) {
        if (!acc[app.category]) {
          acc[app.category] = [];
        }
        acc[app.category].push(app);
      }
      return acc;
    }, {} as Record<AppCategory, AppDefinition[]>);
  }, [apps]);

  const handleToggleCategory = (category: AppCategory) => {
    setOpenCategory(prev => (prev === category ? null : category));
  };

  return (
    <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 z-30">
       <div className="taskbar-background backdrop-blur-3xl ring-1 ring-black/10 dark:ring-white/10 shadow-2xl rounded-2xl flex items-center justify-between h-full px-3 space-x-2">
            {/* Left Section */}
            <div className="flex items-center">
                 <button
                    onClick={onWidgetsClick}
                    className="jelly-button h-12 w-12 text-outline"
                    aria-label={t('widgets_panel_title')}
                >
                    <WidgetsIcon />
                </button>
            </div>
            
            <div className="h-full flex-shrink-0 w-px bg-black/20 dark:bg-white/20"></div>

            {/* Center Section */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => {
                      onStartClick();
                      setOpenCategory(null);
                    }}
                    className="jelly-button h-12 w-12 text-outline"
                    aria-label={t('start_menu_aria')}
                >
                  <StartIcon />
                </button>

                <div className="h-6 w-px bg-black/20 dark:bg-white/20"></div>

                {CATEGORY_ORDER.map((category) => {
                  const appsInCategory = categorizedApps[category] || [];
                  if (appsInCategory.length === 0) return null;
                  
                  return (
                    <DockCategoryGroup
                      key={category}
                      category={category}
                      apps={appsInCategory}
                      isOpen={openCategory === category}
                      onToggle={() => handleToggleCategory(category)}
                      onAppClick={onAppClick}
                      onClose={() => setOpenCategory(null)}
                      windows={windows}
                    />
                  );
                })}
            </div>
            
            <div className="h-full flex-shrink-0 w-px bg-black/20 dark:bg-white/20"></div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
                <TaskbarSchedule onAppClick={onAppClick} />
                <TaskbarTimer onAppClick={onAppClick} />
                {isAiEnabled && (
                    <div className="relative" ref={assistantRef}>
                        <button
                            onClick={() => setIsAssistantOpen(prev => !prev)}
                            className="jelly-button h-10 w-10 text-outline"
                            aria-label={t('assistant_aria')}
                            aria-haspopup="true"
                            aria-expanded={isAssistantOpen}
                        >
                            <AiIcon />
                        </button>
                        {isAssistantOpen && <AssistantPopup onClose={() => setIsAssistantOpen(false)} aiSettings={aiSettings} />}
                    </div>
                )}
                <div className="h-6 w-px bg-black/20 dark:bg-white/20"></div>
                <Clock timeFormat={timeFormat} />
            </div>
       </div>
    </footer>
  );
};

export default Dock;