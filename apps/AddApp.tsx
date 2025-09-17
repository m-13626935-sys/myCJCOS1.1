import React, { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const CheckboxIcon = ({ checked }: { checked: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-colors ${checked ? 'text-green-400' : 'text-gray-400'}`}>
        {checked ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        ) : (
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
        )}
    </svg>
);

const STORAGE_KEY = 'notes_app_tasks';

const NotesApp: React.FC = () => {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (e) {
        console.error("Failed to load tasks:", e);
        return [];
    }
  });

  const [input, setInput] = useState('');

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        window.dispatchEvent(new CustomEvent('notes-updated'));
    } catch (e) {
        console.error("Failed to save tasks:", e);
    }
  }, [tasks]);

  const handleAddTask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: input.trim(),
      completed: false,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setInput('');
  }, [input]);

  const handleToggleComplete = (id: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataString = e.dataTransfer.getData('application/cjc-os-item');
    if (dataString) {
        try {
            const data = JSON.parse(dataString);
            if (data.type === 'text' && typeof data.content === 'string') {
                setInput(prev => prev ? `${prev} ${data.content}` : data.content);
            }
        } catch (err) { console.error("Drop error:", err); }
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-outline">
      <header className="mb-4">
        <h1 className="text-xl font-bold mb-2">{t('notes_title')}</h1>
        <form onSubmit={handleAddTask} className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('notes_placeholder')}
            className="flex-grow p-2 rounded-l-md bg-white/20 dark:bg-black/20 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 ring-1 ring-inset ring-white/50 dark:ring-white/20"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black/20 dark:bg-white/20 text-outline rounded-r-md ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150 disabled:bg-black/10 disabled:dark:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
            disabled={!input.trim()}
          >
            {t('notes_add')}
          </button>
        </form>
      </header>

      <main className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center opacity-70 pt-8">
            <p>{t('notes_empty_state_l1')}</p>
            <p>{t('notes_empty_state_l2')}</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center p-2 rounded-lg transition-all duration-300 bg-black/5 dark:bg-white/5 ${task.completed ? 'opacity-50' : 'opacity-100'}`}
            >
              <button onClick={() => handleToggleComplete(task.id)} className="p-1" aria-label={task.completed ? t('notes_aria_mark_incomplete') : t('notes_aria_mark_complete')}>
                <CheckboxIcon checked={task.completed} />
              </button>
              <span className={`flex-grow mx-2 ${task.completed ? 'line-through' : ''}`}>{task.text}</span>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1 rounded-full text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors"
                aria-label={t('notes_aria_delete')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default NotesApp;