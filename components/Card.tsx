import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div 
      className={`
        bg-white rounded-2xl border border-slate-100 shadow-sm p-6 
        ${hoverable ? 'hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer' : ''} 
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;