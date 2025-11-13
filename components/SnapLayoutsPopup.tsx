import React from 'react';

interface SnapLayoutsPopupProps {
  onSelect: (layout: string, area: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SnapLayoutsPopup: React.FC<SnapLayoutsPopupProps> = ({ onSelect, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      className="snap-popup animate-fade-in-up"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 50-50 horizontal */}
      <div className="snap-layout" onClick={(e) => e.stopPropagation()}>
        <div className="snap-area" onClick={() => onSelect('50-50-horizontal', 'left')}></div>
        <div className="snap-area" onClick={() => onSelect('50-50-horizontal', 'right')}></div>
      </div>
      {/* 2/3 | 1/3 */}
      <div className="snap-layout layout-main-side" onClick={(e) => e.stopPropagation()}>
        <div className="snap-area main" onClick={() => onSelect('main-side-right', 'main')}></div>
        <div className="snap-area side" onClick={() => onSelect('main-side-right', 'side')}></div>
      </div>
      {/* Thirds vertical */}
      <div className="snap-layout layout-thirds" onClick={(e) => e.stopPropagation()}>
        <div className="snap-area" onClick={() => onSelect('thirds-vertical', 'left')}></div>
        <div className="snap-area" onClick={() => onSelect('thirds-vertical', 'middle')}></div>
        <div className="snap-area" onClick={() => onSelect('thirds-vertical', 'right')}></div>
      </div>
      {/* Quads */}
      <div className="snap-layout layout-quarters" onClick={(e) => e.stopPropagation()}>
        <div className="snap-area" onClick={() => onSelect('quadrants', 'top-left')}></div>
        <div className="snap-area" onClick={() => onSelect('quadrants', 'top-right')}></div>
        <div className="snap-area" onClick={() => onSelect('quadrants', 'bottom-left')}></div>
        <div className="snap-area" onClick={() => onSelect('quadrants', 'bottom-right')}></div>
      </div>
    </div>
  );
};

export default SnapLayoutsPopup;