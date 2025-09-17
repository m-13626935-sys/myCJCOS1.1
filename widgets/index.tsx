
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import CalculatorApp from '../apps/CalculatorApp';
import type { AppProps, CalendarEvent } from '../types';

// ---- ScheduleWidget ----
const SCHEDULE_STORAGE_KEY = 'schedule_app_events';

export const ScheduleWidget: React.FC = () => {
    const { t } = useLanguage();
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const updateEvents = useCallback(() => {
        try {
            const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            const allEvents: CalendarEvent[] = saved ? JSON.parse(saved) : [];
            const today = new Date();
            const todayEvents = allEvents
                .filter(event => {
                    const eventDate = new Date(event.startTime);
                    return eventDate.getFullYear() === today.getFullYear() &&
                           eventDate.getMonth() === today.getMonth() &&
                           eventDate.getDate() === today.getDate();
                })
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            setEvents(todayEvents);
        } catch (e) {
            console.error("Failed to load schedule events for widget:", e);
        }
    }, []);

    useEffect(() => {
        updateEvents();
        window.addEventListener('storage', updateEvents);
        window.addEventListener('schedule-updated', updateEvents);
        
        return () => {
            window.removeEventListener('storage', updateEvents);
            window.removeEventListener('schedule-updated', updateEvents);
        };
    }, [updateEvents]);

    return (
        <div className="w-full h-full bg-blue-500/10 p-4 rounded-xl text-outline overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold mb-2 flex-shrink-0">{t('schedule_widget_today')}</h3>
            <div className="flex-grow overflow-y-auto -mr-2 pr-2">
                {events.length > 0 ? (
                    <ul className="space-y-2">
                        {events.map(event => (
                            <li key={event.id} className="text-sm flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.color }}></div>
                                <div className="flex-grow">
                                    <p className="font-semibold leading-tight">{event.title}</p>
                                    <p className="text-xs opacity-80">{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm opacity-70 h-full flex items-center justify-center">{t('schedule_widget_no_events')}</p>
                )}
            </div>
        </div>
    );
};


// ---- Timer Logic (for Clock and Timer widgets) ----
const TIMER_STORAGE_KEY = 'clock_app_timer_state';

interface TimerState {
  inputs: { h: string; m: string; s: string };
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  endTime: number;
}

const defaultTimerState: TimerState = {
  inputs: { h: '', m: '', s: '' },
  timeLeft: 0,
  isRunning: false,
  isFinished: false,
  endTime: 0,
};

const getTimerState = (): TimerState => {
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
    } catch (e) {
        console.error("Failed to load timer state:", e);
    }
    return defaultTimerState;
};

const formatCountdown = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

// ---- TimerWidget ----
export const TimerWidget: React.FC = () => {
    const { t } = useLanguage();
    const [state, setState] = useState<TimerState>(getTimerState);
    const timerRef = useRef<number | null>(null);

    const { timeLeft, isRunning, isFinished, inputs } = state;

    const updateStateFromStorage = useCallback(() => {
        setState(getTimerState());
    }, []);

    useEffect(() => {
        window.addEventListener('storage', updateStateFromStorage);
        window.addEventListener('timer-updated', updateStateFromStorage);
        
        return () => {
            window.removeEventListener('storage', updateStateFromStorage);
            window.removeEventListener('timer-updated', updateStateFromStorage);
        };
    }, [updateStateFromStorage]);
    
    useEffect(() => {
        if (isRunning) {
            timerRef.current = window.setInterval(() => {
                const newTimeLeft = state.endTime - Date.now();
                if (newTimeLeft > 0) {
                    setState(s => ({ ...s, timeLeft: newTimeLeft }));
                } else {
                    // Let the main app handle the finish state update
                    setState(s => ({...s, isRunning: false, isFinished: true, timeLeft: 0}));
                    if(timerRef.current) clearInterval(timerRef.current);
                }
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, state.endTime]);


    const totalSecondsSet = (parseInt(inputs.h) || 0) * 3600 + (parseInt(inputs.m) || 0) * 60 + (parseInt(inputs.s) || 0);
    const isTimerSet = timeLeft > 0 || isRunning || totalSecondsSet > 0;

    const handleReset = () => {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(defaultTimerState));
        window.dispatchEvent(new CustomEvent('timer-updated'));
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-900/20 p-4 rounded-xl text-outline">
            <h3 className="text-sm font-bold absolute top-3 left-4">{t('widget_timer_name')}</h3>
            {isTimerSet ? (
                 <div className={`font-mono text-4xl tracking-wider text-center ${isFinished ? 'animate-pulse' : ''}`} aria-live="polite">
                    {formatCountdown(timeLeft)}
                </div>
            ) : (
                <div className="text-center opacity-70">
                    <p>{t('widget_timer_not_set')}</p>
                </div>
            )}
            
            {isTimerSet && (
                 <button 
                    onClick={handleReset} 
                    className="absolute bottom-3 right-3 px-2 py-1 text-xs bg-black/20 rounded-md hover:bg-black/40 transition-colors"
                >
                    {t('timer_cancel')}
                </button>
            )}
        </div>
    );
};


// ---- CalculatorWidget ----
export const CalculatorWidget: React.FC = () => {
    return (
        <div className="w-full h-full bg-black/20 rounded-xl overflow-hidden">
             <CalculatorApp />
        </div>
    );
};
