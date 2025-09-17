import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { v4 as uuidvv4 } from 'uuid';
import type { Presentation, Slide, PresentationElement, AppProps } from '../types';
import { geminiService } from '../services/geminiService';
import { LANGUAGES } from '../constants';

// --- Constants ---
const ICONS = {
    magic: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a1.5 1.5 0 01.837 2.843l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223A1.5 1.5 0 1110 8.5v3a1.5 1.5 0 110-3v-1.5z"></path><path d="M3.34 6.342a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316zm10.32 0a1.5 1.5 0 012.333-.918l1.834 1.223a.75.75 0 010 1.268l-1.834 1.223a1.5 1.5 0 11-2.333-.918v5.098a1.5 1.5 0 11-3 0V8.658a1.5 1.5 0 013 0v-2.316z"></path></svg>,
    addSlide: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" /></svg>,
    addText: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2.5a.75.75 0 01.75.75v.5h3.5a.75.75 0 010 1.5h-3.5v10.5a.75.75 0 01-1.5 0V5.25H5.5a.75.75 0 010-1.5h3.5v-.5a.75.75 0 01.75-.75z" /></svg>,
    addImage: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909-.48- .48a.75.75 0 00-1.06 0l-5.18 5.181-1.65-1.65a.75.75 0 00-1.06 0L2.5 11.06zM15 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" /></svg>,
    rehearse: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 8.5A.5.5 0 016 9v1a4 4 0 004 4 4 4 0 004-4V9a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h3a.5.5 0 010 1h-7a.5.5 0 010-1h3v-2.025A5 5 0 015 10V9a.5.5 0 01.5-.5z" /></svg>,
    play: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>,
    delete: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>,
};

const defaultSlide: Slide = {
    id: uuidvv4(),
    backgroundColor: '#FFFFFF',
    elements: [
        { id: uuidvv4(), type: 'text', x: 50, y: 50, width: 800, height: 100, content: 'Title', style: { fontSize: 60, fontWeight: 700, color: '#000000' } },
        { id: uuidvv4(), type: 'text', x: 50, y: 160, width: 800, height: 50, content: 'Subtitle', style: { fontSize: 30, fontWeight: 400, color: '#4A5568' } },
    ]
};

const ToolbarButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode }> = ({ onClick, label, children }) => (
    <button onClick={onClick} className="jelly-button flex-col w-20 h-20 p-2 text-xs text-outline" title={label}>
        {children}
        <span className="mt-1">{label}</span>
    </button>
);

type InteractionState = {
    type: 'move' | 'resize';
    elementId: string;
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
    startWidth: number;
    startHeight: number;
    handle: string; // For resizing, e.g., 'br', 'tl', 't', 'l'...
} | null;

const resizeHandles = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'];
const getCursorForHandle = (handle: string) => {
    switch (handle) {
        case 'tl':
        case 'br':
            return 'nwse-resize';
        case 'tr':
        case 'bl':
            return 'nesw-resize';
        case 't':
        case 'b':
            return 'ns-resize';
        case 'l':
        case 'r':
            return 'ew-resize';
        default:
            return 'auto';
    }
};

