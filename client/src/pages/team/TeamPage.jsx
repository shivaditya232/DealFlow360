import React, { useEffect, useState } from 'react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import NewTeamMemberModal from './NewTeamMemberModal';
import EditTeamMemberModal from './EditTeamMemberModal';
import authService from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

const ROLE_VARIANT = {
  ADMIN: 'primary',
  MANAGER: 'violet',
  FINANCE: 'warning',
  SALES_REP: 'neutral',
};

// Admin-only screen — was previously entirely missing (self-signup only
// ever grants SALES_REP; there was no page or endpoint for an Admin to
// create a MANAGER or FINANCE account, only hand-editing the database).
// Edit/Remove were the actual bug fixed here: this screen only ever let you
// create a teammate, never fix their role or take them off the team.
export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    authService.listTeamMembers().then(setMembers).catch(() => setError('Could not load team members.'));
  };

  useEffect(load, []);

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove "${member.name}" from the team? This can't be undone.`)) return;
    setRemovingId(member.id);
    setError(null);
    try {
      await authService.removeTeamMember(member.id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove that team member.');
    } finally {
      setRemovingId(null);
    }
  };

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
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const isSelf = m.id === user?.id;
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>
                          {m.name}
                          {isSelf && <span className="df-text-muted" style={{ fontWeight: 400 }}> (you)</span>}
                        </td>
                        <td className="df-text-muted">{m.email}</td>
                        <td><Badge variant={ROLE_VARIANT[m.role] || 'neutral'}>{m.role.replace('_', ' ')}</Badge></td>
                        <td>
                          <div className="df-row-actions">
                            <button
                              type="button"
                              className="df-icon-btn"
                              aria-label={`Edit ${m.name}`}
                              title="Edit"
                              onClick={() => setEditingMember(m)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="df-icon-btn df-icon-btn-danger"
                              aria-label={`Remove ${m.name}`}
                              title={isSelf ? "You can't remove your own account" : 'Remove'}
                              disabled={isSelf || removingId === m.id}
                              onClick={() => handleRemove(m)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      <EditTeamMemberModal
        open={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onUpdated={() => { setEditingMember(null); load(); }}
      />
    </>
  );
}
