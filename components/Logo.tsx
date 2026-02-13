import React from 'react';
import { Bike } from 'lucide-react';
import { APP_NAME, APP_SUBTITLE } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

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