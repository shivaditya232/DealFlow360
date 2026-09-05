import React, { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import NewTeamMemberModal from './NewTeamMemberModal';
import authService from '../../services/auth.service';

const ROLE_VARIANT = {
  ADMIN: 'primary',
  MANAGER: 'violet',
  FINANCE: 'warning',
  SALES_REP: 'neutral',
};

// Admin-only screen — was previously entirely missing (self-signup only
// ever grants SALES_REP; there was no page or endpoint for an Admin to
// create a MANAGER or FINANCE account, only hand-editing the database).
export default function TeamPage() {
  const [members, setMembers] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    authService.listTeamMembers().then(setMembers).catch(() => setError('Could not load team members.'));
  };

  useEffect(load, []);

  return (
    <>
      <TopBar
        title="Team"
        subtitle={!members ? 'Loading…' : `${members.length} internal ${members.length === 1 ? 'user' : 'users'}`}
        actions={
          <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> New Team Member
          </button>
        }
      />

      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        {!members ? (
          <Card><Skeleton height={220} /></Card>
        ) : members.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users size={24} />}
              title="No team members yet"
              description="Create Manager, Finance, and Sales Rep accounts for your company."
              action={
                <button type="button" className="df-btn df-btn-primary df-btn-sm df-mt-16" onClick={() => setModalOpen(true)}>
                  <Plus size={15} /> New Team Member
                </button>
              }
            />
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <div className="df-table-wrap">
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td className="df-text-muted">{m.email}</td>
                      <td><Badge variant={ROLE_VARIANT[m.role] || 'neutral'}>{m.role.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <NewTeamMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); load(); }}
      />
    </>
  );
}
