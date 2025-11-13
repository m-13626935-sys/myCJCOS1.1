import React, { useState, useRef } from 'react';
import type { AppDefinition } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DesktopIconProps {
  app: AppDefinition;
  onDoubleClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ app, onDoubleClick }) => {
  const { t } = useLanguage();
  const appName = t(app.name);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  // Fix: The ref for a timeout should be allowed to be undefined when not set.
  // FIX: Explicitly pass undefined to useRef to fix "Expected 1 arguments, but got 0" error.
  const longPressTimer = useRef<number | undefined>(undefined);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    longPressTimer.current = window.setTimeout(() => {
        setRipples(prev => [...prev, { id: Date.now(), x, y }]);
    }, 200);
  };

  const clearLongPressTimer = () => {
    clearTimeout(longPressTimer.current);
  };

  return (
    <button
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={clearLongPressTimer}
      onMouseLeave={clearLongPressTimer}
      className={`light-field-button flex-col w-28 h-24 p-1 ${app.isAiFeature ? 'ai-gradient-border' : ''}`}
      aria-label={`${t('aria_open')} ${appName}`}
      title={`${t('aria_double_click_to_open')} ${appName}`}
    >
      {app.icon && (
        <img src={app.icon} alt="" className="w-12 h-12 object-contain mb-1" />
      )}
      <span className="text-sm text-outline text-center break-words w-full">
        {appName}
      </span>
       {ripples.map(ripple => (
        <span
            key={ripple.id}
            className="ripple"
            style={{ top: ripple.y, left: ripple.x, transformOrigin: 'center' }}
            onAnimationEnd={() => {
                setRipples(prev => prev.filter(r => r.id !== ripple.id));
            }}
        />
      ))}
    </button>
  );
};

export default DesktopIcon;
