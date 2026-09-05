import React from 'react';

export default function Badge({ variant = 'neutral', dot = false, children }) {
  return (
    <span className={`df-badge df-badge-${variant}`}>
      {dot && <span className="df-badge-dot" />}
      {children}
    </span>
  );
}
