import React, { useEffect, useState } from 'react';

interface StartupAnimationProps {
  onFinished: () => void;
}

const StartupAnimation: React.FC<StartupAnimationProps> = ({ onFinished }) => {
  const [phase, setPhase] = useState('booting'); // booting -> spinner -> finished

  useEffect(() => {
    const sequence = [
      setTimeout(() => setPhase('spinner'), 500),    // Show spinner
      setTimeout(() => setPhase('finished'), 3000),   // Start fade out
      setTimeout(() => onFinished(), 3500)            // End animation and notify parent
    ];

    // Cleanup timeouts on component unmount
    return () => sequence.forEach(clearTimeout);
  }, [onFinished]);

  return (
    <div className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 transition-opacity duration-500 ease-in-out ${phase === 'finished' ? 'opacity-0' : 'opacity-100'}`}>
      {/* Spinner */}
      <div className={`transition-opacity duration-500 ${phase === 'spinner' || phase === 'finished' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default StartupAnimation;
