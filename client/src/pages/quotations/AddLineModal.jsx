import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import productService from '../../services/product.service';
import quotationService from '../../services/quotation.service';

export default function AddLineModal({ open, onClose, quotationId, customerTier, discountLimits, onAdded }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [lineType, setLineType] = useState('ONE_TIME');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setProductId('');
    setVariantId('');
    setQuantity(1);
    setDiscountPercent(0);
    setError(null);
    productService.list().then(setProducts).catch(() => setError('Could not load products.'));
  }, [open]);

  const product = products.find((p) => p.id === productId);

  const effectiveLimit = useMemo(() => {
    if (!product || !discountLimits) return null;
    const tierLimit = Number(
      discountLimits.tiers.find((t) => t.tier === customerTier)?.maxDiscountPercent ?? 100
    );
    const categoryLimit = Number(
      discountLimits.categoryLimits.find((c) => c.category === product.category)?.maxDiscountPercent ?? 100
    );
    return Math.min(tierLimit, categoryLimit);
  }, [product, discountLimits, customerTier]);

  const isOver = effectiveLimit != null && Number(discountPercent) > effectiveLimit;

  const submit = async () => {
    if (!productId || quantity < 1) {
      setError('Pick a product and a valid quantity.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await quotationService.addLine(quotationId, {
        productId,
        variantId: variantId || undefined,
        quantity: Number(quantity),
        discountPercent: Number(discountPercent),
        lineType,
      });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add line.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Product">
      {error && <div className="df-error-text" style={{ marginBottom: 12 }}>{error}</div>}

      <Select
        label="Product"
        value={productId}
        onChange={(e) => { setProductId(e.target.value); setVariantId(''); }}
        placeholder="Select a product…"
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name} · {p.category} · ${Number(p.basePrice).toLocaleString()}</option>
        ))}
      </Select>

      {product?.variants?.length > 0 && (
        <Select label="Variant" value={variantId} onChange={(e) => setVariantId(e.target.value)} placeholder="No variant">
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>{v.attributeName}: {v.attributeValue} (+${Number(v.extraPrice)})</option>
          ))}
        </Select>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Input
          label="Discount %"
          type="number" min={0} max={100} value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          helperText={effectiveLimit != null ? `Limit for this line: ${effectiveLimit}%` : undefined}
          error={isOver ? `Over limit by ${(Number(discountPercent) - effectiveLimit).toFixed(0)}pt — will need approval` : undefined}
        />
      </div>

      <Select label="Line type" value={lineType} onChange={(e) => setLineType(e.target.value)}>
        <option value="ONE_TIME">One-time</option>
        <option value="RECURRING">Recurring (subscription)</option>
      </Select>

      <Button variant="primary" fullWidth loading={submitting} onClick={submit} className="df-mt-8">
        Add to Quotation
      </Button>
    </Modal>
  );
}
