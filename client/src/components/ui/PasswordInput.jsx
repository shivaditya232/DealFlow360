import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from './Input';

/**
 * Enterprise Password Input with Accessible Visibility Toggle
 */
export default function PasswordInput({
  id = 'password',
  name = 'password',
  label = 'Password',
  value,
  onChange,
  onBlur,
  placeholder = '••••••••••••',
  error,
  helperText,
  required = false,
  disabled = false,
  autoComplete = 'current-password',
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const endAction = (
    <button
      type="button"
      onClick={toggleVisibility}
      className="df-input-action-btn"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
      tabIndex={0}
      title={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? (
        <EyeOff size={18} aria-hidden="true" />
      ) : (
        <Eye size={18} aria-hidden="true" />
      )}
    </button>
  );

  return (
    <Input
      id={id}
      name={name}
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      endAction={endAction}
      className={className}
      {...props}
    />
  );
}
