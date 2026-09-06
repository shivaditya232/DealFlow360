import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import warehouseService from '../../services/warehouse.service';

const toFormState = (warehouse) => ({
  name: warehouse?.name ?? '',
  shippingCostWeight: warehouse?.shippingCostWeight ?? '',
});

// Shared create/edit modal for warehouses — Admin previously had no way at
// all to add, rename, or remove a warehouse; the Warehouses & Inventory tab
// could only view existing ones (seed-only) and add stock to them.
export default function WarehouseModal({ open, warehouse, onClose, onSaved }) {
  const isEdit = !!warehouse;
  const [form, setForm] = useState(() => toFormState(warehouse));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(warehouse));
    setError(null);
  }, [open, warehouse]);

  const set = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.shippingCostWeight === '') {
      setError('Name and shipping cost weight are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        shippingCostWeight: Number(form.shippingCostWeight),
      };
      const saved = isEdit
        ? await warehouseService.update(warehouse.id, payload)
        : await warehouseService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.error || `Could not ${isEdit ? 'update' : 'create'} that warehouse.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${warehouse?.name || 'Warehouse'}` : 'New Warehouse'}>
      <form onSubmit={submit}>
        {error && <div className="df-error-text" style={{ marginBottom: 12 }}>{error}</div>}

        <Input label="Name" required value={form.name} onChange={set('name')} placeholder="e.g. West Coast DC" />
        <Input
          label="Shipping Cost Weight"
          required
          type="number"
          min="0"
          step="0.01"
          value={form.shippingCostWeight}
          onChange={set('shippingCostWeight')}
          placeholder="1.0"
          helperText="Relative weighting used when splitting fulfillment across warehouses."
        />

        <Button type="submit" variant="primary" fullWidth loading={submitting} className="df-mt-8">
          {isEdit ? 'Save Changes' : 'Create Warehouse'}
        </Button>
      </form>
    </Modal>
  );
}
