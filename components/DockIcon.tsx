

import React from 'react';
import type { AppDefinition } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DockIconProps {
  app: AppDefinition;
  onClick: () => void;
}

const DockIcon: React.FC<DockIconProps> = ({ app, onClick }) => {
  const { t } = useLanguage();
  const appName = t(app.name);

  return (
    <button
      onClick={onClick}
      className="light-field-button h-12 px-4"
      aria-label={`${t('aria_open')} ${appName}`}
    >
      <span className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{appName}</span>
    </button>
  );
};

export default DockIcon;