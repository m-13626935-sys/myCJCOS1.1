import React from 'react';

interface SnapPreviewProps {
    side: 'left' | 'right' | 'top' | null;
}

const SnapPreview: React.FC<SnapPreviewProps> = ({ side }) => {
    const baseClasses = 'fixed bg-white/20 backdrop-blur-md rounded-xl transition-all duration-200 pointer-events-none z-[28] border-2 border-white/50';

    const getStyle = (): React.CSSProperties => {
        const margin = 8;
        const baseStyle: React.CSSProperties = {
            opacity: 0,
            transform: 'scale(0.95)',
            transition: 'opacity 200ms ease, transform 200ms ease, top 200ms ease, left 200ms ease, right 200ms ease, bottom 200ms ease, width 200ms ease, height 200ms ease',
        };

        if (!side) return baseStyle;
        
        const visibleStyle: React.CSSProperties = {
            opacity: 1,
            transform: 'scale(1)',
        }

        switch(side) {
            case 'top':
                return { ...baseStyle, ...visibleStyle, inset: `${margin}px` };
            case 'left':
                return { ...baseStyle, ...visibleStyle, top: margin, left: margin, bottom: margin, width: `calc(50% - ${margin * 1.5}px)` };
            case 'right':
                return { ...baseStyle, ...visibleStyle, top: margin, right: margin, bottom: margin, width: `calc(50% - ${margin * 1.5}px)` };
            default:
                return baseStyle;
        }
    };

    return <div className={baseClasses} style={getStyle()} />;
};

export default SnapPreview;
