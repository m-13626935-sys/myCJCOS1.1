import React from 'react';
import type { AppDefinition } from '../types';

interface RunningAppIconProps {
  app: AppDefinition;
  isFocused: boolean;
  onClick: () => void;
}

const RunningAppIcon: React.FC<RunningAppIconProps> = ({ app, isFocused, onClick }) => {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="light-field-button h-12 w-12 p-1"
        aria-label={app.name}
      >
        {app.icon ? 
            <img src={app.icon} alt={app.name} className="w-8 h-8 object-contain mx-auto" /> :
            <span className="text-xs text-outline">{app.name.substring(0, 3)}</span>
        }
      </button>
      {isFocused && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-md"></div>
      )}
    </div>
  );
};

export default RunningAppIcon;