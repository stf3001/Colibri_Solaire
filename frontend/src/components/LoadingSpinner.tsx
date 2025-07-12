import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Composant de loading optimisé pour mobile
 * Utilise des animations CSS performantes
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-full border-2 border-orange-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;