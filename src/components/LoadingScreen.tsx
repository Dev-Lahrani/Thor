import React from 'react';
import { Hammer } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Initializing global monitoring...' 
}) => {
  return (
    <div className="fixed inset-0 bg-[#080810] flex items-center justify-center z-50 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Loading content */}
      <div className="relative flex flex-col items-center">
        {/* Logo container with animated ring */}
        <div className="relative mb-10">
          {/* Outer ring */}
          <div className="absolute inset-[-20px] rounded-full border border-neon-cyan/20 animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-[-10px] rounded-full border border-neon-purple/20 animate-[spin_6s_linear_infinite_reverse]" />
          
          {/* Logo box */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-transparent to-neon-purple/20 border border-white/10 flex items-center justify-center shadow-2xl">
            <Hammer className="w-10 h-10 text-neon-cyan" />
            <div className="absolute inset-0 rounded-2xl bg-neon-cyan/10 blur-xl" />
          </div>
        </div>

        {/* Brand text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-purple bg-clip-text text-transparent">
              THOR
            </span>
          </h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-[0.2em] uppercase">
            Cyber Threat Intelligence
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-cyan rounded-full"
            style={{
              width: '40%',
              animation: 'loading-bar 1.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Status text */}
        <p className="text-xs text-gray-500 font-mono tracking-wide">
          {message}
        </p>

        {/* Loading indicators */}
        <div className="flex items-center gap-1.5 mt-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ 
                backgroundColor: 'rgba(0, 212, 255, 0.6)',
                animation: `pulse 1s ease-in-out infinite`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Add loading bar keyframes via style tag */}
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
