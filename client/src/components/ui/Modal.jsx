import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="df-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="df-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="df-modal-header">
          <div className="df-modal-title">{title}</div>
          <button type="button" className="df-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
