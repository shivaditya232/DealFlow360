import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Enterprise Form Input Component
 * 
 * Accessible, robust text/email/number input with inline labels, error messages, and icon support.
 */
export default function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  autoComplete,
  startIcon = null,
  endAction = null,
  className = '',
  ...props
}) {
  const inputId = id || (name ? `df-input-${name}` : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  const inputClasses = [
    'df-input',
    error ? 'df-input-error' : '',
    startIcon ? 'df-input-has-start-icon' : '',
    endAction ? 'df-input-has-end-action' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="df-form-group">
      {label && (
        <label htmlFor={inputId} className="df-label">
          <span>
            {label}
            {required && <span className="df-label-required" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="df-input-wrapper">
        {startIcon && (
          <span className="df-input-start-icon" aria-hidden="true">
            {startIcon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={inputClasses}
          {...props}
        />

        {endAction && (
          <div className="df-input-end-action">
            {endAction}
          </div>
        )}
      </div>

      <div className="df-input-feedback-slot">
        {error ? (
          <div id={errorId} className="df-error-text" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <div id={helperId} className="df-helper-text">
            {helperText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
