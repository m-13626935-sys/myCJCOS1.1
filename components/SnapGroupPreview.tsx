import React from 'react';
import type { WindowInstance, AppDefinition } from '../types';

interface SnapGroupPreviewProps {
  group: WindowInstance[];
  apps: AppDefinition[];
  onClick: () => void;
}

const SnapGroupPreview: React.FC<SnapGroupPreviewProps> = ({ group, apps, onClick }) => {
  const containerWidth = 172; // width of preview area
  const containerHeight = 96; // height of preview area

  return (
    <div
      className="snap-group-preview animate-fade-in-up"
      onClick={onClick}
    >
      {group.map(win => {
        const app = apps.find(a => a.id === win.appId);
        const relativeX = (win.position.x / window.innerWidth) * 100;
        const relativeY = (win.position.y / window.innerHeight) * 100;
        const relativeW = (win.size.width / window.innerWidth) * 100;
        const relativeH = (win.size.height / window.innerHeight) * 100;

        return (
          <div
            key={win.id}
            className="snap-group-preview-window"
            style={{
              left: `${relativeX}%`,
              top: `${relativeY}%`,
              width: `${relativeW}%`,
              height: `${relativeH}%`,
            }}
          >
            {app?.icon && <img src={app.icon} alt={app.name} />}
          </div>
        );
      })}
    </div>
  );
};

export default SnapGroupPreview;