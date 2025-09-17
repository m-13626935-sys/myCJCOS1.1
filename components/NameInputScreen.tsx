import React, { useState } from 'react';

interface NameInputScreenProps {
  onNameSubmit: (name: string) => void;
  wallpaperUrl: string;
}

const NameInputScreen: React.FC<NameInputScreenProps> = ({ onNameSubmit, wallpaperUrl }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center bg-cover bg-center text-outline p-4"
      style={{ backgroundImage: `url('${wallpaperUrl}')` }}
    >
      {/* Background blur overlay - made darker and blurrier for more focus */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl z-0"></div>
      
      {/* Centered content container */}
      <div className="z-10 w-full max-w-md animate-fade-in-up text-center">
            
        {/* Increased font sizes for more impact */}
        <h1 className="text-5xl font-bold mb-2 text-outline">欢迎访问</h1>
        <p className="text-xl opacity-80 mb-8">请输入您的姓名开始体验</p>
        
        <form onSubmit={handleSubmit} className="w-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 mb-6 rounded-xl bg-black/20 dark:bg-white/10 backdrop-blur-md text-outline placeholder-outline border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-xl shadow-lg ring-1 ring-inset ring-white/30"
              placeholder="请输入您的姓名"
              autoFocus
            />
            
            <button
              type="submit"
              disabled={!name.trim()}
              // New button gradient and slightly adjusted styles
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 active:shadow-inner active:translate-y-0 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-2 text-lg font-semibold"
            >
              {/* Using a cleaner arrow icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              <span>进入系统</span>
            </button>
        </form>

        {/* Removed the terms of service text for a cleaner, more focused UI */}
      </div>
    </div>
  );
};

export default NameInputScreen;
