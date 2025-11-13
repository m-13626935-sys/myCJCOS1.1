import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CircleSearchOverlayProps {
  onCapture: (region: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

const CircleSearchOverlay: React.FC<CircleSearchOverlayProps> = ({ onCapture, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const pathRef = useRef<Path2D | null>(null);
  const pointsRef = useRef<{x: number, y: number}[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([6, 4]); // Dashed line for a more "selection" feel

    const handleMouseDown = (e: MouseEvent) => {
      setIsDrawing(true);
      pathRef.current = new Path2D();
      pointsRef.current = [];
      const { clientX: x, clientY: y } = e;
      pathRef.current.moveTo(x, y);
      pointsRef.current.push({x, y});
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !pathRef.current) return;
      const { clientX: x, clientY: y } = e;
      pathRef.current.lineTo(x, y);
      pointsRef.current.push({x, y});
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.stroke(pathRef.current);
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      
      if (pointsRef.current.length > 1) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pointsRef.current.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const padding = 15; // Add some padding around the bounding box
        onCapture({
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2,
        });
      } else {
        onCancel();
      }
    };
    
    // FIX: Corrected corrupted function definition and implemented logic.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCapture, onCancel]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm cursor-crosshair animate-fade-in">
      <canvas ref={canvasRef} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white text-lg font-semibold px-6 py-3 rounded-xl select-none pointer-events-none">
          <p>{t('ai_search_circle_search_prompt')}</p>
      </div>
    </div>
  );
};

// FIX: Added missing default export.
export default CircleSearchOverlay;
