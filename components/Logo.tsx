
import React from 'react';
import { Bike, Wind } from 'lucide-react';
import { APP_NAME, APP_SUBTITLE } from '../constants';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'default' | '3d-race' | 'header-3d-anime'; 
}

const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, variant = 'default' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };

  // --- HEADER 3D ANIME RACE VARIANT (COMPACT & HORIZONTAL) ---
  if (variant === 'header-3d-anime') {
    return (
      <div className="relative w-[320px] h-[60px] overflow-hidden rounded-xl bg-slate-900 border border-slate-700/50 shadow-inner group cursor-pointer select-none">
        
        {/* 1. Background Layers */}
        <div className="absolute inset-0 flex items-end overflow-hidden">
            
            {/* Sky Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>

            {/* City Skyline (Buildings) - Parallax Layer 1 */}
            <MotionDiv 
              className="absolute bottom-2 flex items-end gap-1 opacity-30 text-slate-600"
              initial={{ x: 0 }}
              animate={{ x: -200 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              style={{ width: '200%' }}
            >
               {/* Generating a random-looking cityscape using spans */}
               {[...Array(30)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-current rounded-t-sm"
                    style={{ 
                        width: `${10 + (i % 4) * 8}px`, 
                        height: `${15 + (i * 7 % 25)}px`,
                        opacity: i % 2 === 0 ? 0.8 : 0.5 
                    }} 
                  />
               ))}
            </MotionDiv>

            {/* Road Texture - Clean Asphalt (No distracted moving dots) */}
            <div className="absolute bottom-0 w-full h-2 bg-slate-950 border-t border-slate-700/50 z-10 shadow-[0_-1px_5px_rgba(0,0,0,0.5)]"></div>
        </div>

        {/* 2. The Race Scene Container (Left to Right Movement) */}
        <div className="absolute inset-0 flex items-center px-4 perspective-[500px] z-20">
            
            {/* THE TEXT (DELIVERY SPEED) */}
            <MotionDiv
              className="absolute top-3 left-0 flex items-center gap-1.5 z-10"
              initial={{ x: -180, skewX: -20, opacity: 0 }}
              animate={{ 
                 x: [ -180, 80, 150, 350 ], // Enter, Cruise, Speed up, Exit
                 opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: 5, 
                ease: "linear", 
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            >
                {/* Words Swapped Positions */}
                <span className="text-xl font-black text-red-500 tracking-tighter italic drop-shadow-md" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>DELIVERY</span>
                <span className="text-xl font-black text-white tracking-tighter italic drop-shadow-md" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>SPEED</span>
                
                {/* Subtle Wind trailing text (kept as it is smooth) */}
                <MotionDiv 
                   className="absolute right-full top-1/2 w-16 h-0.5 bg-gradient-to-l from-white/10 to-transparent"
                   animate={{ width: [0, 40, 0] }}
                   transition={{ duration: 0.8, repeat: Infinity }}
                />
            </MotionDiv>

            {/* THE BIKE (The Hero) */}
            <MotionDiv
               className="absolute bottom-2.5 z-20"
               initial={{ x: -250 }}
               animate={{ 
                  x: [-250, 60, 180, 420], // Start behind, catch up, overtake, exit
                  y: [0, -1, 1, 0], // Vibration
                  scale: [0.8, 0.9, 1.1, 1.1] // Perspective zoom
               }}
               transition={{ 
                  x: { duration: 5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 },
                  y: { duration: 0.1, repeat: Infinity },
                  scale: { duration: 5, repeat: Infinity, repeatDelay: 0.5 }
               }}
            >
                {/* Wheelie Action */}
                <MotionDiv
                    animate={{ rotateZ: [0, 0, -8, -12, 0] }} // Wheelie when overtaking
                    transition={{ duration: 5, times: [0, 0.4, 0.5, 0.7, 1], repeat: Infinity, repeatDelay: 0.5 }}
                >
                    <div className="relative filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                        {/* Bike Body - REVERSED SHAPE */}
                        <Bike size={34} className="text-white fill-red-600 transform scale-x-100" strokeWidth={2} />
                        
                        {/* Engine Glow */}
                        <MotionDiv 
                           className="absolute top-1/2 left-1/2 w-5 h-5 bg-red-500/40 rounded-full blur-md"
                           animate={{ opacity: [0.5, 1, 0.5] }}
                           transition={{ duration: 0.2, repeat: Infinity }}
                        />
                        
                        {/* Exhaust Flame (Adjusted position for reversed bike) */}
                        <MotionDiv
                           className="absolute top-5 -left-3 w-6 h-1.5 bg-yellow-400 rounded-full blur-[2px]"
                           animate={{ scaleX: [1, 2.5, 1], opacity: [0.8, 1, 0.5] }}
                           transition={{ duration: 0.15, repeat: Infinity }}
                           style={{ transformOrigin: 'right center' }}
                        />
                    </div>
                </MotionDiv>
            </MotionDiv>
        </div>
        
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-xl ring-1 ring-inset ring-white/10"></div>
      </div>
    );
  }

  // --- 3D RACING ANIMATION VARIANT (SPLASH SCREEN) ---
  if (variant === '3d-race') {
    return (
      <div className="relative w-full max-w-2xl mx-auto h-40 flex items-center justify-center overflow-hidden rounded-3xl bg-slate-900 border-y-4 border-slate-800 shadow-2xl perspective-[1000px] group">
        
        {/* 1. Moving Road Floor (Infinite Scroll) */}
        <div className="absolute inset-0 flex items-end justify-center perspective-[500px]">
             {/* Asphalt */}
             <div className="absolute bottom-0 w-[120%] h-24 bg-slate-800 origin-bottom transform rotate-x-[60deg] translate-z-[-50px]"></div>
             
             {/* Moving Stripes */}
             <MotionDiv 
                className="absolute bottom-0 w-full h-24 flex justify-center gap-12 opacity-30"
                style={{ transform: "rotateX(60deg) scale(1.5)" }}
             >
                {[1,2,3,4,5,6].map(i => (
                    <MotionDiv 
                        key={i}
                        className="w-8 h-2 bg-yellow-500/50"
                        animate={{ y: [0, 200] }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    />
                ))}
             </MotionDiv>
        </div>

        {/* 2. Speed Lines / Wind Effect */}
        <MotionDiv 
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
             {[...Array(5)].map((_, i) => (
                 <MotionDiv
                    key={i}
                    className="absolute h-0.5 bg-white/20 rounded-full"
                    style={{ 
                        top: `${20 + Math.random() * 60}%`, 
                        left: '-10%',
                        width: `${Math.random() * 100 + 50}px`
                    }}
                    animate={{ x: ['0vw', '120vw'] }}
                    transition={{ 
                        duration: 0.5 + Math.random() * 0.5, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: Math.random() * 2 
                    }}
                 />
             ))}
        </MotionDiv>

        {/* 3. The Race Container */}
        <div className="relative z-10 flex items-center gap-4 transform-style-3d">
            
            {/* THE BIKE (The Racer) */}
            <MotionDiv
                className="relative"
                initial={{ x: -300, rotateY: 0 }}
                animate={{ 
                    x: [ -300, 20, 0, 50, 0], // Enter, Overtake, Fallback, Overtake, Settle
                    rotateZ: [0, 5, 0, 10, 0], // Wheelie effect
                }}
                transition={{ 
                    duration: 4,
                    ease: "circOut",
                    times: [0, 0.4, 0.6, 0.8, 1],
                    repeat: Infinity,
                    repeatDelay: 2
                }}
            >
                <div className="relative filter drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                    {/* Motion Blur Trail */}
                    <MotionDiv 
                        className="absolute top-1/2 right-full h-4 w-20 bg-gradient-to-l from-red-600 to-transparent blur-md -translate-y-1/2"
                        animate={{ opacity: [0, 1, 0.5, 1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                    />
                    
                    {/* The 3D Bike Icon */}
                    <div className="transform skew-x-[-12deg]">
                        <Bike size={64} className="text-white fill-red-600" strokeWidth={1.5} />
                    </div>
                    
                    {/* Sparks */}
                    <MotionDiv 
                        className="absolute bottom-0 right-2 w-2 h-2 bg-yellow-400 rounded-full blur-[1px]"
                        animate={{ 
                            y: [0, -10, 0], 
                            x: [0, -20, -40],
                            opacity: [1, 0] 
                        }}
                        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 0.1 }}
                    />
                </div>
            </MotionDiv>

            {/* THE LOGO TEXT (The Opponent) */}
            <MotionDiv
                 className="flex flex-col"
                 initial={{ x: 300, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ duration: 1, ease: "easeOut" }}
            >
                <MotionDiv 
                    className="text-5xl font-black italic tracking-tighter text-white flex gap-2"
                    style={{ textShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}
                >
                    <span className="text-red-600">{APP_NAME.split(' ')[1]}</span>
                    <MotionSpan
                        animate={{ color: ["#ffffff", "#ef4444", "#ffffff"] }} // Flash red when overtaken
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, times: [0, 0.4, 1] }}
                    >
                        {APP_NAME.split(' ')[0]}
                    </MotionSpan>
                </MotionDiv>
                
                {showSubtitle && (
                    <MotionDiv 
                        className="text-right text-sm font-bold tracking-[0.5em] text-slate-400 mt-1"
                        animate={{ opacity: [0, 1] }}
                        transition={{ delay: 1 }}
                    >
                        {APP_SUBTITLE}
                    </MotionDiv>
                )}
            </MotionDiv>

        </div>

        {/* Glossy Overlay for "Screen" effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-3xl"></div>
      </div>
    );
  }

  // --- STANDARD STATIC/MINIMAL LOGO ---
  return (
    <div className="flex flex-col items-center justify-center font-bold tracking-tighter select-none">
      <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
        <div className="bg-white rounded-full p-2 text-slate-900 shadow-lg shadow-red-600/20">
          <Bike size={iconSizes[size]} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
            <span className="text-white drop-shadow-md">
              {APP_NAME.split(' ')[0]} <span className="text-red-600">{APP_NAME.split(' ')[1]}</span>
            </span>
        </div>
      </div>
      {showSubtitle && (
        <span className={`text-white/80 tracking-widest mt-1 ${size === 'lg' ? 'text-xl' : 'text-xs'}`}>
          {APP_SUBTITLE}
        </span>
      )}
    </div>
  );
};

export default Logo;
