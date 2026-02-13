import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, HardHat, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';

interface RoleSelectionProps {
  onSelect: (view: ViewState) => void;
  onBack: () => void;
}

// Fix for TS errors where motion props are not recognized
const MotionDiv = motion.div as any;

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect, onBack }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={onBack}
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors flex items-center gap-2"
      >
        <ArrowRight size={20} />
        <span>العودة</span>
      </button>

      <MotionDiv 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold mb-3 text-white">تسجيل الدخول</h2>
        <p className="text-slate-400">يرجى اختيار نوع الحساب للمتابعة</p>
      </MotionDiv>

      <MotionDiv 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Admin Card */}
        <MotionDiv 
          variants={itemVariants}
          onClick={() => onSelect('login-admin')}
          className="group cursor-pointer bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-500/50 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/20 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-slate-700 group-hover:bg-red-600 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">حساب الإدارة</h3>
          <p className="text-slate-400 text-sm mb-6">الدخول للمشرفين وأصحاب الصلاحيات لإدارة النظام والطلبات.</p>
          <span className="text-red-500 font-bold group-hover:text-white transition-colors flex items-center gap-2">
            دخول المشرفين <ArrowRight size={16} className="transform rotate-180 group-hover:translate-x-1 transition-transform" />
          </span>
        </MotionDiv>

        {/* Worker Card */}
        <MotionDiv 
          variants={itemVariants}
          onClick={() => onSelect('login-worker')}
          className="group cursor-pointer bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-slate-700 group-hover:bg-blue-600 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
            <HardHat size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">حساب العمال</h3>
          <p className="text-slate-400 text-sm mb-6">الدخول لسائقي التوصيل والموظفين لمتابعة المهام اليومية.</p>
          <span className="text-blue-500 font-bold group-hover:text-white transition-colors flex items-center gap-2">
            دخول العمال <ArrowRight size={16} className="transform rotate-180 group-hover:translate-x-1 transition-transform" />
          </span>
        </MotionDiv>
      </MotionDiv>
    </div>
  );
};

export default RoleSelection;