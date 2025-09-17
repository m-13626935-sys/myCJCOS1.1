import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const BlackboardApp: React.FC = () => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(5);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas size to its container's size
    const parent = canvas.parentElement;
    if (parent) {
      const { clientWidth, clientHeight } = parent;
      canvas.width = clientWidth * 2; // Use scale for better resolution
      canvas.height = clientHeight * 2;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      contextRef.current = context;
    }
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = isErasing ? '#262626' : color; // Blackboard color for eraser
      contextRef.current.lineWidth = isErasing ? lineWidth * 4 : lineWidth;
    }
  }, [color, lineWidth, isErasing]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>): { offsetX: number, offsetY: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { offsetX: 0, offsetY: 0 };
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
          return {
              offsetX: e.touches[0].clientX - rect.left,
              offsetY: e.touches[0].clientY - rect.top
          };
      }
      return {
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;
    const { offsetX, offsetY } = getCoords(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoords(e);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  
  const chalkColors = ['#FFFFFF', '#FF5252', '#448AFF', '#FFEB3B', '#4CAF50'];

  return (
    <div className="h-full w-full flex flex-col bg-[#262626] -m-4">
      <div className="flex-shrink-0 p-2 bg-black/20 flex items-center justify-between gap-4 text-outline z-10 flex-wrap">
        <div className="flex items-center gap-2">
            <span className="text-sm mr-2">{t('blackboard_color')}</span>
            {chalkColors.map(c => (
                 <button 
                    key={c}
                    onClick={() => { setColor(c); setIsErasing(false); }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${color === c && !isErasing ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`${t('blackboard_aria_color_picker')} ${c}`}
                 />
            ))}
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="pen-size" className="text-sm whitespace-nowrap">{t('blackboard_pen_size')}</label>
            <input 
                id="pen-size"
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={e => setLineWidth(Number(e.target.value))}
                className="w-24"
                aria-label={t('blackboard_aria_pen_size')}
            />
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsErasing(!isErasing)}
                className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${isErasing ? 'bg-blue-500/80' : 'bg-black/20'}`}
                aria-label={t('blackboard_aria_eraser')}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z"></path></svg>
                {t('blackboard_eraser')}
            </button>
            <button 
                onClick={clearCanvas}
                className="px-3 py-2 rounded-md bg-red-500/80 hover:bg-red-600/80 flex items-center gap-2 transition-colors"
                aria-label={t('blackboard_aria_clear')}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                {t('blackboard_clear')}
            </button>
        </div>
      </div>
      <div className="flex-grow relative">
         <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={finishDrawing}
            onTouchMove={draw}
            className="absolute top-0 left-0"
         />
      </div>
    </div>
  );
};

export default BlackboardApp;
