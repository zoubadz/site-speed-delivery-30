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
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const variants = {
    primary: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 focus:ring-red-500",
    secondary: "bg-white text-slate-900 hover:bg-gray-100 shadow-lg shadow-white/10 focus:ring-white",
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