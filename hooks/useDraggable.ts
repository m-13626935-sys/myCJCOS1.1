
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDraggableOptions<T extends HTMLElement> {
    initialPosition: { x: number; y: number };
    onPositionChange?: (pos: { x: number; y: number }) => void;
    disabled?: boolean;
}

export function useDraggable<T extends HTMLElement>({
    initialPosition,
    onPositionChange,
    disabled = false,
}: UseDraggableOptions<T>) {
    const [position, setPosition] = useState(initialPosition);
    const ref = useRef<T>(null);
    const isDragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (disabled) return;
        const targetElement = ref.current;
        if (!targetElement) return;

        isDragging.current = true;
        const rect = targetElement.getBoundingClientRect();
        
        // This is the bounding rect of the draggable handle, not the window itself.
        // We need the window's position to calculate the correct offset.
        // Let's assume the parent element is the window we're moving.
        const parentRect = targetElement.parentElement?.getBoundingClientRect();

        if (parentRect) {
            offset.current = {
                x: e.clientX - parentRect.left,
                y: e.clientY - parentRect.top,
            };
        }

        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [disabled]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        
        let newX = e.clientX - offset.current.x;
        let newY = e.clientY - offset.current.y;

        // Clamp position to be within viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - (ref.current?.parentElement?.offsetWidth ?? 0)));
        newY = Math.max(0, Math.min(newY, window.innerHeight - (ref.current?.parentElement?.offsetHeight ?? 0)));

        const newPos = { x: newX, y: newY };
        setPosition(newPos);
        if (onPositionChange) {
            onPositionChange(newPos);
        }
    }, [onPositionChange]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

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