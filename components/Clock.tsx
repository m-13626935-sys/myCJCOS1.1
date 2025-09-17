import React, { useState, useEffect, useRef } from 'react';
import CalendarPopup from './CalendarPopup';
import { useLanguage } from '../contexts/LanguageContext';
import type { TimeFormat } from '../types';

interface ClockProps {
    timeFormat: TimeFormat;
}

const Clock: React.FC<ClockProps> = ({ timeFormat }) => {
  const [time, setTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (clockRef.current && !clockRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12h',
  };
  const timeParts = new Intl.DateTimeFormat(t('locale_code'), timeOptions).formatToParts(time);
  const timeValue = timeParts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('');
  const periodValue = timeParts.find(p => p.type === 'dayPeriod')?.value;


  return (
    <div className="relative" ref={clockRef}>
        <button
            onClick={() => setIsCalendarOpen(prev => !prev)}
            className="text-outline text-center px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 w-full h-full transition-colors"
            aria-haspopup="true"
            aria-expanded={isCalendarOpen}
            aria-controls="calendar-popup"
        >
            <div className="text-xs flex items-baseline justify-center space-x-1">
                <span>{timeValue}</span>
                {periodValue && <span className="text-[10px] opacity-90">{periodValue}</span>}
            </div>
            <div className="text-[10px] opacity-80">
                {time.toLocaleDateString(t('locale_code'), { year: 'numeric', month: 'numeric', day: 'numeric' })}
            </div>
        </button>
        {isCalendarOpen && <CalendarPopup onClose={() => setIsCalendarOpen(false)} />}
    </div>
  );
};

export default Clock;