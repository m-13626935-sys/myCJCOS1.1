import React, { useEffect, useState, useRef } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import SnapLayoutsPopup from './SnapLayoutsPopup';

interface WindowProps {
  id: string;
  children: React.ReactNode;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isFocused?: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isClosing?: boolean;
  isMinimizing?: boolean;
  isRestoring?: boolean;
  snapState?: { layout: string; area: string } | null;
  isAiFeature?: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onMaximizeToggle: () => void;
  onCloseAnimationComplete: () => void;
  onMinimizeAnimationComplete: () => void;
  onRestoreAnimationComplete: () => void;
  onDragStart: (id: string, e: MouseEvent) => void;
  onDrag: (id: string, e: MouseEvent) => void;
  onDragEnd: (id: string, e: MouseEvent) => void;
  onSnap: (layout: string, area: string) => void;
}

const MAXIMIZED_Z_INDEX = 29; // Placed just below the base z-index for normal windows (30)

const MaximizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14v14H5V5z" />
    </svg>
);

const RestoreIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 13v5H8V9h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V4h9v4" />
    </svg>
);


const Window: React.FC<WindowProps> = ({
  id,
  children,
  title,
  position,
  size,
  zIndex,
  isFocused,
  isMaximized,
  isMinimized,
  isClosing,
  isMinimizing,
  isRestoring,
  snapState,
  isAiFeature,
  onClose,
  onFocus,
  onMinimize,
  onPositionChange,
  onMaximizeToggle,
  onCloseAnimationComplete,
  onMinimizeAnimationComplete,
  onRestoreAnimationComplete,
  onDragStart,
  onDrag,
  onDragEnd,
  onSnap,
}) => {
  const { ref: dragHandleRef, position: currentPosition } = useDraggable<HTMLDivElement>({
    initialPosition: position,
    onPositionChange,
    disabled: isMaximized,
    onDragStart: (e) => onDragStart(id, e),
    onDrag: (e) => onDrag(id, e),
    onDragEnd: (e) => onDragEnd(id, e),
  });
  
  const [initialRender, setInitialRender] = useState(true);
  const [showSnapPopup, setShowSnapPopup] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // This effect ensures the enter animation class is removed after it plays
    // so it doesn't re-trigger on subsequent renders.
    const timer = setTimeout(() => {
        setInitialRender(false);
    }, 400); // Must match enter animation duration
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onCloseAnimationComplete();
      }, 300); // Must match exit animation duration
      return () => clearTimeout(timer);
    }
  }, [isClosing, onCloseAnimationComplete]);

  useEffect(() => {
    if (isMinimizing) {
      const timer = setTimeout(() => {
        onMinimizeAnimationComplete();
      }, 300); // Must match minimize animation duration
      return () => clearTimeout(timer);
    }
  }, [isMinimizing, onMinimizeAnimationComplete]);

  useEffect(() => {
    if (isRestoring) {
      const timer = setTimeout(() => {
        onRestoreAnimationComplete();
      }, 300); // Must match restore animation duration
      return () => clearTimeout(timer);
    }
  }, [isRestoring, onRestoreAnimationComplete]);

  const getAnimationClass = () => {
    if (isClosing) return 'animate-window-exit';
    if (isMinimizing) return 'animate-window-minimize';
    if (isRestoring) return 'animate-window-restore';
    if (initialRender) return 'animate-window-enter';
    return '';
  };

  const handlePopupInteractionEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (!showSnapPopup) {
       showTimeoutRef.current = window.setTimeout(() => setShowSnapPopup(true), 300);
    }
  };

  const handlePopupInteractionLeave = () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      hideTimeoutRef.current = window.setTimeout(() => setShowSnapPopup(false), 200);
  };

  const handlePopupSelect = (layout: string, area: string) => {
      onSnap(layout, area);
      setShowSnapPopup(false);
  };

  const windowClasses = [
    'absolute', 'flex', 'flex-col',
    'window-background',
    'shadow-2xl',
    !isClosing && !isMinimizing && !isRestoring && !snapState && 'window-transform-transition',
    (isMaximized || snapState) ? 'rounded-none' : 'rounded-3xl',
    getAnimationClass(),
    isMinimized ? 'hidden' : '',
    isAiFeature ? 'ai-gradient-border' : '',
    isMaximized ? 'cursor-default' : 'cursor-grab',
    isFocused ? 'window-focused' : '',
  ].filter(Boolean).join(' ');

  const windowStyles: React.CSSProperties = {
    top: isMaximized || snapState ? position.y : currentPosition.y,
    left: isMaximized || snapState ? position.x : currentPosition.x,
    width: size.width,
    height: size.height,
    zIndex: isMaximized ? MAXIMIZED_Z_INDEX : zIndex,
    transitionProperty: snapState ? 'none' : 'top, left, width, height',
  };

  return (
    <div
      ref={dragHandleRef}
      className={windowClasses}
      style={windowStyles}
      onMouseDown={onFocus}
    >
      <header
        className={`flex items-center justify-between px-1 h-8 bg-white/[.02] dark:bg-black/5 flex-shrink-0`}
      >
        <div className="w-24"></div> {/* Spacer */}
        <div className="flex-grow text-center">
            <span className="font-medium text-xs text-outline select-none">{title}</span>
        </div>
        <div className="flex items-center space-x-0.5 w-24 justify-end h-full relative">
            <button onClick={onMinimize} className="w-8 h-full rounded-sm flex items-center justify-center text-outline hover:bg-gradient-to-b hover:from-white/40 hover:to-white/10 dark:hover:from-white/20 dark:hover:to-white/5 hover:shadow-md active:shadow-inner transition-all duration-150" aria-label="最小化">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
            </button>
            <button
                onClick={onMaximizeToggle}
                onMouseEnter={handlePopupInteractionEnter}
                onMouseLeave={handlePopupInteractionLeave}
                className="w-8 h-full rounded-sm flex items-center justify-center text-outline hover:bg-gradient-to-b hover:from-white/40 hover:to-white/10 dark:hover:from-white/20 dark:hover:to-white/5 hover:shadow-md active:shadow-inner transition-all duration-150"
                aria-label={isMaximized ? "还原" : "最大化"}
            >
              {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-8 h-full rounded-sm flex items-center justify-center text-outline hover:bg-gradient-to-b hover:from-red-400 hover:to-red-600 hover:text-white hover:shadow-md active:shadow-inner transition-all duration-150"
                aria-label="关闭窗口"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
             {showSnapPopup && !isMaximized && (
                <SnapLayoutsPopup
                    onSelect={handlePopupSelect}
                    onMouseEnter={handlePopupInteractionEnter}
                    onMouseLeave={handlePopupInteractionLeave}
                />
            )}
        </div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto text-outline">
        {children}
      </main>
    </div>
  );
};

export default Window;