import React from 'react';

/**
 * Enterprise Button Component
 * 
 * Supports primary, secondary, outline, ghost variants with clean loading and focus states.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingText,
  disabled = false,
  icon = null,
  iconPosition = 'start',
  className = '',
  ...props
}) {
  const baseClass = 'df-btn';
  const variantClass = `df-btn-${variant}`;
  const sizeClass = `df-btn-${size}`;
  const fullWidthClass = fullWidth ? 'df-btn-full' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <>
          <span className="df-btn-spinner" aria-hidden="true" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'start' && (
            <span className="df-btn-icon df-btn-icon-start" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'end' && (
            <span className="df-btn-icon df-btn-icon-end" aria-hidden="true">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
