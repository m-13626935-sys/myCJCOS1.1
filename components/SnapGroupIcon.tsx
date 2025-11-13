import React, { useState } from 'react';
import type { WindowInstance, AppDefinition } from '../types';
import SnapGroupPreview from './SnapGroupPreview';

interface SnapGroupIconProps {
  group: WindowInstance[];
  apps: AppDefinition[];
  onFocusGroup: () => void;
}

const SnapGroupIcon: React.FC<SnapGroupIconProps> = ({ group, apps, onFocusGroup }) => {
  const [showPreview, setShowPreview] = useState(false);

  const groupIcons = group.slice(0, 3).map(win => {
    const app = apps.find(a => a.id === win.appId);
    return app?.icon || null;
  }).filter(Boolean) as string[];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <button
        onClick={onFocusGroup}
        className="light-field-button h-12 w-12 p-1 flex items-center justify-center"
        aria-label="Focus Snap Group"
      >
        <div className="relative w-8 h-8">
            {groupIcons.map((icon, index) => (
                <img
                    key={index}
                    src={icon}
                    alt=""
                    className="absolute w-5 h-5 object-contain"
                    style={{
                        top: `${index * 4}px`,
                        left: `${index * 4}px`,
                        zIndex: 3 - index,
                    }}
                />
            ))}
        </div>
      </button>
      {showPreview && (
        <SnapGroupPreview
          group={group}
          apps={apps}
          onClick={onFocusGroup}
        />
      )}
    </div>
  );
};

export default SnapGroupIcon;