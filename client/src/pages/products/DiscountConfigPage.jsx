import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
import Skeleton from '../../components/ui/Skeleton';
import configService from '../../services/config.service';

const TIERS = ['BRONZE', 'SILVER', 'GOLD'];

// Mockup screen 18 ("Discount tiers and approval chains") — the Admin
// config screen for the governance rules riskCalculator.js and
// approvalRouter.js already enforce. Previously read-only (GET
// /config/discount-limits existed with nothing to write it); this is that
// missing writer, wired to one "Save configuration" button per the mockup.
export default function DiscountConfigPage() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState(null);
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [approvalChainRules, setApprovalChainRules] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    configService.getDiscountLimits()
      .then((data) => {
        const byTier = Object.fromEntries(data.tiers.map((t) => [t.tier, Number(t.maxDiscountPercent)]));
        setTiers(TIERS.map((tier) => ({ tier, maxDiscountPercent: byTier[tier] ?? 0 })));
        setCategoryLimits(data.categoryLimits.map((c) => ({ category: c.category, maxDiscountPercent: Number(c.maxDiscountPercent) })));
        setApprovalChainRules(
          data.approvalChainRules.map((r) => ({
            minDiscountPercent: Number(r.minDiscountPercent),
            maxDiscountPercent: Number(r.maxDiscountPercent),
            requiresManager: r.requiresManager,
            requiresFinance: r.requiresFinance,
            priority: r.priority,
          }))
        );
      })
      .catch(() => setError('Could not load the current configuration.'));
  };

  useEffect(load, []);

  const updateTier = (tier, value) => {
    setTiers((rows) => rows.map((r) => (r.tier === tier ? { ...r, maxDiscountPercent: value } : r)));
  };

  const updateCategory = (idx, field, value) => {
    setCategoryLimits((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };
  const addCategory = () => setCategoryLimits((rows) => [...rows, { category: '', maxDiscountPercent: 0 }]);
  const removeCategory = (idx) => setCategoryLimits((rows) => rows.filter((_, i) => i !== idx));

  const updateRule = (idx, field, value) => {
    setApprovalChainRules((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };
  const addRule = () =>
    setApprovalChainRules((rows) => [
      ...rows,
      { minDiscountPercent: 0, maxDiscountPercent: 0, requiresManager: true, requiresFinance: false, priority: rows.length },
    ]);
  const removeRule = (idx) => setApprovalChainRules((rows) => rows.filter((_, i) => i !== idx));

  const save = async () => {
    setError(null);
    setNotice(null);

    for (const c of categoryLimits) {
      if (!c.category.trim()) {
        setError('Every category row needs a category name.');
        return;
      }
    }
    for (const r of approvalChainRules) {
      if (Number(r.maxDiscountPercent) < Number(r.minDiscountPercent)) {
        setError('Every approval rule needs max % >= min %.');
        return;
      }
    }

    setSaving(true);
    try {
      await configService.updateDiscountLimits({
        tiers: tiers.map((t) => ({ tier: t.tier, maxDiscountPercent: Number(t.maxDiscountPercent) })),
        categoryLimits: categoryLimits.map((c) => ({ category: c.category.trim(), maxDiscountPercent: Number(c.maxDiscountPercent) })),
        approvalChainRules: approvalChainRules.map((r, idx) => ({
          minDiscountPercent: Number(r.minDiscountPercent),
          maxDiscountPercent: Number(r.maxDiscountPercent),
          requiresManager: !!r.requiresManager,
          requiresFinance: !!r.requiresFinance,
          priority: idx,
        })),
      });
      setNotice('Configuration saved.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save that configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar
        title={
          <span className="df-row-gap-8">
            <button type="button" className="df-icon-btn" onClick={() => navigate('/products')}>
              <ArrowLeft size={15} />
            </button>
            Discount Tiers &amp; Approval Chains
          </span>
        }
        subtitle="Governs every quotation's blended risk score and approval routing"
        actions={
          <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={save} disabled={saving || !tiers}>
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        }
      />

      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}
        {notice && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--color-success-50)', color: 'var(--color-success-700)', fontSize: 13, fontWeight: 600 }}>{notice}</div>}

        {!tiers ? (
          <Card><Skeleton height={320} /></Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <div className="df-card-title" style={{ marginBottom: 12 }}>Tier Discount Ceilings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tiers.map((t) => (
                  <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 90, fontWeight: 600, fontSize: 13 }}>{t.tier}</span>
                    <Input
                      type="number" min="0" max="100" step="0.5"
                      value={t.maxDiscountPercent}
                      onChange={(e) => updateTier(t.tier, e.target.value)}
                      style={{ maxWidth: 140 }}
                    />
                    <span className="df-text-sm df-text-muted">% max discount</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="df-card-header" style={{ marginBottom: 12 }}>
                <div className="df-card-title">Category Discount Limits</div>
                <button type="button" className="df-btn df-btn-outline df-btn-sm" onClick={addCategory}>
                  <Plus size={13} /> Add Category
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categoryLimits.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Input
                      placeholder="Category (e.g. Hardware)"
                      value={c.category}
                      onChange={(e) => updateCategory(idx, 'category', e.target.value)}
                      style={{ maxWidth: 220 }}
                    />
                    <Input
                      type="number" min="0" max="100" step="0.5"
                      value={c.maxDiscountPercent}
                      onChange={(e) => updateCategory(idx, 'maxDiscountPercent', e.target.value)}
                      style={{ maxWidth: 140 }}
                    />
                    <span className="df-text-sm df-text-muted">% max discount</span>
                    <button type="button" className="df-icon-btn" style={{ border: 'none', marginLeft: 'auto' }} onClick={() => removeCategory(idx)} aria-label="Remove category">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {categoryLimits.length === 0 && (
                  <div className="df-text-sm df-text-muted">No category-specific limits — only the tier ceiling above applies.</div>
                )}
              </div>
            </Card>

            <Card>
              <div className="df-card-header" style={{ marginBottom: 12 }}>
                <div>
                  <div className="df-card-title">Approval Chain</div>
                  <div className="df-card-subtitle">Blended risk score range → who must approve</div>
                </div>
                <button type="button" className="df-btn df-btn-outline df-btn-sm" onClick={addRule}>
                  <Plus size={13} /> Add Rule
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {approvalChainRules.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Input
                      type="number" min="0" step="0.5"
                      value={r.minDiscountPercent}
                      onChange={(e) => updateRule(idx, 'minDiscountPercent', e.target.value)}
                      style={{ maxWidth: 110 }}
                    />
                    <span className="df-text-sm df-text-muted">to</span>
                    <Input
                      type="number" min="0" step="0.5"
                      value={r.maxDiscountPercent}
                      onChange={(e) => updateRule(idx, 'maxDiscountPercent', e.target.value)}
                      style={{ maxWidth: 110 }}
                    />
                    <Checkbox label="Manager" checked={r.requiresManager} onChange={(e) => updateRule(idx, 'requiresManager', e.target.checked)} />
                    <Checkbox label="Finance" checked={r.requiresFinance} onChange={(e) => updateRule(idx, 'requiresFinance', e.target.checked)} />
                    <button type="button" className="df-icon-btn" style={{ border: 'none', marginLeft: 'auto' }} onClick={() => removeRule(idx)} aria-label="Remove rule">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {approvalChainRules.length === 0 && (
                  <div className="df-text-sm df-text-muted">
                    No rules configured — every blended risk score above 0 will currently require nothing. Add at least one range.
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
