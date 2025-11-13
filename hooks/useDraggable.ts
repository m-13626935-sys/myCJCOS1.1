
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDraggableOptions<T extends HTMLElement> {
    initialPosition: { x: number; y: number };
    onPositionChange?: (pos: { x: number; y: number }) => void;
    disabled?: boolean;
    onDragStart?: (event: MouseEvent) => void;
    onDrag?: (event: MouseEvent) => void;
    onDragEnd?: (event: MouseEvent) => void;
}

export function useDraggable<T extends HTMLElement>({
    initialPosition,
    onPositionChange,
    disabled = false,
    onDragStart,
    onDrag,
    onDragEnd,
}: UseDraggableOptions<T>) {
    const [position, setPosition] = useState(initialPosition);
    const ref = useRef<T>(null);
    const isDragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        
        let newX = e.clientX - offset.current.x;
        let newY = e.clientY - offset.current.y;

        const targetElement = ref.current;
        if (targetElement) {
             // Clamp position to be within viewport
            newX = Math.max(0, Math.min(newX, window.innerWidth - targetElement.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - targetElement.offsetHeight));
        }

        const newPos = { x: newX, y: newY };
        setPosition(newPos);
        if (onPositionChange) {
            onPositionChange(newPos);
        }
        if (onDrag) {
            onDrag(e);
        }
    }, [onPositionChange, onDrag]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (isDragging.current && onDragEnd) {
            onDragEnd(e);
        }
        isDragging.current = false;
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, onDragEnd]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (disabled) return;
        
        const target = e.target as HTMLElement;

        // Do not drag if clicking on interactive elements or elements with their own drag handlers
        if (target.closest('button, a, input, textarea, select, [role="button"], [draggable="true"]')) {
            return;
        }

        const targetElement = ref.current;
        if (!targetElement || (e.button && e.button !== 0)) return; // Only drag on left-click

        isDragging.current = true;
        
        const rect = targetElement.getBoundingClientRect();

        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        if (onDragStart) {
            onDragStart(e);
        }
        
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [disabled, onDragStart, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const currentRef = ref.current;
        if (currentRef && !disabled) {
            currentRef.addEventListener('mousedown', handleMouseDown);
        }
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('mousedown', handleMouseDown);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp, disabled]);
    
    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition]);

    return { ref, position };
}