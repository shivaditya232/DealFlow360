import React, { useEffect, useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import customerService from '../../services/customer.service';
import quotationService from '../../services/quotation.service';

const TIERS = ['BRONZE', 'SILVER', 'GOLD'];

export default function NewQuotationModal({ open, onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('pick'); // 'pick' | 'create'
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', tier: 'BRONZE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMode('pick');
    setSearch('');
    customerService.list().then(setCustomers).catch(() => setError('Could not load customers.'));
  }, [open]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const pickCustomer = async (customerId) => {
    setSubmitting(true);
    setError(null);
    try {
      const q = await quotationService.create(customerId);
      onCreated(q.id);
    } catch {
      setError('Could not create quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const createAndPick = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      setError('Name and email are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const customer = await customerService.create(newCustomer);
      await pickCustomer(customer.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create customer.');
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Quotation">
      {error && <div className="df-error-text df-mt-8" style={{ marginBottom: 12 }}>{error}</div>}

      {mode === 'pick' ? (
        <>
          <Input
            placeholder="Search customers…"
            startIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={submitting}
                onClick={() => pickCustomer(c.id)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                <div className="df-text-sm df-text-muted">
                  {c.email} · {c.tier}
                  {c.company?.name && <> · <span title="Originally created under this company">{c.company.name}</span></>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="df-text-sm df-text-muted" style={{ padding: '8px 2px' }}>No matching customers.</div>
            )}
          </div>
          <Button
            variant="outline"
            fullWidth
            className="df-mt-16"
            icon={<UserPlus size={15} />}
            onClick={() => setMode('create')}
          >
            New customer
          </Button>
        </>
      ) : (
        <>
          <Input
            label="Name" required value={newCustomer.name}
            onChange={(e) => setNewCustomer((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            label="Email" required type="email" value={newCustomer.email}
            onChange={(e) => setNewCustomer((s) => ({ ...s, email: e.target.value }))}
          />
          <Select
            label="Tier"
            value={newCustomer.tier}
            onChange={(e) => setNewCustomer((s) => ({ ...s, tier: e.target.value }))}
          >
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div className="df-row-gap-8 df-mt-16">
            <Button variant="ghost" onClick={() => setMode('pick')}>Back</Button>
            <Button variant="primary" fullWidth loading={submitting} onClick={createAndPick}>
              Create &amp; start quotation
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
