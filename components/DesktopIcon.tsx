import React from 'react';
import type { AppDefinition } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DesktopIconProps {
  app: AppDefinition;
  onDoubleClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ app, onDoubleClick }) => {
  const { t } = useLanguage();
  const appName = t(app.name);

  return (
    <button
      onDoubleClick={onDoubleClick}
      className="jelly-button flex-col w-28 h-24 p-1"
      aria-label={`${t('aria_open')} ${appName}`}
      title={`${t('aria_double_click_to_open')} ${appName}`}
    >
      {app.icon && (
        <img src={app.icon} alt="" className="w-12 h-12 object-contain mb-1" />
      )}
      <span className="text-sm text-outline text-center break-words w-full">
        {appName}
      </span>
    </button>
  );
};

export default DesktopIcon;