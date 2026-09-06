import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import authService from '../../services/auth.service';

const ROLES = ['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN'];

// Edit a teammate's name/role in place — Admin previously had no way to fix
// a typo'd name or change someone's role without hand-editing the DB.
// Email/password aren't editable here (no reset-password flow yet).
export default function EditTeamMemberModal({ open, member, onClose, onUpdated }) {
  const [form, setForm] = useState({ name: '', role: 'SALES_REP' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({ name: member?.name ?? '', role: member?.role ?? 'SALES_REP' });
    setError(null);
  }, [open, member]);

  const set = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!member) return;
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await authService.updateTeamMember(member.id, {
        name: form.name.trim(),
        role: form.role,
      });
      onUpdated(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update that team member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${member?.name || 'Team Member'}`}>
      <form onSubmit={submit}>
        {error && <div className="df-error-text" style={{ marginBottom: 12 }}>{error}</div>}

        <Input label="Name" required value={form.name} onChange={set('name')} placeholder="Jane Doe" />

        <Input label="Email" value={member?.email || ''} disabled helperText="Email can't be changed here." />

        <Select label="Role" required value={form.role} onChange={set('role')}>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </Select>

        <Button type="submit" variant="primary" fullWidth loading={submitting} className="df-mt-8">
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}
