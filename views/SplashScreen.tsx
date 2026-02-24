
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

// Fix for TS errors where motion props are not recognized
const MotionDiv = motion.div as any;
const MotionP = motion.p as any;
const MotionSpan = motion.span as any;

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Increased timeout to allow viewing the full race loop
    const timer = setTimeout(() => {
      onComplete();
    }, 5500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-900/80 to-slate-900"></div>
      </div>

      {/* Grid Floor */}
      <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(to_top,rgba(15,23,42,1),transparent)] z-0" />
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      {/* Main Content: The 3D Race Logo */}
      <div className="z-20 w-full px-4 transform scale-90 md:scale-100">
         <MotionDiv
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, type: "spring" }}
           className="relative"
         >
             {/* The new 3D Race Variant */}
             <Logo variant="3d-race" size="xl" />
         </MotionDiv>

         {/* Loading Text */}
         <div className="mt-12 text-center">
            <MotionP 
                className="text-slate-400 font-bold text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <MotionSpan 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-t-red-500 border-r-transparent border-b-white border-l-transparent rounded-full"
                />
                جاري تحميل النظام...
            </MotionP>
         </div>
      </div>

      {/* Bottom Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
        <MotionDiv 
          className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
