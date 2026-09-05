import React from 'react';

export default function Card({ glass = true, className = '', children, ...props }) {
  const base = glass ? 'df-card' : 'df-card-solid';
  return (
    <div className={[base, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
