import React, { useEffect, useState } from 'react';
import { User, Mail, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import portalService from '../../services/portal.service';
import PortalSectionHeader from './PortalSectionHeader';

/**
 * PortalProfile
 *
 * Customer profile view.
 *
 * Backend: GET /api/portal/profile (portal.routes.js — mounted).
 * Profile shape:
 *   { name, email, tier, reliabilityScore, lastScoreChange: { delta, reason, createdAt } | null }
 *
 * Falls back to the session's own customer.name/email (from login) while the
 * request is in flight or if it fails, so the page never looks broken.
 */
export default function PortalProfile() {
  const { customer } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    portalService.getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load extended profile details.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const displayName = profile?.name || customer?.name;
  const displayEmail = profile?.email || customer?.email;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
      <PortalSectionHeader
        title="Your Profile"
        subtitle="Account information and contact details."
      />

      {/* Profile card */}
      <div style={{
        backgroundColor: 'var(--portal-surface)',
        border: '1px solid var(--portal-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Avatar header */}
        <div style={{
          padding: '1.75rem',
          borderBottom: '1px solid var(--portal-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: '700',
            color: 'var(--text-inverse)',
            flexShrink: 0,
            letterSpacing: '0.03em',
          }}>
            {displayName
              ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              : '?'}
          </div>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: '700', color: 'var(--portal-text-1)', letterSpacing: '-0.01em' }}>
              {displayName || '—'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--portal-text-3)', marginTop: '0.2rem' }}>
              {profile?.tier ? `${tierLabel(profile.tier)} Customer` : 'Customer Account'}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ProfileField
            icon={User}
            label="Full Name"
            value={displayName}
          />
          <ProfileField
            icon={Mail}
            label="Email Address"
            value={displayEmail}
          />
          {!loading && profile?.reliabilityScore != null && (
            <ProfileField
              icon={Award}
              label="Reliability Score"
              value={String(profile.reliabilityScore)}
            />
          )}
        </div>
      </div>

      {/* Reliability score history */}
      {!loading && profile?.lastScoreChange && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '10px',
        }}>
          {profile.lastScoreChange.delta >= 0
            ? <TrendingUp size={16} color="var(--color-success-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
            : <TrendingDown size={16} color="var(--color-danger-500)" style={{ flexShrink: 0, marginTop: '2px' }} />}
          <div>
            <p style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--portal-text-1b)' }}>
              {profile.lastScoreChange.delta >= 0 ? '+' : ''}{profile.lastScoreChange.delta} points — {profile.lastScoreChange.reason}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--portal-text-4)', marginTop: '0.2rem' }}>
              {new Date(profile.lastScoreChange.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem',
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-danger-500)', lineHeight: '1.5' }}>{error}</p>
        </div>
      )}
    </div>
  );
}

function tierLabel(tier) {
  if (!tier) return null;
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.875rem 0',
      borderBottom: '1px solid var(--portal-border)',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: 'var(--portal-chip-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--portal-text-4)',
        flexShrink: 0,
      }}>
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-4)', marginBottom: '0.25rem', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.875rem', color: value ? 'var(--portal-text-1)' : 'var(--portal-text-5)', fontWeight: '500' }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}
