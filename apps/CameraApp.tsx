import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CameraApp: React.FC = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    // Stop any existing stream before starting a new one
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setCapturedImage(null); // Go back to camera view
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(t('camera_error_access'));
    }
  };

  useEffect(() => {
    startCamera();

    // The current stream will be captured in this closure
    const currentStream = stream;
    // Cleanup function to stop the stream when the component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // The empty dependency array ensures this runs only on mount and unmount.

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);

    // Stop the camera stream after taking a photo
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `CJC-OS-Capture-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleRetake = () => {
    startCamera();
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black -m-4 relative text-outline">
      {error ? (
        <div className="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="mt-2">{error}</p>
        </div>
      ) : (
        <>
          {capturedImage ? (
            <img src={capturedImage} alt={t('camera_capture_alt')} className="max-w-full max-h-full object-contain" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}

          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 z-10">
            {capturedImage ? (
              <>
                <button onClick={handleRetake} className="jelly-button flex items-center gap-2 px-6 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.32 5.002l-.724.723a.75.75 0 01-1.06-1.06l.723-.724A5.5 5.5 0 0115.312 11.424zM4.688 8.576a5.5 5.5 0 019.32-5.002l.724-.723a.75.75 0 011.06 1.06l-.723.724A5.5 5.5 0 014.688 8.576z" clipRule="evenodd" /><path d="M13 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t('camera_retake_photo')}
                </button>
                <button onClick={handleDownload} className="jelly-button flex items-center gap-2 px-6 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>
                  {t('camera_download_photo')}
                </button>
              </>
            ) : (
              <button onClick={handleTakePhoto} className="w-20 h-20 rounded-full bg-white/30 ring-4 ring-white/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 active:scale-95 transition-all duration-200" aria-label={t('camera_take_photo')}>
                <div className="w-16 h-16 rounded-full bg-white"></div>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraApp;
