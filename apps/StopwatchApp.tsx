import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Shared alarm sound for the timer
const alarmSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSh1T19O/w==");

// --- World Clock Components ---

const TimezoneRow: React.FC<{ offset: number; localOffset: number }> = React.memo(({ offset, localOffset }) => {
    const { t } = useLanguage();
    const [timeParts, setTimeParts] = useState<{time: string, period: string}>({time: '', period: ''});
    
    const diff = offset - localOffset;
    let diffString: string;
    if (diff === 0) {
        diffString = t('clock_local_time');
    } else {
        const hours = Math.abs(diff);
        const key = diff > 0 ? 'clock_hours_ahead' : 'clock_hours_behind';
        diffString = t(key, { hours: hours.toString() });
    }

    const getIANATimezone = useCallback((offset: number) => {
        if (offset === 0) return 'Etc/GMT';
        return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
    }, []);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = {
                timeZone: getIANATimezone(offset),
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            };
            const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now); // Use consistent base locale for parsing
            const timeValue = parts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('').trim();
            const periodValue = parts.find(p => p.type === 'dayPeriod')?.value || '';
            setTimeParts({ time: timeValue, period: periodValue });
        };
        update();
        const timerId = setInterval(update, 1000);
        return () => clearInterval(timerId);
    }, [offset, getIANATimezone]);

    return (
        <div className="flex justify-between items-baseline py-3 px-2 border-b border-black/10 dark:border-white/10">
            <div>
                <p className="text-lg font-medium">{`UTC${offset >= 0 ? '+' : ''}${offset}`}</p>
                <p className="text-sm opacity-70">{diffString}</p>
            </div>
            <div className="text-3xl font-mono flex items-baseline">
                <span>{timeParts.time}</span>
                {timeParts.period && <span className="text-xl font-sans ml-1.5">{timeParts.period}</span>}
            </div>
        </div>
    );
});

const WorldClock: React.FC = () => {
    const localOffset = useMemo(() => -new Date().getTimezoneOffset() / 60, []);
    const offsets = useMemo(() => Array.from({ length: 27 }, (_, i) => 14 - i), []);

    return (
        <div className="h-full overflow-y-auto pb-8 pr-2 -mr-4">
            {offsets.map((offset) => (
                <TimezoneRow key={offset} offset={offset} localOffset={localOffset} />
            ))}
        </div>
    );
};

// --- Timer Component (re-integrated) ---
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

const Timer: React.FC = () => {
    const { t } = useLanguage();
    const [state, setState] = useState<TimerState>(() => {
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
    });

    const timerRef = useRef<number | null>(null);
    const baseButtonClass = "w-32 py-3 text-lg font-semibold rounded-lg ring-1 ring-inset shadow-lg transition-all duration-150 focus:outline-none active:shadow-inner active:scale-95 text-outline";
    
    const { inputs, timeLeft, isRunning, isFinished } = state;
    
    const totalSecondsSet = useMemo(() => {
        const h = parseInt(inputs.h) || 0;
        const m = parseInt(inputs.m) || 0;
        const s = parseInt(inputs.s) || 0;
        return h * 3600 + m * 60 + s;
    }, [inputs]);
    
    useEffect(() => {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('timer-updated'));
    }, [state]);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = window.setInterval(() => {
                const newTimeLeft = state.endTime - Date.now();
                if (newTimeLeft <= 0) {
                    clearInterval(timerRef.current!);
                    alarmSound.play().catch(e => console.error("Error playing sound:", e));
                    setState(s => ({ ...s, timeLeft: 0, isRunning: false, isFinished: true }));
                } else {
                    setState(s => ({ ...s, timeLeft: newTimeLeft }));
                }
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, state.endTime]);
    
    const handleStartPause = () => {
        if (totalSecondsSet <= 0 && timeLeft <= 0) return;

        const newIsRunning = !isRunning;
        let newTimeLeft = timeLeft;
        
        if (newIsRunning && timeLeft <= 0) { // Starting from scratch
             newTimeLeft = totalSecondsSet * 1000;
        }

        const newEndTime = newIsRunning ? Date.now() + newTimeLeft : state.endTime;

        setState(s => ({ ...s, isRunning: newIsRunning, timeLeft: newTimeLeft, endTime: newEndTime, isFinished: false }));
    };

    const handleReset = () => {
        setState(defaultTimerState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setState(s => ({ ...s, inputs: { ...s.inputs, [name]: sanitizedValue }}));
    };

    const formatCountdown = (ms: number) => {
        const totalSeconds = Math.ceil(ms / 1000);
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const isTimerActive = timeLeft > 0 || isRunning;

    const startPauseText = isRunning ? t('timer_pause') : (timeLeft > 0 ? t('timer_resume') : t('timer_start'));

    return (
        <div className="h-full flex flex-col items-center justify-center">
             {isTimerActive ? (
                <div className={`font-mono text-7xl tracking-wider w-full text-center py-4 ${isFinished ? 'animate-pulse' : ''}`} aria-live="polite">
                    {formatCountdown(timeLeft)}
                </div>
             ) : (
                <div className="flex items-center justify-center space-x-2 my-4">
                    <input type="text" name="h" value={inputs.h} onChange={handleInputChange} placeholder={t('timer_placeholder_hours')} className="w-24 p-2 text-5xl text-center font-mono bg-black/10 dark:bg-white/10 text-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                    <span className="text-5xl">:</span>
                    <input type="text" name="m" value={inputs.m} onChange={handleInputChange} placeholder={t('timer_placeholder_minutes')} className="w-24 p-2 text-5xl text-center font-mono bg-black/10 dark:bg-white/10 text-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                    <span className="text-5xl">:</span>
                    <input type="text" name="s" value={inputs.s} onChange={handleInputChange} placeholder={t('timer_placeholder_seconds')} className="w-24 p-2 text-5xl text-center font-mono bg-black/10 dark:bg-white/10 text-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                </div>
             )}
            <div className="flex space-x-4 mt-8">
                <button onClick={handleReset} disabled={!isTimerActive && totalSecondsSet === 0} className={`${baseButtonClass} bg-gradient-to-b from-gray-300 to-gray-100 dark:from-gray-600 dark:to-gray-800 ring-gray-400/50 dark:ring-gray-500/50 hover:from-gray-200 dark:hover:from-gray-500 disabled:from-gray-200 disabled:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-inner`}>{t('timer_cancel')}</button>
                <button onClick={handleStartPause} disabled={!isTimerActive && totalSecondsSet === 0} className={`${baseButtonClass} focus:ring-2 ${isRunning ? 'bg-gradient-to-b from-orange-500 to-orange-700 ring-orange-800/50 hover:from-orange-400 focus:ring-orange-400' : 'bg-gradient-to-b from-green-500 to-green-700 ring-green-800/50 hover:from-green-400 focus:ring-green-400'} disabled:from-gray-200 disabled:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-inner`}>{startPauseText}</button>
            </div>
        </div>
    );
};

// --- Main App Component ---
const TAB_STORAGE_KEY = 'clock_app_active_tab';

const ClockApp: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'world' | 'timer'>(() => {
        const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
        return savedTab === 'timer' ? 'timer' : 'world';
    });

    useEffect(() => {
        localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);


    const TabButton = useCallback(({ tabName, label }: { tabName: 'world' | 'timer'; label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 py-3 text-center text-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 text-outline ${activeTab === tabName ? 'opacity-100 border-b-2 border-white/80' : 'opacity-70 hover:bg-gray-500/10 dark:hover:bg-white/5'}`}
            role="tab"
            aria-selected={activeTab === tabName}
        >
            {label}
        </button>
    ), [activeTab]);

    return (
        <div className="h-full flex flex-col bg-transparent text-outline">
            <header className="flex-shrink-0 border-b border-black/10 dark:border-white/10">
                <nav className="flex" role="tablist">
                    <TabButton tabName="world" label={t('clock_tab_world')} />
                    <TabButton tabName="timer" label={t('clock_tab_timer')} />
                </nav>
            </header>
            <main className="flex-grow pt-4 overflow-hidden" role="tabpanel">
                {activeTab === 'world' && <WorldClock />}
                {activeTab === 'timer' && <Timer />}
            </main>
        </div>
    );
};

export default ClockApp;