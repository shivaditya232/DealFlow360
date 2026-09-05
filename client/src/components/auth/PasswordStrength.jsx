import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Enterprise Password Strength Indicator
 * 
 * Provides real-time visual score & checklist:
 * - 8+ characters
 * - Uppercase & lowercase
 * - Numbers or symbols
 */

export function calculatePasswordStrength(password = '') {
  if (!password) {
    return {
      score: 0,
      label: '',
      colorClass: '',
      requirements: {
        length: false,
        letters: false,
        numbersOrSymbols: false,
      },
    };
  }

  const length = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const letters = hasLower && hasUpper;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const numbersOrSymbols = hasNumber || hasSymbol;

  let score = 0;
  if (password.length > 0) score = 1; // Base entry
  if (length) score += 1;
  if (letters) score += 1;
  if (numbersOrSymbols && (hasNumber && hasSymbol || password.length >= 10)) {
    score += 1;
  }

  // Bound score between 1 and 4 when typing
  score = Math.min(Math.max(score, 1), 4);

  const STRENGTH_MAP = {
    1: { label: 'Weak', colorClass: 'df-strength-weak' },
    2: { label: 'Fair', colorClass: 'df-strength-fair' },
    3: { label: 'Good', colorClass: 'df-strength-good' },
    4: { label: 'Strong', colorClass: 'df-strength-strong' },
  };

  return {
    score,
    label: STRENGTH_MAP[score].label,
    colorClass: STRENGTH_MAP[score].colorClass,
    requirements: {
      length,
      letters,
      numbersOrSymbols,
    },
  };
}

export default function PasswordStrength({ password = '' }) {
  if (!password) return null;

  const { score, label, colorClass, requirements } = calculatePasswordStrength(password);

  return (
    <div className="df-password-strength-container" aria-live="polite">
      <div className="df-strength-header">
        <span className="df-strength-caption">Password strength</span>
        <span className={`df-strength-badge ${colorClass}`}>{label}</span>
      </div>

      {/* 4-segment visual meter */}
      <div className="df-strength-meter" role="progressbar" aria-valuenow={score} aria-valuemin="0" aria-valuemax="4">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`df-strength-bar ${step <= score ? colorClass : 'df-strength-empty'}`}
          />
        ))}
      </div>

      {/* Requirement micro-checklist */}
      <div className="df-strength-checklist">
        <div className={`df-check-item ${requirements.length ? 'df-check-met' : ''}`}>
          {requirements.length ? (
            <Check size={12} className="df-check-icon df-check-pass" aria-hidden="true" />
          ) : (
            <span className="df-check-dot" aria-hidden="true" />
          )}
          <span>At least 8 characters</span>
        </div>

        <div className={`df-check-item ${requirements.letters ? 'df-check-met' : ''}`}>
          {requirements.letters ? (
            <Check size={12} className="df-check-icon df-check-pass" aria-hidden="true" />
          ) : (
            <span className="df-check-dot" aria-hidden="true" />
          )}
          <span>Upper & lowercase letters</span>
        </div>

        <div className={`df-check-item ${requirements.numbersOrSymbols ? 'df-check-met' : ''}`}>
          {requirements.numbersOrSymbols ? (
            <Check size={12} className="df-check-icon df-check-pass" aria-hidden="true" />
          ) : (
            <span className="df-check-dot" aria-hidden="true" />
          )}
          <span>Number or symbol</span>
        </div>
      </div>
    </div>
  );
}
