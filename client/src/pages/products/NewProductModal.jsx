import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
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
  baseProductId: '',
  upsellMinMargin: '',
  upsellPromoted: false,
};

// Screen 16/17 basics only (name, category, base price, unit, tax %, margin
// %, description) — variants and per-tier price lists are a separate,
// larger screen not built yet (a product can still be priced/discounted
// without them; priceLine() in quotation.service.js already falls back to
// basePrice when no PriceListEntry exists for a tier).
//
// `existingProducts` (from ProductsList) powers the optional "recommend for"
// picker below: choosing a base product here creates an UpsellRule so reps
// get this new product suggested (getUpsellSuggestions in
// quotation.service.js) whenever a quotation already has the base product on
// it — same mechanism the seed data already uses, just now reachable from
// product creation instead of only from a seed script.
export default function NewProductModal({ open, onClose, onCreated, existingProducts = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError(null);
  }, [open]);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [field]: value }));
  };

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
        upsell: form.baseProductId
          ? {
              baseProductId: form.baseProductId,
              minMarginPercent: form.upsellMinMargin === '' ? 0 : Number(form.upsellMinMargin),
              isPromoted: form.upsellPromoted,
            }
          : undefined,
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

        <Select
          label="Recommend for (base product)"
          placeholder="Not an upsell for anything — skip"
          value={form.baseProductId}
          onChange={set('baseProductId')}
          helperText="If reps are already quoting this product, they'll see the new one suggested as an add-on."
        >
          {existingProducts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>

        {form.baseProductId && (
          <>
            <Input
              label="Minimum margin to suggest (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.upsellMinMargin}
              onChange={set('upsellMinMargin')}
              placeholder="0"
              helperText="Only surface this suggestion to reps if the new product's own margin is at least this."
            />
            <Checkbox
              label="Promote as a featured suggestion"
              checked={form.upsellPromoted}
              onChange={set('upsellPromoted')}
            />
          </>
        )}

        <Button type="submit" variant="primary" fullWidth loading={submitting} className="df-mt-8">
          Create Product
        </Button>
      </form>
    </Modal>
  );
}
