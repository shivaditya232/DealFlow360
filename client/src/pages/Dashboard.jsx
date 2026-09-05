import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { ShieldCheck, LogOut, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const { user, role, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070a13',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: '540px',
        width: '100%',
        backgroundColor: '#0d1324',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          color: '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <Briefcase size={28} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          DealFlow360 Dashboard
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
          Internal Revenue & Operations Workspace
        </p>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '1.25rem',
          textAlign: 'left',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Account:</span>
            <span style={{ fontWeight: '600' }}>{user?.name || 'Internal User'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Work Email:</span>
            <span style={{ color: '#cbd5e1' }}>{user?.email || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Assigned Role:</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '0.75rem',
            }}>
              <ShieldCheck size={13} />
              {role || 'N/A'}
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </div>
  );
}
