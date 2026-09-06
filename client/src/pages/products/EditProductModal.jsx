import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import productService from '../../services/product.service';

const toFormState = (product) => ({
  name: product?.name ?? '',
  category: product?.category ?? '',
  basePrice: product?.basePrice ?? '',
  unit: product?.unit ?? '',
  taxRate: product?.taxRate ?? '',
  marginPercent: product?.marginPercent ?? '',
  description: product?.description ?? '',
});

// Edit-in-place for the catalog fields NewProductModal creates with — name,
// category, base price, unit, tax %, margin %, description. Doesn't touch
// the upsell relation (that's create-time only, same as before this fix).
export default function EditProductModal({ open, product, onClose, onUpdated }) {
  const [form, setForm] = useState(() => toFormState(product));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(product));
    setError(null);
  }, [open, product]);

  const set = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim() || form.basePrice === '') {
      setError('Name, category, unit, and base price are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await productService.update(product.id, {
        name: form.name.trim(),
        category: form.category.trim(),
        basePrice: Number(form.basePrice),
        unit: form.unit.trim(),
        taxRate: form.taxRate === '' ? 0 : Number(form.taxRate),
        marginPercent: form.marginPercent === '' ? 0 : Number(form.marginPercent),
        description: form.description.trim() || null,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update that product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${product?.name || 'Product'}`}>
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
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}
