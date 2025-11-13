import { useRef, useEffect, useCallback } from 'react';

export function useLightField<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ref.current.style.setProperty('--light-x', `${x}px`);
        ref.current.style.setProperty('--light-y', `${y}px`);
    }, []);

    const handlePointerEnter = useCallback((e: PointerEvent) => {
        if (!ref.current) return;
        ref.current.style.setProperty('--light-opacity', '1');
        // Set initial position on enter to avoid a jump
        handlePointerMove(e);
    }, [handlePointerMove]);

    const handlePointerLeave = useCallback(() => {
        if (ref.current) {
            ref.current.style.setProperty('--light-opacity', '0');
        }
    }, []);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        
        // Ensure initial opacity is 0
        element.style.setProperty('--light-opacity', '0');

        element.addEventListener('pointerenter', handlePointerEnter);
        element.addEventListener('pointerleave', handlePointerLeave);
        element.addEventListener('pointermove', handlePointerMove);

        return () => {
            element.removeEventListener('pointerenter', handlePointerEnter);
            element.removeEventListener('pointerleave', handlePointerLeave);
            element.removeEventListener('pointermove', handlePointerMove);
        };
    }, [handlePointerEnter, handlePointerMove, handlePointerLeave]);

    return ref;
}
