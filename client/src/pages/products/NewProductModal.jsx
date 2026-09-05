import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import productService from '../../services/product.service';

const EMPTY = {
  name: '',
  category: '',
  basePrice: '',
  unit: '',
  taxRate: '',
  marginPercent: '',
  description: '',
};

// Screen 16/17 basics only (name, category, base price, unit, tax %, margin
// %, description) — variants and per-tier price lists are a separate,
// larger screen not built yet (a product can still be priced/discounted
// without them; priceLine() in quotation.service.js already falls back to
// basePrice when no PriceListEntry exists for a tier).
export default function NewProductModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError(null);
  }, [open]);

  const set = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim() || form.basePrice === '') {
      setError('Name, category, unit, and base price are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const product = await productService.create({
        name: form.name.trim(),
        category: form.category.trim(),
        basePrice: Number(form.basePrice),
        unit: form.unit.trim(),
        taxRate: form.taxRate === '' ? 0 : Number(form.taxRate),
        marginPercent: form.marginPercent === '' ? 0 : Number(form.marginPercent),
        description: form.description.trim() || null,
      });
      onCreated(product);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create that product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Product">
      <form onSubmit={submit}>
        {error && <div className="df-error-text" style={{ marginBottom: 12 }}>{error}</div>}

        <Input label="Name" required value={form.name} onChange={set('name')} placeholder="e.g. Laptop Pro 14" />
        <Input label="Category" required value={form.category} onChange={set('category')} placeholder="e.g. Hardware" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Base Price" required type="number" min="0" step="0.01" value={form.basePrice} onChange={set('basePrice')} placeholder="1200.00" />
          <Input label="Unit" required value={form.unit} onChange={set('unit')} placeholder="Each" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Tax %" type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={set('taxRate')} placeholder="15" />
          <Input label="Margin %" type="number" min="0" max="100" step="0.1" value={form.marginPercent} onChange={set('marginPercent')} placeholder="20" />
        </div>

        <Input label="Description" value={form.description} onChange={set('description')} placeholder="Optional" />

        <Button type="submit" variant="primary" fullWidth loading={submitting} className="df-mt-8">
          Create Product
        </Button>
      </form>
    </Modal>
  );
}
