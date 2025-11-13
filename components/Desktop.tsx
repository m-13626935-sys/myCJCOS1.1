import React, { useMemo } from 'react';
import type { AppDefinition, AppCategory } from '../types';
import DesktopIcon from './DesktopIcon';
import { CATEGORY_ORDER } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface DesktopProps {
  apps: AppDefinition[];
  onAppDoubleClick: (appId: string) => void;
  onWidgetDrop: (e: React.DragEvent) => void;
  isTopBarVisible: boolean;
}

const Desktop: React.FC<DesktopProps> = ({ apps, onAppDoubleClick, onWidgetDrop, isTopBarVisible }) => {
  const { t } = useLanguage();

  const categorizedApps = useMemo(() => {
    const visibleApps = apps.filter(app => app.category);

    const groups = visibleApps.reduce((acc, app) => {
      const category = app.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(app);
      return acc;
    }, {} as Record<string, AppDefinition[]>);

    return Object.keys(groups)
      .sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a as AppCategory);
        const indexB = CATEGORY_ORDER.indexOf(b as AppCategory);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .map(category => ({
        category,
        apps: groups[category].sort((a, b) => t(a.name).localeCompare(t(b.name), t('locale_code')))
      }));
  }, [apps, t]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div 
        className="absolute inset-0 top-0 left-0 w-full h-[calc(100%-56px)] p-4 overflow-hidden"
    >
      <div 
          className={`h-full w-full overflow-y-auto transition-all duration-300 ${isTopBarVisible ? 'pt-52' : 'pt-8'}`}
          onDrop={onWidgetDrop}
          onDragOver={handleDragOver}
      >
          <div className="flex flex-col gap-8">
            {categorizedApps.map(({ category, apps: appsInCategory }) => (
              <section key={category} aria-labelledby={`desktop-category-${category}`}>
                <h2 id={`desktop-category-${category}`} className="text-lg font-semibold text-outline mb-3">
                  {t(category)}
                </h2>
                <div className="flex flex-row flex-wrap gap-4">
                  {appsInCategory.map((app) => (
                    <DesktopIcon
                      key={app.id}
                      app={app}
                      onDoubleClick={() => onAppDoubleClick(app.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
      </div>
    </div>
  );
};

export default Desktop;