import React from 'react';

/**
 * Enterprise Checkbox Component
 */
export default function Checkbox({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) {
  const checkboxId = id || (name ? `df-checkbox-${name}` : undefined);

  return (
    <label htmlFor={checkboxId} className={`df-checkbox-label ${className}`}>
      <input
        id={checkboxId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="df-checkbox"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
