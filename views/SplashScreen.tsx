import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bike, Car } from 'lucide-react';
import Logo from '../components/Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

// Fix for TS errors where motion props are not recognized
const MotionDiv = motion.div as any;
const MotionP = motion.p as any;

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden perspective-[1000px]">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-900"></div>
      </div>

      <div className="z-10 text-center mb-16 relative">
         <MotionDiv
           initial={{ opacity: 0, scale: 0.8, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative z-20"
         >
           <Logo size="lg" />
         </MotionDiv>
         {/* Glow behind logo */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* 3D Racing Animation Container */}
      <div className="relative w-full h-48 flex items-center justify-center overflow-hidden [perspective:1000px] [transform-style:preserve-3d]">
        
        {/* Road Surface with 3D perspective */}
        <div className="absolute inset-0 flex items-center justify-center [transform:rotateX(60deg)_scale(1.5)] opacity-30">
             <div className="w-[120%] h-40 bg-slate-800 border-y-2 border-slate-600 relative overflow-hidden shadow-inner">
                {/* Moving road markings */}
                <MotionDiv 
                    className="absolute top-1/2 left-0 w-[200%] h-2 bg-dashed border-t-4 border-slate-500/50 border-dashed -translate-y-1/2"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                />
             </div>
        </div>

        {/* Vehicles Container - Moving Left to Right */}
        
        {/* Motorcycle - Top Lane */}
        <MotionDiv
          className="absolute top-8 z-20"
          initial={{ left: '-20%' }}
          animate={{ left: '120%' }}
          transition={{ 
            duration: 2.2, 
            ease: "easeInOut",
            delay: 0.2
          }}
        >
          {/* 3D Vehicle Wrapper */}
          <div className="relative [transform:rotateY(10deg)] transition-transform">
             <div className="relative z-10 text-red-500 drop-shadow-[0_15px_15px_rgba(220,38,38,0.4)]">
                 <Bike size={64} strokeWidth={2} className="filter drop-shadow-lg" />
             </div>
             {/* Speed streaks */}
             <MotionDiv 
                className="absolute top-1/2 -left-16 w-32 h-2 bg-gradient-to-r from-transparent via-red-500/50 to-transparent blur-sm"
                animate={{ opacity: [0.5, 0.8, 0.5], scaleX: [0.9, 1.1, 0.9] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
             />
          </div>
        </MotionDiv>

        {/* Car - Bottom Lane */}
        <MotionDiv
          className="absolute bottom-8 z-30"
          initial={{ left: '-25%' }}
          animate={{ left: '120%' }}
          transition={{ 
            duration: 2.8, 
            ease: "easeInOut",
            delay: 0.4
          }}
        >
          <div className="relative [transform:rotateY(10deg)]">
             <div className="relative z-10 text-blue-500 drop-shadow-[0_20px_20px_rgba(59,130,246,0.4)]">
                 <Car size={80} strokeWidth={2} className="filter drop-shadow-lg" />
             </div>
             {/* Speed streaks */}
             <MotionDiv 
                className="absolute top-1/2 -left-20 w-40 h-2 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent blur-md"
                animate={{ opacity: [0.5, 0.8, 0.5], scaleX: [0.95, 1.05, 0.95] }}
                transition={{ repeat: Infinity, duration: 0.25 }}
             />
          </div>
        </MotionDiv>
      </div>

      <MotionP 
        className="mt-12 text-slate-400 font-bold text-sm tracking-[0.3em] uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        جاري تهيئة النظام...
      </MotionP>
    </div>
  );
};

export default SplashScreen;