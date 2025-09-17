
import React, { useRef, useEffect } from 'react';
import { WIDGETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppProps, WidgetDefinition, TimeFormat } from '../types';

interface WidgetPanelProps {
    isOpen: boolean;
    onClose: () => void;
    timeFormat: TimeFormat;
}

const WidgetPanel: React.FC<WidgetPanelProps> = ({ isOpen, onClose, timeFormat }) => {
    const { t } = useLanguage();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
                // Also check if the click was on the widget button itself to prevent immediate closing
                const dockButton = (event.target as HTMLElement).closest('[aria-label="小组件"]');
                if (!dockButton) {
                    onClose();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widget: WidgetDefinition) => {
        e.dataTransfer.setData('widgetId', widget.id);
        e.dataTransfer.effectAllowed = 'move';
        // A slight delay helps the browser register the drag operation before closing the panel
        setTimeout(onClose, 50);
    };

    return (
        <div ref={panelRef} className={`fixed top-0 left-0 h-[calc(100%-56px)] w-80 max-w-[90vw] taskbar-background backdrop-blur-3xl ring-1 ring-black/10 dark:ring-white/10 shadow-2xl z-20 widget-panel ${isOpen ? 'open' : ''}`}>
            <div className="p-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-xl font-bold text-outline">{t('widgets_panel_title')}</h2>
                <p className="text-sm opacity-70 text-outline">{t('widgets_panel_subtitle')}</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-88px)]">
                {WIDGETS.map(widget => {
                    const WidgetComponent = widget.component;
                    // For widgets that need props, they can be handled here or in App.tsx
                    const widgetProps: Partial<AppProps> = {};

                    if (widget.id === 'clock') {
                        widgetProps.timeFormat = timeFormat;
                    }

                    return (
                        <div key={widget.id}>
                            <h3 className="font-semibold text-outline mb-2 px-1">{t(widget.name)}</h3>
                            <div 
                                className="widget-preview rounded-xl ring-1 ring-black/10 dark:ring-white/10 shadow-lg overflow-hidden"
                                draggable
                                onDragStart={(e) => handleDragStart(e, widget)}
                            >
                                <div className="pointer-events-none p-2 bg-black/5 dark:bg-white/5">
                                    <div style={{ width: widget.defaultSize.width, height: widget.defaultSize.height, transform: `scale(${270 / widget.defaultSize.width})`, transformOrigin: 'top left' }}>
                                        <WidgetComponent {...widgetProps} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default WidgetPanel;
