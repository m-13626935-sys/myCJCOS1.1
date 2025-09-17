import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CalendarEvent } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { EVENT_COLORS } from '../constants';

const STORAGE_KEY = 'schedule_app_events';

// --- Helper Functions ---
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatToDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- Sub-components ---

const EventFormModal: React.FC<{
    event: Partial<CalendarEvent> | null;
    onSave: (event: Omit<CalendarEvent, 'id'> & { id?: string }) => void;
    onClose: () => void;
    onDelete: (id: string) => void;
    selectedDate: Date;
}> = ({ event, onSave, onClose, onDelete, selectedDate }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState(event?.title || '');
    const [startTime, setStartTime] = useState(event?.startTime ? formatToDateTimeLocal(new Date(event.startTime)) : formatToDateTimeLocal(selectedDate));
    const [endTime, setEndTime] = useState(event?.endTime ? formatToDateTimeLocal(new Date(event.endTime)) : formatToDateTimeLocal(new Date(selectedDate.getTime() + 60 * 60 * 1000)));
    const [location, setLocation] = useState(event?.location || '');
    const [notes, setNotes] = useState(event?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;
        onSave({
            ...(event?.id && { id: event.id }),
            title,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            location,
            notes,
            color: event?.color || EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)]
        });
    };

    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center animate-window-enter">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl p-6 rounded-xl shadow-2xl w-full max-w-md ring-1 ring-white/20 dark:ring-black/30">
                <h2 className="text-xl font-bold mb-4">{event?.id ? t('schedule_edit_event') : t('schedule_add_event')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('schedule_title')} required className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} aria-label={t('schedule_start_time')} className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} aria-label={t('schedule_end_time')} className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                    </div>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('schedule_location')} className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" />
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('schedule_notes')} rows={3} className="w-full p-2 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"></textarea>
                    <div className="flex justify-between items-center pt-2">
                        <div>
                            {event?.id && (
                                <button type="button" onClick={() => onDelete(event.id!)} className="px-4 py-2 bg-red-500/80 text-white rounded-md hover:bg-red-600 transition-colors">{t('schedule_delete')}</button>
                            )}
                        </div>
                        <div className="flex gap-2">
                             <button type="button" onClick={onClose} className="px-4 py-2 bg-black/20 dark:bg-white/20 rounded-md hover:bg-black/30 dark:hover:bg-white/30 transition-colors">Cancel</button>
                             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">{t('schedule_save')}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ScheduleApp: React.FC = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const savedEvents = localStorage.getItem(STORAGE_KEY);
      return savedEvents ? JSON.parse(savedEvents) : [];
    } catch { return []; }
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('schedule-updated'));
  }, [events]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const eventsForSelectedDay = useMemo(() =>
    events.filter(event => isSameDay(new Date(event.startTime), selectedDate))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [events, selectedDate]
  );
  
  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'> & { id?: string }) => {
    if (eventData.id) { // Editing existing
      setEvents(events.map(e => e.id === eventData.id ? { ...e, ...eventData } as CalendarEvent : e));
    } else { // Creating new
      setEvents([...events, { ...eventData, id: `evt-${Date.now()}` }]);
    }
    setEditingEvent(null);
  };
  
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setEditingEvent(null);
  };
  
  const handleAddNewEvent = () => {
    const now = new Date();
    selectedDate.setHours(now.getHours(), Math.ceil(now.getMinutes()/30)*30, 0, 0); // Snap to nearest 30 mins
    setEditingEvent({ startTime: selectedDate.toISOString() });
  }

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) { days.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { days.push(new Date(year, month, i)); }
    return days;
  }, [year, month]);

  const timelineHours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="h-full flex flex-col md:flex-row bg-transparent text-outline -m-4">
      {editingEvent && <EventFormModal event={editingEvent} onSave={handleSaveEvent} onClose={() => setEditingEvent(null)} onDelete={handleDeleteEvent} selectedDate={selectedDate}/>}
      {/* --- Sidebar --- */}
      <aside className="w-full md:w-1/3 flex-shrink-0 p-4 border-r border-white/10 dark:border-black/30 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{viewDate.toLocaleDateString(t('locale_code'), { month: 'long', year: 'numeric' })}</h2>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors">&lt;</button>
              <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors">&gt;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-sm opacity-70">
            {useMemo(() => [t('weekday_sun'), t('weekday_mon'), t('weekday_tue'), t('weekday_wed'), t('weekday_thu'), t('weekday_fri'), t('weekday_sat')], [t]).map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 mt-2 gap-y-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`}></div>;
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const hasEvents = events.some(e => isSameDay(new Date(e.startTime), day));
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`py-2 rounded-full relative ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-white/10'} ${isToday ? 'font-bold' : ''}`}>
                  {day.getDate()}
                  {hasEvents && <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>}
                </button>
              );
            })}
          </div>
           <button onClick={handleAddNewEvent} className="mt-auto w-full py-2 px-4 bg-blue-600/90 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 active:shadow-inner active:scale-95 transition-all duration-150">
                {t('schedule_add_event')}
            </button>
      </aside>
      
      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">{selectedDate.toLocaleDateString(t('locale_code'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h1>
        </header>
        <div className="flex-grow overflow-y-auto pr-2 -mr-4 relative">
            {timelineHours.map(hour => (
                <div key={hour} className="relative border-t border-white/10 dark:border-black/30 h-[60px]">
                    <span className="absolute -top-3 left-2 text-xs opacity-50">{`${hour.toString().padStart(2,'0')}:00`}</span>
                </div>
            ))}
            {eventsForSelectedDay.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-50">{t('schedule_no_events')}</div>
            )}
            {eventsForSelectedDay.map(event => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                const top = (start.getHours() + start.getMinutes() / 60) * 60;
                const height = Math.max(30, ((end.getTime() - start.getTime()) / 3600000) * 60); // min height 30px
                return (
                    <button key={event.id} onClick={() => setEditingEvent(event)} className="absolute left-14 right-2 p-2 rounded-lg text-left overflow-hidden transition-all duration-200 hover:ring-2 ring-white/50" style={{ top: `${top}px`, height: `${height}px`, backgroundColor: event.color, zIndex: 10 }}>
                        <p className="font-semibold text-white text-sm">{event.title}</p>
                        <p className="text-xs text-white/80">{`${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</p>
                    </button>
                )
            })}
        </div>
      </main>
    </div>
  );
};

export default ScheduleApp;