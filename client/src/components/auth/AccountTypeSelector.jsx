import React from 'react';
import {
  Briefcase,
  Globe,
  Check,
  AlertCircle
} from 'lucide-react';

/**
 * Enterprise Role & Account Type Selector
 *
 * Public self-registration only ever produces two outcomes:
 * - Sales Rep (accountType: INTERNAL, role: SALES_REP) — joins an existing
 *   company workspace, or creates a brand-new one if the Company field is a
 *   slug nobody's used yet (the creator becomes that company's Admin
 *   automatically — the backend decides this, not a role picked here).
 * - Customer (accountType: CUSTOMER, role: null) — external portal access.
 *
 * Sales Manager / Finance Manager / Admin are NOT self-service roles. They
 * used to be selectable right here, which meant anyone who knew (or guessed)
 * a company's slug could register themselves as that company's Admin with
 * zero authorization — see auth.service.js for the fix. Promoting a Sales
 * Rep to Manager/Finance/Admin needs an invite flow from inside the company,
 * which doesn't exist yet.
 */

export const ROLES_CONFIG = [
  {
    key: 'SALES_REP',
    accountType: 'INTERNAL',
    role: 'SALES_REP',
    label: 'Sales Rep',
    badge: 'Internal',
    description: 'Join your company workspace — or create it, if this is a brand-new company',
    icon: Briefcase,
  },
  {
    key: 'CUSTOMER',
    accountType: 'CUSTOMER',
    role: null,
    label: 'Customer',
    badge: 'Customer Portal',
    description: 'External portal for quotes, negotiations & orders',
    icon: Globe,
  },
];

export default function AccountTypeSelector({
  value = null, // key of selected role: 'SALES_REP' | 'CUSTOMER'
  onChange,
  onBlur,
  error = '',
  disabled = false,
}) {
  const internalRoles = ROLES_CONFIG.filter((r) => r.accountType === 'INTERNAL');
  const customerRole = ROLES_CONFIG.find((r) => r.accountType === 'CUSTOMER');

  const handleSelect = (roleConfig) => {
    if (disabled) return;
    if (onChange) {
      onChange({
        key: roleConfig.key,
        accountType: roleConfig.accountType,
        role: roleConfig.role,
        label: roleConfig.label,
      });
    }
  };

  return (
    <div className="df-form-group df-role-selector-group">
      <div className="df-label-row">
        <label className="df-label" id="role-selector-label">
          <span>
            Account type & role
            <span className="df-label-required" aria-hidden="true">*</span>
          </span>
        </label>
        <span className="df-role-caption-hint">Choose your access level</span>
      </div>

      <div 
        className="df-role-selector-container"
        role="radiogroup" 
        aria-labelledby="role-selector-label"
        onBlur={onBlur}
      >
        {/* Internal Team Roles Section */}
        <div className="df-role-section">
          <div className="df-role-section-header">
            <span className="df-role-section-title">Internal Team Workspace</span>
            <span className="df-role-section-pill">Sales Rep</span>
          </div>

          <div className="df-role-grid">
            {internalRoles.map((roleItem) => {
              const Icon = roleItem.icon;
              const isSelected = value === roleItem.key;

              return (
                <button
                  key={roleItem.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={disabled}
                  onClick={() => handleSelect(roleItem)}
                  className={`df-role-card ${isSelected ? 'df-role-card-selected' : ''}`}
                >
                  <div className="df-role-card-header">
                    <div className="df-role-icon-box" aria-hidden="true">
                      <Icon size={16} />
                    </div>
                    <div className="df-role-radio-indicator">
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="df-role-card-body">
                    <span className="df-role-card-title">{roleItem.label}</span>
                    <span className="df-role-card-desc">{roleItem.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Portal Section */}
        {customerRole && (
          <div className="df-role-section df-role-section-customer">
            <div className="df-role-section-header">
              <span className="df-role-section-title">Customer / Client Portal</span>
              <span className="df-role-section-pill df-pill-customer">External Access</span>
            </div>

            {(() => {
              const Icon = customerRole.icon;
              const isSelected = value === customerRole.key;

              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={disabled}
                  onClick={() => handleSelect(customerRole)}
                  className={`df-role-card df-role-card-portal ${isSelected ? 'df-role-card-selected' : ''}`}
                >
                  <div className="df-role-portal-content">
                    <div className="df-role-icon-box df-icon-portal" aria-hidden="true">
                      <Icon size={18} />
                    </div>
                    <div className="df-role-portal-text">
                      <div className="df-role-portal-title-row">
                        <span className="df-role-card-title">{customerRole.label}</span>
                        <span className="df-portal-tag">Customer Portal</span>
                      </div>
                      <span className="df-role-card-desc">{customerRole.description}</span>
                    </div>
                  </div>

                  <div className="df-role-radio-indicator">
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              );
            })()}
          </div>
        )}
      </div>

      {/* Reserved feedback slot to prevent layout shifting */}
      <div className="df-input-feedback-slot">
        {error && (
          <div className="df-error-text" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