const SlidesApp: React.FC<Partial<AppProps>> = ({ close }) => {
    const { t, language } = useLanguage();
    const [presentation, setPresentation] = useState<Presentation>({
        slides: [defaultSlide],
        width: 1280,
        height: 720,
    });
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [mode, setMode] = useState<'edit' | 'present' | 'rehearse'>('edit');
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
    
    // Refs for elements
    const imageInputRef = useRef<HTMLInputElement>(null);
    const canvasContainerRef = useRef<HTMLElement>(null);

    // Dynamic Scaling State
    const [canvasScale, setCanvasScale] = useState(1);

    // Interaction State
    const [interactionState, setInteractionState] = useState<InteractionState>(null);
    
    // Rehearsal state
    const [isRecording, setIsRecording] = useState(false);
    const [aiCoachTip, setAiCoachTip] = useState<string | null>(null);
    const [rehearsalError, setRehearsalError] = useState<string | null>(null);
    const [micCheck, setMicCheck] = useState<'checking' | 'found' | 'not_found' | 'error'>('checking');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Translation State
    const [targetLang, setTargetLang] = useState<string>(language);
    const [isTranslating, setIsTranslating] = useState(false);
    
    const currentSlide = presentation.slides[currentSlideIndex];
    const selectedElement = currentSlide?.elements.find(e => e.id === selectedElementId);

    const updatePresentation = (newPresentation: Presentation) => {
        setPresentation(newPresentation);
    };

    const updatePresentationSettings = (updates: Partial<{width: number; height: number}>) => {
        setPresentation(p => ({ ...p, ...updates }));
    };

    const addSlide = () => {
        const newSlide: Slide = {
            id: uuidvv4(),
            backgroundColor: '#FFFFFF',
            elements: [],
        };
        const newSlides = [...presentation.slides, newSlide];
        updatePresentation({ ...presentation, slides: newSlides });
        setCurrentSlideIndex(newSlides.length - 1);
    };
    
    const deleteSlide = (indexToDelete: number) => {
        const newSlides = presentation.slides.filter((_, index) => index !== indexToDelete);
        if (newSlides.length === 0) {
            const newSlide: Slide = { id: uuidvv4(), backgroundColor: '#FFFFFF', elements: [] };
            updatePresentation({ ...presentation, slides: [newSlide] });
            setCurrentSlideIndex(0);
        } else {
             if (currentSlideIndex >= indexToDelete) {
                setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
            }
            updatePresentation({ ...presentation, slides: newSlides });
        }
    };

    const addElement = (type: 'text' | 'image', src?: string) => {
        const newElement: PresentationElement = {
            id: uuidvv4(),
            type,
            x: 100,
            y: 100,
            width: type === 'text' ? 300 : 200,
            height: type === 'text' ? 50 : 150,
            content: type === 'text' ? 'New Text' : undefined,
            src: type === 'image' ? src : undefined,
            style: { fontSize: 24, fontWeight: 400, color: '#000000' },
        };
        const newSlides = [...presentation.slides];
        newSlides[currentSlideIndex].elements.push(newElement);
        updatePresentation({ ...presentation, slides: newSlides });
        setSelectedElementId(newElement.id);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    addElement('image', event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
    };
    
    const deleteElement = (elementId: string) => {
        const newSlides = [...presentation.slides];
        const elements = newSlides[currentSlideIndex].elements.filter(el => el.id !== elementId);
        newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], elements };
        updatePresentation({ ...presentation, slides: newSlides });
        setSelectedElementId(null);
    };

    const updateElement = (elementId: string, updates: Partial<PresentationElement>) => {
        const newSlides = presentation.slides.map((slide, index) => {
            if (index !== currentSlideIndex) return slide;
            return {
                ...slide,
                elements: slide.elements.map(el =>
                    el.id === elementId ? { ...el, ...updates } : el
                )
            };
        });
        updatePresentation({ ...presentation, slides: newSlides });
    };

    const handleAiGenerateDraft = async (prompt: string): Promise<void> => {
        try {
            const generatedSlidesData = await geminiService.generatePresentationSlides(prompt);
            const newSlides: Slide[] = generatedSlidesData.map(slideData => ({
                ...slideData,
                id: uuidvv4(),
                elements: slideData.elements.map(el => ({ ...el, id: uuidvv4() }))
            }));
            if (newSlides.length > 0) {
                 updatePresentation({ ...presentation, slides: newSlides });
                 setCurrentSlideIndex(0);
            }
        } catch (error) {
            console.error("Failed to generate presentation:", error);
        }
    };
    
    const handleAiGenerateImage = async (prompt: string): Promise<void> => {
        try {
            const imageUrl = await geminiService.generateImage(prompt);
            addElement('image', imageUrl);
        } catch (error) {
            console.error("Failed to generate image:", error);
        }
    };

    const handleAiSummarize = async (): Promise<string> => {
        try {
            const allText = presentation.slides
                .flatMap(slide => slide.elements)
                .filter(el => el.type === 'text' && el.content)
                .map(el => el.content)
                .join('\n');
            
            if (!allText.trim()) return "No text found to summarize.";

            const { text } = await geminiService.summarizeText(allText);
            return text;
        } catch (error) {
            console.error("Failed to summarize presentation:", error);
            return "Could not generate summary.";
        }
    };
    
    const handleTranslate = async () => {
        if (!selectedElement || !selectedElement.content || isTranslating) return;
        setIsTranslating(true);
        try {
            const targetLanguage = LANGUAGES.find(l => l.code === targetLang)?.name || 'English';
            const { text } = await geminiService.translateText(selectedElement.content, targetLanguage);
            updateElement(selectedElement.id, { content: text });
        } catch (e) {
            console.error("Translation failed:", e);
        } finally {
            setIsTranslating(false);
        }
    };

    // --- Dynamic Scaling Logic ---
    useEffect(() => {
        const calculateScale = () => {
            if (canvasContainerRef.current) {
                const { clientWidth, clientHeight } = canvasContainerRef.current;
                const scaleX = clientWidth / presentation.width;
                const scaleY = clientHeight / presentation.height;
                setCanvasScale(Math.min(scaleX, scaleY) * 0.95); // * 0.95 for padding
            }
        };
        calculateScale();
        const resizeObserver = new ResizeObserver(calculateScale);
        if (canvasContainerRef.current) {
            resizeObserver.observe(canvasContainerRef.current);
        }
        return () => {
            if (canvasContainerRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizeObserver.unobserve(canvasContainerRef.current);
            }
        };
    }, [presentation.width, presentation.height]);


    // --- Interaction (Move/Resize) Logic ---
    const handleInteractionStart = useCallback((
        e: React.MouseEvent,
        elementId: string,
        type: 'move' | 'resize',
        handle: string = 'move'
    ) => {
        e.preventDefault();
        e.stopPropagation();
        
        const element = currentSlide.elements.find(el => el.id === elementId);
        if (!element) return;

        setSelectedElementId(elementId);
        
        setInteractionState({
            type,
            elementId,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startElX: element.x,
            startElY: element.y,
            startWidth: element.width,
            startHeight: element.height,
        });
    }, [currentSlide.elements]);

    useEffect(() => {
        if (!interactionState) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { type, elementId, startX, startY, startElX, startElY, startWidth, startHeight, handle } = interactionState;
            const dx = e.clientX / canvasScale - startX / canvasScale;
            const dy = e.clientY / canvasScale - startY / canvasScale;
            
            if (type === 'move') {
                updateElement(elementId, { x: startElX + dx, y: startElY + dy });
            } else if (type === 'resize') {
                let newX = startElX;
                let newY = startElY;
                let newWidth = startWidth;
                let newHeight = startHeight;
                const minSize = 20;

                if (handle.includes('r')) newWidth = Math.max(minSize, startWidth + dx);
                if (handle.includes('l')) {
                    newWidth = Math.max(minSize, startWidth - dx);
                    newX = startElX + dx;
                }
                if (handle.includes('b')) newHeight = Math.max(minSize, startHeight + dy);
                if (handle.includes('t')) {
                    newHeight = Math.max(minSize, startHeight - dy);
                    newY = startElY + dy;
                }
                updateElement(elementId, { x: newX, y: newY, width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setInteractionState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interactionState, updateElement, canvasScale]);
    
    // --- Rehearsal Logic ---
    useEffect(() => {
        if (mode === 'rehearse') {
            setRehearsalError(null);
            setAiCoachTip(null);
            setMicCheck('checking');
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices()
                    .then(devices => {
                        const hasMic = devices.some(device => device.kind === 'audioinput');
                        if (hasMic) {
                            setMicCheck('found');
                        } else {
                            setMicCheck('not_found');
                            setRehearsalError(t('slides_error_mic_not_found'));
                        }
                    })
                    .catch(err => {
                        console.error("Error enumerating devices:", err);
                        setMicCheck('error');
                        setRehearsalError(t('slides_error_mic_generic'));
                    });
            } else {
                setMicCheck('error');
                setRehearsalError(t('slides_error_unsupported_browser'));
            }
        }
    }, [mode, t]);
    
    const startRecording = async () => {
        // Mocked as it requires complex API not available in this context.
        setIsRecording(true);
    };

    const stopRecording = () => {
        // Mocked.
        setIsRecording(false);
        setAiCoachTip("This is a mock coaching tip.");
    };

    if (mode === 'present' || mode === 'rehearse') {
        const SlideContent = (
             <div className="w-full h-full relative" style={{ backgroundColor: currentSlide.backgroundColor }}>
                {currentSlide.elements.map(el => (
                    <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, ...el.style, whiteSpace: 'pre-wrap', color: el.style?.color || '#000000' }}>
                        {el.type === 'text' ? el.content : <img src={el.src} alt="" className="w-full h-full object-cover" />}
                    </div>
                ))}
            </div>
        );
        
        return (
             <div className="absolute inset-0 bg-black z-50 flex flex-col text-white items-center justify-center">
                <div style={{ width: presentation.width, height: presentation.height, transform: `scale(${canvasScale * 1.1})` }}>
                    {SlideContent}
                </div>
                {mode === 'rehearse' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 p-4 rounded-xl backdrop-blur-md flex flex-col items-center gap-4 w-full max-w-lg">
                         <h3 className="text-lg font-bold">{t('slides_rehearse_title')}</h3>
                         {rehearsalError && <p className="text-center bg-red-500/50 p-2 rounded-md text-sm">{rehearsalError}</p>}
                         {micCheck === 'checking' && !rehearsalError && <p className="text-sm opacity-80 animate-pulse">Checking for microphone...</p>}
                         {aiCoachTip && <p className="text-center bg-blue-500/30 p-2 rounded-md"><strong>{t('slides_rehearse_coach_tip')}:</strong> {aiCoachTip}</p>}
                         <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className="jelly-button px-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={micCheck !== 'found'}
                         >
                             {isRecording ? t('slides_rehearse_stop') : t('slides_rehearse_start')}
                             {isRecording && <span className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                         </button>
                    </div>
                )}
                 <div className="absolute bottom-4 right-4 flex gap-2">
                     <button onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))} className="jelly-button w-12 h-12 text-sm">Prev</button>
                     <button onClick={() => setCurrentSlideIndex(i => Math.min(presentation.slides.length - 1, i + 1))} className="jelly-button w-12 h-12 text-sm">{t('slides_rehearse_next_slide')}</button>
                     <button onClick={() => setMode('edit')} className="jelly-button px-4 h-12 text-sm">{t('slides_rehearse_exit')}</button>
                </div>
             </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-transparent text-outline -m-4">
            <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />
            {/* Toolbar */}
            <header className="flex-shrink-0 p-2 bg-black/10 dark:bg-white/5 flex items-center justify-between gap-4 text-outline z-10 flex-wrap">
                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={() => setIsAIAssistantOpen(true)} label={t('slides_create_with_ai')}>{ICONS.magic}</ToolbarButton>
                </div>
                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={addSlide} label={t('slides_add_slide')}>{ICONS.addSlide}</ToolbarButton>
                    <ToolbarButton onClick={() => addElement('text')} label={t('slides_add_text')}>{ICONS.addText}</ToolbarButton>
                    <ToolbarButton onClick={() => imageInputRef.current?.click()} label={t('slides_add_image')}>{ICONS.addImage}</ToolbarButton>
                </div>
                 <div className="flex items-center gap-2">
                    <ToolbarButton onClick={() => setMode('rehearse')} label={t('slides_rehearse')}>{ICONS.rehearse}</ToolbarButton>
                    <ToolbarButton onClick={() => setMode('present')} label={t('slides_present')}>{ICONS.play}</ToolbarButton>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-grow flex overflow-hidden">
                {/* Slides Thumbnail Sidebar */}
                <aside className="w-48 bg-black/5 dark:bg-white/5 p-2 overflow-y-auto">
                     {presentation.slides.map((slide, index) => {
                        const THUMBNAIL_WIDTH = 180;
                         return (
                            <div key={slide.id} className="relative group">
                                <div
                                    onClick={() => setCurrentSlideIndex(index)}
                                    className={`w-full p-1 rounded-md mb-2 cursor-pointer ring-2 ${index === currentSlideIndex ? 'ring-blue-500' : 'ring-transparent hover:ring-white/20'}`}
                                    style={{ aspectRatio: `${presentation.width} / ${presentation.height}` }}
                                >
                                    <div
                                        className="w-full h-full relative overflow-hidden"
                                        style={{ backgroundColor: slide.backgroundColor }}
                                    >
                                        <div
                                            className="absolute top-0 left-0"
                                            style={{
                                                width: presentation.width,
                                                height: presentation.height,
                                                transform: `scale(${THUMBNAIL_WIDTH / presentation.width})`,
                                                transformOrigin: 'top left',
                                            }}
                                        >
                                            {slide.elements.map(el => (
                                                <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, background: el.type === 'text' ? 'rgba(0,0,0,0.1)' : 'rgba(0,100,255,0.3)', color: el.style?.color || '#000000', fontSize: el.style?.fontSize, fontWeight: el.style?.fontWeight }}>
                                                   {el.type === 'text' && <span className="p-1">{el.content}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => deleteSlide(index)} className="absolute top-1 right-1 bg-red-600/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" title={t('slides_delete_slide')}>
                                    {ICONS.delete}
                                </button>
                            </div>
                        )
                    })}
                </aside>
                
                {/* Slide Canvas */}
                <section ref={canvasContainerRef} className="flex-1 flex items-center justify-center p-4 bg-black/10 dark:bg-black/20" onClick={() => setSelectedElementId(null)}>
                    <div
                        className="bg-gray-800 shadow-2xl relative"
                        style={{
                            width: presentation.width,
                            height: presentation.height,
                            backgroundColor: currentSlide.backgroundColor,
                            transform: `scale(${canvasScale})`,
                            transformOrigin: 'center center'
                        }}
                    >
                        {currentSlide.elements.map(el => (
                            <div
                                key={el.id}
                                onMouseDown={(e) => handleInteractionStart(e, el.id, 'move')}
                                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                className={`absolute border-2 ${selectedElementId === el.id ? 'border-blue-500' : 'border-transparent hover:border-blue-500/50'} ${interactionState?.type === 'move' ? 'cursor-move' : 'cursor-pointer'}`}
                                style={{ left: el.x, top: el.y, width: el.width, height: el.height, ...el.style, color: el.style?.color || '#000000' }}
                            >
                                {el.type === 'text' ? <div className="w-full h-full select-none" style={{whiteSpace: 'pre-wrap'}}>{el.content}</div> : <img src={el.src} alt="" className="w-full h-full object-cover select-none pointer-events-none" />}
                                {selectedElementId === el.id && (
                                    <>
                                        {resizeHandles.map(handle => (
                                            <div
                                                key={handle}
                                                onMouseDown={(e) => handleInteractionStart(e, el.id, 'resize', handle)}
                                                className="absolute bg-blue-500 w-3 h-3 rounded-full -m-1.5 z-10"
                                                style={{
                                                    top: handle.includes('t') ? 0 : (handle.includes('b') ? '100%' : '50%'),
                                                    left: handle.includes('l') ? 0 : (handle.includes('r') ? '100%' : '50%'),
                                                    transform: `translate(${handle.includes('l') ? '-50%' : (handle.includes('r') ? '-50%' : '-50%')}, ${handle.includes('t') ? '-50%' : (handle.includes('b') ? '-50%' : '-50%')})`,
                                                    cursor: getCursorForHandle(handle),
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* Inspector Panel */}
                <aside className="w-64 bg-black/5 dark:bg-white/5 p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">{selectedElement ? t('slides_element_inspector') : t('slides_slide_settings')}</h3>
                        {selectedElementId && (
                            <button onClick={() => deleteElement(selectedElementId)} title={t('slides_delete_element')} className="p-1 text-red-500 hover:bg-red-500/20 rounded-full transition-colors">
                                {ICONS.delete}
                            </button>
                        )}
                    </div>
                    {selectedElement ? (
                        <div className="space-y-4">
                            {selectedElement.type === 'text' && (
                                <>
                                    <div>
                                        <label className="text-sm">Content</label>
                                        <textarea
                                            value={selectedElement.content || ''}
                                            onChange={e => updateElement(selectedElementId!, { content: e.target.value })}
                                            className="w-full p-2 rounded bg-white/10 mt-1 h-24 resize-y text-outline"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm">{t('slides_font_size')}</label>
                                        <input
                                            type="number"
                                            value={selectedElement.style?.fontSize || 24}
                                            onChange={e => updateElement(selectedElementId!, { style: { ...selectedElement.style, fontSize: Number(e.target.value) } })}
                                            className="w-full p-1 rounded bg-white/10 mt-1 text-outline"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm">{t('slides_font_color')}</label>
                                        <input
                                            type="color"
                                            value={selectedElement.style?.color || '#FFFFFF'}
                                            onChange={e => updateElement(selectedElementId!, { style: { ...selectedElement.style, color: e.target.value } })}
                                            className="w-full h-8 p-0 rounded bg-transparent mt-1"
                                        />
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-white/10">
                                        <h4 className="font-semibold text-sm">{t('slides_translate')}</h4>
                                        <select
                                            value={targetLang}
                                            onChange={e => setTargetLang(e.target.value)}
                                            className="w-full p-2 rounded bg-white/10 text-outline border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code} className="bg-gray-700">{lang.nativeName}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleTranslate}
                                            disabled={isTranslating}
                                            className="w-full jelly-button px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isTranslating ? `${t('slides_translating')}...` : t('slides_translate_button')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm">{t('slides_width')}</label>
                                <input
                                    type="number"
                                    value={presentation.width}
                                    onChange={e => updatePresentationSettings({ width: Math.max(100, Number(e.target.value)) })}
                                    className="w-full p-1 rounded bg-white/10 mt-1 text-outline"
                                />
                            </div>
                            <div>
                                <label className="text-sm">{t('slides_height')}</label>
                                <input
                                    type="number"
                                    value={presentation.height}
                                    onChange={e => updatePresentationSettings({ height: Math.max(100, Number(e.target.value)) })}
                                    className="w-full p-1 rounded bg-white/10 mt-1 text-outline"
                                />
                            </div>
                        </div>
                    )}
                </aside>
            </main>
             {isAIAssistantOpen && <AIAssistantPanel
                onClose={() => setIsAIAssistantOpen(false)}
                onGenerateDraft={handleAiGenerateDraft}
                onGenerateImage={handleAiGenerateImage}
                onSummarize={handleAiSummarize}
             />}
        </div>
    );
};

const AIAssistantPanel: React.FC<{
    onClose: () => void;
    onGenerateDraft: (prompt: string) => Promise<void>;
    onGenerateImage: (prompt: string) => Promise<void>;
    onSummarize: () => Promise<string>;
}> = ({ onClose, onGenerateDraft, onGenerateImage, onSummarize }) => {
    const { t } = useLanguage();
    const [draftPrompt, setDraftPrompt] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState< 'draft' | 'image' | 'summary' | null>(null);
    
    const handleSubmitDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draftPrompt.trim() || isLoading) return;
        setIsLoading('draft');
        await onGenerateDraft(draftPrompt);
        setIsLoading(null);
        onClose();
    };

    const handleSubmitImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imagePrompt.trim() || isLoading) return;
        setIsLoading('image');
        await onGenerateImage(imagePrompt);
        setIsLoading(null);
        setImagePrompt(''); // Clear after generation
    };

    const handleGetSummary = async () => {
        if (isLoading) return;
        setIsLoading('summary');
        const result = await onSummarize();
        setSummary(result);
        setIsLoading(null);
    };
    
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-30 flex items-center justify-center animate-window-enter" onClick={onClose}>
            <div className="bg-gray-800/80 p-6 rounded-xl shadow-2xl w-full max-w-2xl ring-1 ring-white/20 text-white flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-center">{t('slides_ai_panel_title')}</h2>
                <div className="flex-grow overflow-y-auto space-y-6 pr-4 -mr-4">
                    {/* Generate Draft */}
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h3 className="font-semibold">{t('slides_ai_generate_draft')}</h3>
                        <p className="text-sm opacity-70 mb-3">{t('slides_ai_generate_draft_desc')}</p>
                        <form onSubmit={handleSubmitDraft} className="flex gap-2">
                            <input type="text" value={draftPrompt} onChange={e => setDraftPrompt(e.target.value)} placeholder={t('slides_ai_draft_prompt_placeholder')} className="flex-grow p-2 rounded-md bg-white/10 text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 ring-white/20" />
                            <button type="submit" disabled={!draftPrompt.trim() || !!isLoading} className="jelly-button px-4 py-2 text-sm disabled:opacity-50">
                               {isLoading === 'draft' ? '...' : t('slides_ai_prompt_button')}
                            </button>
                        </form>
                    </div>
                     {/* Generate Image */}
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h3 className="font-semibold">{t('slides_ai_generate_image')}</h3>
                        <p className="text-sm opacity-70 mb-3">{t('slides_ai_generate_image_desc')}</p>
                        <form onSubmit={handleSubmitImage} className="flex gap-2">
                            <input type="text" value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder={t('slides_ai_image_prompt_placeholder')} className="flex-grow p-2 rounded-md bg-white/10 text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 ring-white/20" />
                             <button type="submit" disabled={!imagePrompt.trim() || !!isLoading} className="jelly-button px-4 py-2 text-sm disabled:opacity-50">
                               {isLoading === 'image' ? '...' : t('slides_ai_prompt_button')}
                            </button>
                        </form>
                    </div>
                     {/* Summarize */}
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h3 className="font-semibold">{t('slides_ai_summarize')}</h3>
                        <p className="text-sm opacity-70 mb-3">{t('slides_ai_summarize_desc')}</p>
                        <button onClick={handleGetSummary} disabled={!!isLoading} className="jelly-button w-full px-4 py-2 text-sm disabled:opacity-50">
                            {isLoading === 'summary' ? t('slides_ai_summarizing') : t('slides_ai_summary_button')}
                        </button>
                        {summary && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <h4 className="font-semibold text-sm mb-2">{t('slides_ai_summary_result')}</h4>
                                <p className="text-sm bg-black/20 p-3 rounded-md whitespace-pre-wrap">{summary}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlidesApp;