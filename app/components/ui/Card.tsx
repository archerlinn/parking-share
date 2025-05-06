import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  const baseStyles = 'bg-white rounded-lg shadow-sm border border-gray-200';
  
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };
  
  const hoverStyles = hover ? 'transition-transform duration-300 hover:shadow-md hover:-translate-y-1' : '';
  
  return (
    <div className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card; 