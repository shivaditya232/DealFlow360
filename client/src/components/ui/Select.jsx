import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Enterprise Form Select Component
 *
 * Native <select> under the hood (keeps full keyboard/a11y/mobile behavior),
 * dressed up to match Input: same label/error/helperText layout, same
 * height and border, a custom chevron instead of the browser default, and
 * (via .df-select in index.css) a dark-mode-aware native options popup
 * instead of the old white-box-in-a-dark-app look.
 */
export default function Select({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  children,
  className = '',
  ...props
}) {
  const selectId = id || (name ? `df-select-${name}` : undefined);
  const errorId = error && selectId ? `${selectId}-error` : undefined;
  const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  const selectClasses = ['df-input', 'df-select', error ? 'df-input-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="df-form-group">
      {label && (
        <label htmlFor={selectId} className="df-label">
          <span>
            {label}
            {required && <span className="df-label-required" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="df-select-wrapper">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={selectClasses}
          {...props}
        >
          {placeholder != null && <option value="">{placeholder}</option>}
          {children}
        </select>

        <span className="df-select-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
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
