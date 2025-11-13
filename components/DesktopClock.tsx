import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { TimeFormat } from '../types';

interface DesktopClockProps {
    timeFormat: TimeFormat;
}

const DesktopClock: React.FC<DesktopClockProps> = ({ timeFormat }) => {
  const [date, setDate] = useState(new Date());
  const { language, t } = useLanguage();

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };

  const lunarDateOptions: Intl.DateTimeFormatOptions | undefined = language === 'zh' ? {
    calendar: 'chinese',
    month: 'long',
    day: 'numeric',
  } : undefined;

  const locale = t('locale_code');
  const timeParts = new Intl.DateTimeFormat(locale, timeOptions).formatToParts(date);
  const timeValue = timeParts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('');
  const periodValue = timeParts.find(p => p.type === 'dayPeriod')?.value;
  
  const dateString = date.toLocaleDateString(locale, dateOptions);
  
  const lunarDateString = language === 'zh' && lunarDateOptions 
    ? new Intl.DateTimeFormat('zh-u-ca-chinese-nu-hanidec', lunarDateOptions).format(date)
    : '';

  return (
    <div className="flex items-center justify-center text-outline pointer-events-none">
      {/* Time and Date Section */}
      <div className="text-center">
        <div className="text-6xl font-light flex items-baseline justify-center">
          <span>{timeValue}</span>
          {periodValue && <span className="text-3xl font-light ml-2">{periodValue}</span>}
        </div>
        <div className="text-xl font-medium mt-1">
          {dateString}
        </div>
        {language === 'zh' && (
          <div className="text-lg font-normal opacity-90 mt-1">
            {t('lunar_calendar_prefix')} {lunarDateString}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopClock;
