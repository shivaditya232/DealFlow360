import React from 'react';
import { User, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PortalSectionHeader from './PortalSectionHeader';

/**
 * PortalProfile
 * 
 * Customer profile view.
 * 
 * Currently shows data available from the authenticated session only:
 *   - customer.name  (from AuthContext / login response)
 *   - customer.email (from AuthContext / login response)
 * 
 * Extended profile data (tier, reliabilityScore, lastScoreChange) comes from:
 *   GET /api/portal/profile
 * 
 * That endpoint EXISTS in portal.controller.js / portal.service.js
 * but is NOT mounted in server/src/index.js yet.
 * 
 * When mounted, fetch here and display those fields.
 * Do NOT invent or hardcode them now.
 */
export default function PortalProfile() {
  const { customer } = useAuth();

  // ── API integration point ──────────────────────────────────────────────────
  // When GET /api/portal/profile is mounted:
  //
  //   const [profile, setProfile] = useState(null);
  //   const [loading, setLoading] = useState(true);
  //
  //   useEffect(() => {
  //     api.get('/portal/profile')
  //       .then(r => setProfile(r.data))
  //       .finally(() => setLoading(false));
  //   }, []);
  //
  // Profile shape:
  //   { name, email, tier, reliabilityScore, lastScoreChange: { delta, reason, createdAt } | null }
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
      <PortalSectionHeader
        title="Your Profile"
        subtitle="Account information and contact details."
      />

      {/* Profile card */}
      <div style={{
        backgroundColor: '#0d1324',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Avatar header */}
        <div style={{
          padding: '1.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#fff',
            flexShrink: 0,
            letterSpacing: '0.03em',
          }}>
            {customer?.name
              ? customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              : '?'}
          </div>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              {customer?.name || '—'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
              Customer Account
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ProfileField
            icon={User}
            label="Full Name"
            value={customer?.name}
          />
          <ProfileField
            icon={Mail}
            label="Email Address"
            value={customer?.email}
          />
        </div>
      </div>

      {/* Extended profile notice */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.875rem 1rem',
        backgroundColor: 'rgba(59,130,246,0.07)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '9px',
      }}>
        <AlertCircle size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#60a5fa', marginBottom: '0.2rem' }}>
            Extended profile coming soon
          </p>
          <p style={{ fontSize: '0.75rem', color: '#334155', lineHeight: '1.6' }}>
            Account tier, reliability score, and score history will appear here once{' '}
            <code style={{ fontFamily: 'monospace', fontSize: '0.7375rem', backgroundColor: 'rgba(255,255,255,0.07)', padding: '1px 4px', borderRadius: '4px' }}>
              GET /api/portal/profile
            </code>{' '}
            is mounted in the server.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.875rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        flexShrink: 0,
      }}>
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.25rem', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.875rem', color: value ? '#f1f5f9' : '#334155', fontWeight: '500' }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}
