import React, { useState } from 'react';
import type { AppProps } from '../types';

/**
 * An app that now functions as a settings panel for the system-wide glass button effect.
 */
const GlassButtonApp: React.FC<Partial<AppProps>> = ({ setButtonOpacity, buttonOpacity = 0.15 }) => {
  // Local state for the slider, initialized with the global value
  const [localOpacityPercent, setLocalOpacityPercent] = useState(Math.round(buttonOpacity * 100));

  const baseButtonClasses = "jelly-button px-8 py-4 text-lg rounded-xl shadow-lg border border-white/[.3] backdrop-blur-xl transition-all duration-300 ease-in-out";

  // The style for the preview button uses the local slider state
  const previewStyle = {
    // We use a fixed white RGBA for the preview to work in both light/dark modes inside the app window.
    // The actual system buttons use CSS variables to respect the theme.
    backgroundColor: `rgba(255, 255, 255, ${localOpacityPercent / 100})`,
  };

  const handleApply = () => {
    if (setButtonOpacity) {
      setButtonOpacity(localOpacityPercent / 100);
    }
  };

  const handleReset = () => {
    const defaultOpacity = 0.15;
    setLocalOpacityPercent(defaultOpacity * 100);
    if (setButtonOpacity) {
      setButtonOpacity(defaultOpacity);
    }
  };

  return (
    <div className="p-8 flex flex-col items-center justify-center h-full w-full bg-transparent text-outline">
      <h2 className="text-2xl font-bold mb-2">
        玻璃按钮设置
      </h2>
      <p className="text-sm text-center max-w-xs mb-8">
          调整下方滑块预览效果，然后点击“应用”以更改系统中所有玻璃按钮的透明度。
      </p>

      {/* Preview Area */}
      <div className="p-10 bg-black/5 dark:bg-black/10 rounded-2xl mb-8">
         <button
          className={`${baseButtonClasses} text-outline`}
          style={previewStyle}
        >
          预览按钮
        </button>
      </div>

      {/* Slider Control */}
      <div className="w-full max-w-sm mb-8">
        <label htmlFor="opacity-slider" className="block text-sm font-medium mb-2">
          背景透明度: {localOpacityPercent}%
        </label>
        <input
          id="opacity-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={localOpacityPercent}
          onChange={(e) => setLocalOpacityPercent(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
          aria-label="调整按钮透明度"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <button
            onClick={handleReset}
            className="px-6 py-2 bg-white/[.1] border border-white/30 backdrop-blur-md rounded-lg shadow-md text-outline hover:bg-white/[.2] active:scale-95 transition-all"
        >
            重置
        </button>
        <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-500/50 border border-blue-500/80 backdrop-blur-md rounded-lg shadow-lg text-outline font-semibold hover:bg-blue-500/70 active:scale-95 transition-all"
        >
            应用
        </button>
      </div>
    </div>
  );
};

export default GlassButtonApp;