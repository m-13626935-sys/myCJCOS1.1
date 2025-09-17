import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarPopupProps {
  onClose: () => void;
}

const MIN_YEAR = 2014;
const MAX_YEAR = 2114;

const CalendarPopup: React.FC<CalendarPopupProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [inputYear, setInputYear] = useState(viewDate.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState(viewDate.getMonth());
  const [isEasterEgg, setIsEasterEgg] = useState(false);

  const swipeRef = useRef<HTMLDivElement>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const MONTH_NAMES = useMemo(() => [
    t('month_jan'), t('month_feb'), t('month_mar'), t('month_apr'),
    t('month_may'), t('month_jun'), t('month_jul'), t('month_aug'),
    t('month_sep'), t('month_oct'), t('month_nov'), t('month_dec')
  ], [t]);

  const WEEK_DAYS = useMemo(() => [
    t('weekday_sun'), t('weekday_mon'), t('weekday_tue'),
    t('weekday_wed'), t('weekday_thu'), t('weekday_fri'),
    t('weekday_sat')
  ], [t]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Previous month's padding
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  }, [year, month]);

  const handleDayClick = (day: Date) => {
    // Check for March 21, 2014
    if (day.getFullYear() === 2014 && day.getMonth() === 2 && day.getDate() === 21) {
        setIsEasterEgg(true);
    } else {
        if (isEasterEgg) {
            setIsEasterEgg(false);
        }
    }
  };

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
      setIsEasterEgg(false);
      setViewDate(currentDate => {
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth();
          if (currentYear === MIN_YEAR && currentMonth === 0) return currentDate;
          return new Date(currentYear, currentMonth - 1, 1);
      });
  }, []);

  const handleNextMonth = useCallback(() => {
      setIsEasterEgg(false);
      setViewDate(currentDate => {
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth();
          if (currentYear === MAX_YEAR && currentMonth === 11) return currentDate;
          return new Date(currentYear, currentMonth + 1, 1);
      });
  }, []);

  const goToToday = () => {
      setIsEasterEgg(false);
      setViewDate(new Date());
  };
  
  const handleOpenPicker = () => {
      setInputYear(year.toString());
      setInputMonth(month);
      setIsPickingDate(true);
  };

  const handleJumpToDate = () => {
      setIsEasterEgg(false);
      let newYear = parseInt(inputYear, 10);
      if (isNaN(newYear)) {
          newYear = today.getFullYear();
      }
      // Clamp the year to the allowed range
      newYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, newYear));
      
      setViewDate(new Date(newYear, inputMonth, 1));
      setIsPickingDate(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent the main page from scrolling and disable when picker is open
    e.preventDefault();
    if (isPickingDate) return;

    if (e.deltaY < 0) {
        handlePrevMonth();
    } else if (e.deltaY > 0) {
        handleNextMonth();
    }
  };

  const handleGestureEnd = useCallback((endX: number, startX: number) => {
    const deltaX = endX - startX;
    const swipeThreshold = 50; // pixels

    if (deltaX > swipeThreshold) {
        handlePrevMonth();
    } else if (deltaX < -swipeThreshold) {
        handleNextMonth();
    }
  }, [handlePrevMonth, handleNextMonth]);

  // --- Swipe Gesture Logic ---
  useEffect(() => {
    const calendarElement = swipeRef.current;
    if (!calendarElement || isPickingDate) return;

    let isDown = false;
    let startX = 0;
    
    // Mouse events
    const handleMouseUp = (e: MouseEvent) => {
        calendarElement.style.cursor = 'grab';
        if (isDown) {
          handleGestureEnd(e.clientX, startX);
        }
        isDown = false;
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e: MouseEvent) => {
        isDown = true;
        startX = e.clientX;
        calendarElement.style.cursor = 'grabbing';
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault(); // Prevent text selection
    };

    // Touch events
    const handleTouchEnd = (e: TouchEvent) => {
        if (isDown) {
            handleGestureEnd(e.changedTouches[0].clientX, startX);
        }
        isDown = false;
        document.removeEventListener('touchend', handleTouchEnd);
    };
    const handleTouchStart = (e: TouchEvent) => {
        isDown = true;
        startX = e.touches[0].clientX;
        document.addEventListener('touchend', handleTouchEnd);
    };

    calendarElement.addEventListener('mousedown', handleMouseDown);
    calendarElement.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
        calendarElement.removeEventListener('mousedown', handleMouseDown);
        calendarElement.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleGestureEnd, isPickingDate]);
  
  const renderHeader = () => (
      <div className="flex justify-between items-center px-1 mb-2">
        <button onClick={handleOpenPicker} className="text-xl font-semibold hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
            {`${year}${t('calendar_year_suffix')} ${MONTH_NAMES[month]}`}
        </button>
        <div className="flex items-center gap-1">
             <button onClick={handlePrevMonth} disabled={year === MIN_YEAR && month === 0} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label={t('calendar_aria_prev_month')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={goToToday} className="text-base font-medium hover:bg-white/10 rounded-full px-4 py-2 transition-colors">{t('calendar_today')}</button>
            <button onClick={handleNextMonth} disabled={year === MAX_YEAR && month === 11} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label={t('calendar_aria_next_month')}>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
            </button>
        </div>
      </div>
  );

  const renderDaysGrid = () => (
      <div 
        ref={swipeRef}
        className="cursor-grab flex-grow flex flex-col"
      >
          <div className="grid grid-cols-7 text-center text-sm opacity-70 my-2 select-none">
              {WEEK_DAYS.map(day => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 flex-grow gap-y-2 select-none">
              {calendarDays.map((day, index) => {
                  if (!day) return <div key={`pad-${index}`}></div>;
                  
                  const isToday = day.toDateString() === today.toDateString();
                  const dayNumber = day.getDate();

                  return (
                      <div key={day.toISOString()} className="flex justify-center items-center">
                          <button
                             onClick={() => handleDayClick(day)}
                             aria-label={day.toLocaleDateString(t('locale_code'), { year: 'numeric', month: 'long', day: 'numeric' })}
                             className={`w-12 h-12 flex items-center justify-center text-base rounded-full transition-colors ${
                              isToday ? 'bg-blue-600 text-white font-bold ring-2 ring-white/50' : 'hover:bg-white/10'
                          }`}>
                              {dayNumber}
                          </button>
                      </div>
                  )
              })}
          </div>
      </div>
  );

  const renderDatePicker = () => {
      return (
          <div className="flex flex-col h-full p-2 justify-center gap-6">
              <h3 className="text-2xl font-semibold text-center">{t('calendar_jump_to_date')}</h3>
              <div className="flex items-center gap-4">
                 <div className="flex-1">
                    <label htmlFor="year-input" className="block text-base mb-2 opacity-80">{t('calendar_year')}</label>
                    <input
                        id="year-input"
                        type="number"
                        value={inputYear}
                        onChange={(e) => setInputYear(e.target.value)}
                        className="w-full p-3 text-lg rounded-md bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-gray-500 text-outline placeholder-outline"
                        min={MIN_YEAR}
                        max={MAX_YEAR}
                    />
                 </div>
                 <div className="flex-1">
                    <label htmlFor="month-input" className="block text-base mb-2 opacity-80">{t('calendar_month')}</label>
                    <select
                        id="month-input"
                        value={inputMonth}
                        onChange={(e) => setInputMonth(parseInt(e.target.value, 10))}
                        className="w-full p-3 text-lg rounded-md bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-gray-500 text-outline"
                    >
                        {MONTH_NAMES.map((name, index) => (
                            <option key={name} value={index} className="bg-gray-700 text-white">{name}</option>
                        ))}
                    </select>
                 </div>
              </div>
              <div className="flex justify-end items-center gap-2 mt-4">
                 <button onClick={() => setIsPickingDate(false)} className="px-6 py-3 text-base font-medium hover:bg-white/10 rounded-lg transition-colors">{t('calendar_back')}</button>
                 <button onClick={handleJumpToDate} className="px-6 py-3 text-base font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">{t('calendar_jump')}</button>
              </div>
          </div>
      );
  };
  
  const renderCalendarView = () => (
     <div className="h-full flex flex-col">
        {renderHeader()}
        {renderDaysGrid()}
     </div>
  );
  
  const renderEasterEggView = () => (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-8 rounded-2xl backdrop-blur-md ring-1 ring-white/30 dark:ring-black/30 max-w-md w-full">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-pulse">
                {t('calendar_easter_egg')}
            </div>
        </div>
    </div>
  );

  return (
    <div 
        onWheel={handleWheel}
        className="absolute bottom-full right-0 mb-2 w-[420px] h-[600px] max-h-[80vh] taskbar-background backdrop-blur-3xl ring-1 ring-black/10 dark:ring-white/10 rounded-xl shadow-2xl p-4 flex flex-col animate-fade-in-up text-outline">
        {isEasterEgg ? renderEasterEggView() : (isPickingDate ? renderDatePicker() : renderCalendarView())}
    </div>
  );
};

export default CalendarPopup;