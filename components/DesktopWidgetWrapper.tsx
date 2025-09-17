import React from 'react';
import { useDraggable } from '../hooks/useDraggable';
import type { DesktopWidgetInstance, WidgetDefinition } from '../types';

interface DesktopWidgetWrapperProps {
    children: React.ReactNode;
    instance: DesktopWidgetInstance;
    definition: WidgetDefinition;
    onPositionChange: (pos: { x: number; y: number }) => void;
    onClose: () => void;
    onFocus: () => void;
}

const DesktopWidgetWrapper: React.FC<DesktopWidgetWrapperProps> = ({ children, instance, definition, onPositionChange, onClose, onFocus }) => {
    const { ref: dragHandleRef, position: currentPosition } = useDraggable<HTMLDivElement>({
        initialPosition: instance.position,
        onPositionChange,
    });

    return (
        <div
            className="absolute desktop-widget-wrapper group"
            style={{
                top: currentPosition.y,
                left: currentPosition.x,
                width: definition.defaultSize.width,
                height: definition.defaultSize.height,
                zIndex: instance.zIndex,
            }}
            onMouseDown={onFocus}
        >
            <div ref={dragHandleRef} className="absolute inset-0 cursor-grab active:cursor-grabbing"></div>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                aria-label="Close widget"
            >
                ✕
            </button>
            <div className="w-full h-full pointer-events-auto">
              {children}
            </div>
        </div>
    );
};

export default DesktopWidgetWrapper;
