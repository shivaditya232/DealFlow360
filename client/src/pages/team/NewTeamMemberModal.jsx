import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import EmailOtpVerifier from '../../components/auth/EmailOtpVerifier';
import authService from '../../services/auth.service';

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN'];

const EMPTY = { name: '', email: '', password: '', role: 'SALES_REP' };

// Admin directly creating a teammate — the invite-flow gap flagged in
// auth.service.js signup() (self-signup only ever grants SALES_REP; there
// was no way at all to create a MANAGER/FINANCE account). Reuses the exact
// same OTP-verification widget the public Signup form uses — this bypasses
// the self-registration FORM, not identity verification, so the email
// still has to be OTP-verified before the account can be created.
export default function NewTeamMemberModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [otpStatus, setOtpStatus] = useState('idle'); // 'idle' | 'sent' | 'verified'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setOtpStatus('idle');
    setError(null);
  }, [open]);

  const emailValid = SIMPLE_EMAIL_RE.test(form.email.trim());
  const set = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (otpStatus !== 'verified') {
      setError('Verify the email address before creating the account.');
      return;
    }
    if (!form.name.trim() || form.password.length < 8) {
      setError('Name is required and password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await authService.createTeamMember({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      onCreated(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create that account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Team Member">
      <form onSubmit={submit}>
        {error && <div className="df-error-text" style={{ marginBottom: 12 }}>{error}</div>}

        <Input label="Name" required value={form.name} onChange={set('name')} placeholder="Jane Doe" />

        <Input
          label="Email" required type="email" value={form.email} onChange={set('email')}
          placeholder="jane@company.com"
          disabled={otpStatus === 'verified'}
        />
        <EmailOtpVerifier
          email={form.email.trim()}
          emailValid={emailValid}
          status={otpStatus}
          onStatusChange={setOtpStatus}
          disabled={submitting}
        />

        <PasswordInput
          label="Temporary Password" required value={form.password} onChange={set('password')}
          placeholder="At least 8 characters"
        />

        <Select label="Role" required value={form.role} onChange={set('role')}>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </Select>

        <Button type="submit" variant="primary" fullWidth loading={submitting} className="df-mt-8">
          Create Account
        </Button>
      </form>
    </Modal>
  );
}
