import React from 'react';

interface WaveDividerProps {
  topColor: string;
  bottomColor: string;
  direction?: 'normal' | 'reverse';
  height?: string;
  className?: string;
}

const WaveDivider: React.FC<WaveDividerProps> = ({
  topColor,
  bottomColor,
  direction = 'normal',
  height = '60px',
  className = '',
}) => {
  // Create inline style for fill color instead of using Tailwind classes
  // This is more reliable for dynamic color values
  const fillStyle = {
    fill: direction === 'normal' ? `var(--color-${bottomColor})` : `var(--color-${topColor})`,
  };

  return (
    <div className={`absolute ${direction === 'normal' ? 'bottom-0' : 'top-0'} left-0 right-0 overflow-hidden z-10 ${className}`}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={`w-full h-[${height}] ${direction === 'reverse' ? 'rotate-180' : ''}`}
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          className={`fill-${direction === 'normal' ? bottomColor : topColor}`}
        ></path>
      </svg>
    </div>
  );
};

export default WaveDivider;
