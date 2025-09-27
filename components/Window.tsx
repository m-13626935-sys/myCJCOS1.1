import React, { useEffect } from 'react';
import { useDraggable } from '../hooks/useDraggable';

interface WindowProps {
  id: string;
  children: React.ReactNode;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isClosing?: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onMaximizeToggle: () => void;
  onCloseAnimationComplete: () => void;
}

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
  children,
  title,
  position,
  size,
  zIndex,
  isMaximized,
  isMinimized,
  isClosing,
  onClose,
  onFocus,
  onMinimize,
  onPositionChange,
  onMaximizeToggle,
  onCloseAnimationComplete,
}) => {
  const { ref: dragHandleRef, position: currentPosition } = useDraggable<HTMLDivElement>({
    initialPosition: position,
    onPositionChange,
    disabled: isMaximized
  });

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onCloseAnimationComplete();
      }, 200); // Must match animation duration
      return () => clearTimeout(timer);
    }
  }, [isClosing, onCloseAnimationComplete]);

  const windowClasses = [
    'absolute', 'flex', 'flex-col',
    'window-background',
    'shadow-2xl',
    !isClosing && 'transition-[top,left,width,height]', // Disable transition during exit anim
    'duration-200', 'ease-in-out',
    isMaximized ? 'rounded-none' : 'rounded-2xl',
    isClosing ? 'animate-window-exit' : 'animate-window-enter',
    isMinimized ? 'hidden' : ''
  ].join(' ');

  const windowStyles: React.CSSProperties = {
    top: isMaximized ? position.y : currentPosition.y,
    left: isMaximized ? position.x : currentPosition.x,
    width: size.width,
    height: size.height,
    zIndex,
  };

  return (
    <div
      className={windowClasses}
      style={windowStyles}
      onMouseDown={onFocus}
    >
      <header
        ref={dragHandleRef}
        className={`flex items-center justify-between px-1 h-8 bg-white/[.02] dark:bg-black/5 flex-shrink-0 ${isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <div className="w-24"></div> {/* Spacer */}
        <div className="flex-grow text-center">
            <span className="font-medium text-xs text-outline select-none">{title}</span>
        </div>
        <div className="flex items-center space-x-0.5 w-24 justify-end h-full">
            <button onClick={onMinimize} className="w-8 h-full rounded-sm flex items-center justify-center text-outline hover:bg-gradient-to-b hover:from-white/40 hover:to-white/10 dark:hover:from-white/20 dark:hover:to-white/5 hover:shadow-md active:shadow-inner transition-all duration-150" aria-label="最小化">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
            </button>
            <button
                onClick={onMaximizeToggle}
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
        </div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto text-outline">
        {children}
      </main>
    </div>
  );
};

export default Window;
