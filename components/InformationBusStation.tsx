import React, { useState } from 'react';
import type { BusItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface InformationStationProps {
    isOpen: boolean;
    onClose: () => void;
    items: BusItem[];
    onAddItem: (item: Omit<BusItem, 'id'>) => void;
    onRemoveItem: (id: string) => void;
}

const BusStationItem: React.FC<{ item: BusItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {

    const handleDragStart = (e: React.DragEvent) => {
        const data = { type: 'text', content: item.content };
        e.dataTransfer.setData('application/cjc-os-item', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copyMove';
    };

    return (
        <div 
            className="bg-black/10 dark:bg-white/10 p-2 rounded-lg flex items-start gap-3 relative group cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={handleDragStart}
        >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-sm break-all">{item.content}</p>
            </div>
            <button 
                onClick={() => onRemove(item.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-gray-500/50 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all z-10"
                aria-label="Remove item"
            >
                ✕
            </button>
        </div>
    );
};

export const InformationStation: React.FC<InformationStationProps> = ({ isOpen, items, onAddItem, onRemoveItem }) => {
    const { t } = useLanguage();
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const dataString = e.dataTransfer.getData('application/cjc-os-item');
        if (dataString) {
            try {
                const data = JSON.parse(dataString);
                if (data.type === 'text' && typeof data.content === 'string') {
                    onAddItem({ type: 'text', content: data.content });
                }
            } catch (err) {
                console.error("Failed to parse dropped item data:", err);
            }
        }
    };

    return (
        <div 
            className={`fixed top-0 right-0 h-[calc(100%-56px)] w-80 max-w-[90vw] taskbar-background backdrop-blur-3xl ring-1 ring-black/10 dark:ring-white/10 shadow-2xl z-20 information-station ${isOpen ? 'open' : ''} ${isDraggingOver ? 'drop-target-active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
        >
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-outline">{t('information_station_title')}</h2>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-72px)]">
                {items.length > 0 ? (
                    items.map(item => <BusStationItem key={item.id} item={item} onRemove={onRemoveItem} />).reverse()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-outline opacity-70">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                        <p className="mt-2 text-sm">{t('information_station_empty_prompt')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InformationStation;
