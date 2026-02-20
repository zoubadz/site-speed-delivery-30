
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  icon,
  className = '',
  ...props 
}) => {
  // Enhanced base styles for 3D feel and better interaction
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50";
  
  const variants = {
    primary: "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.6)] border-b-4 border-red-800 active:border-b-0 active:translate-y-1 focus:ring-red-500",
    
    // Improved Secondary for Light Mode Clarity
    secondary: "bg-white text-slate-800 border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:shadow-[0_6px_15px_rgba(0,0,0,0.1)] hover:text-slate-900 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 focus:ring-slate-300",
    
    outline: "border-2 border-white/20 text-white hover:bg-white/10 focus:ring-white/50",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
