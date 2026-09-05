import React, { useEffect, useState, useCallback } from 'react';
import { 
  Building, 
  PackagePlus, 
  Warehouse, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Layers,
  Percent
} from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import configService from '../../services/config.service';
import stockService from '../../services/stock.service';

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState('addStock'); // 'addStock' | 'warehouses' | 'products' | 'governance'
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Add stock form state
  const [stockForm, setStockForm] = useState({
    warehouseId: '',
    productId: '',
    quantity: 50,
  });
  const [addingStock, setAddingStock] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await configService.getDiscountLimits();
      setConfig(data);
      if (data?.warehouses?.length > 0 && !stockForm.warehouseId) {
        setStockForm((prev) => ({
          ...prev,
          warehouseId: data.warehouses[0].id,
          productId: data.products?.[0]?.id || '',
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load system configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockForm.warehouseId || !stockForm.productId || stockForm.quantity <= 0) {
      setError('Please select a warehouse, product, and specify a quantity greater than 0.');
      return;
    }

    setAddingStock(true);
    setError(null);
    setNotice(null);

    try {
      const res = await stockService.addStock(stockForm);
      setNotice(`Stock added successfully! New quantity available: ${res.quantityAvailable}. Any pending backorders have been automatically processed.`);
      // Reload config to update stock levels in the UI
      loadConfig();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to replenish stock.');
    } finally {
      setAddingStock(false);
    }
  };

  const tabs = [
    { id: 'addStock', label: 'Replenish Stock', icon: PackagePlus },
    { id: 'warehouses', label: 'Warehouses & Inventory', icon: Warehouse },
    { id: 'products', label: 'Products & Price Lists', icon: Layers },
    { id: 'governance', label: 'Discount Governance Rules', icon: Sliders },
  ];

  return (
    <>
      <TopBar
        title="Admin Control Center"
        subtitle="Manage warehouse stock replenishment, pricing structures, and discount governance policies."
        actions={
          <button
            type="button"
            className="df-btn df-btn-outline df-btn-sm"
            onClick={loadConfig}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      <div className="df-page">
        {error && (
          <div className="df-status-banner df-status-banner-error" style={{ marginBottom: 16 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="df-status-banner df-status-banner-success" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={18} />
            <span>{notice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'var(--color-primary-50)' : 'transparent',
                  color: isActive ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {loading && !config ? (
          <Card>
            <Skeleton height={260} />
          </Card>
        ) : (
          <>
            {/* TAB 1: ADD STOCK FORM */}
            {activeTab === 'addStock' && (
              <div style={{ maxWidth: 640 }}>
                <Card>
                  <div className="df-card-header" style={{ marginBottom: 16 }}>
                    <div>
                      <div className="df-card-title">Add Stock to Warehouse</div>
                      <div className="df-card-subtitle">
                        Replenishing stock automatically evaluates and fulfills FIFO backordered quotations.
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="df-input-label" style={{ marginBottom: 6, display: 'block', fontWeight: 600 }}>
                        Target Warehouse
                      </label>
                      <select
                        className="df-input"
                        value={stockForm.warehouseId}
                        onChange={(e) => setStockForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
                        required
                      >
                        {config?.warehouses?.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} — Shipping Weight: {Number(w.shippingCostWeight || 1).toFixed(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="df-input-label" style={{ marginBottom: 6, display: 'block', fontWeight: 600 }}>
                        Product
                      </label>
                      <select
                        className="df-input"
                        value={stockForm.productId}
                        onChange={(e) => setStockForm((prev) => ({ ...prev, productId: e.target.value }))}
                        required
                      >
                        {config?.products?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.category}) — Base Price: ${Number(p.basePrice).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="df-input-label" style={{ marginBottom: 6, display: 'block', fontWeight: 600 }}>
                        Quantity to Add
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="df-input"
                        value={stockForm.quantity}
                        onChange={(e) => setStockForm((prev) => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))}
                        required
                      />
                    </div>

                    <div style={{ paddingTop: 8 }}>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={addingStock}
                        loadingText="Processing Stock Addition…"
                      >
                        <PackagePlus size={16} /> Replenish Stock
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {/* TAB 2: WAREHOUSES & INVENTORY */}
            {activeTab === 'warehouses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {config?.warehouses?.map((w) => (
                  <Card key={w.id} style={{ padding: 0 }}>
                    <div className="df-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div className="df-card-title">{w.name}</div>
                        <div className="df-card-subtitle">
                          Shipping Cost Weight: {Number(w.shippingCostWeight)}
                        </div>
                      </div>
                      <Badge variant="primary">{w.stockLevels?.length || 0} Products Stocked</Badge>
                    </div>

                    <div className="df-table-wrap">
                      <table className="df-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Base Price</th>
                            <th>Available Qty</th>
                            <th>Reserved Qty</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {w.stockLevels?.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: 24 }} className="df-text-muted">
                                No stock records in this warehouse yet.
                              </td>
                            </tr>
                          ) : (
                            w.stockLevels?.map((sl) => {
                              const isLow = sl.quantityAvailable <= (sl.replenishmentThreshold || 10);
                              return (
                                <tr key={sl.id}>
                                  <td style={{ fontWeight: 600 }}>{sl.product?.name}</td>
                                  <td className="df-text-muted">{sl.product?.category}</td>
                                  <td>${Number(sl.product?.basePrice || 0).toLocaleString()}</td>
                                  <td>
                                    <strong style={{ color: isLow ? 'var(--color-danger-600)' : 'var(--text-primary)' }}>
                                      {sl.quantityAvailable}
                                    </strong>
                                  </td>
                                  <td className="df-text-muted">{sl.quantityReserved}</td>
                                  <td>
                                    <Badge variant={isLow ? 'warning' : 'success'} dot>
                                      {isLow ? 'Low Stock' : 'In Stock'}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* TAB 3: PRODUCTS & PRICE LISTS */}
            {activeTab === 'products' && (
              <Card style={{ padding: 0 }}>
                <div className="df-card-header" style={{ padding: '16px 20px' }}>
                  <div>
                    <div className="df-card-title">Catalog &amp; Price List</div>
                    <div className="df-card-subtitle">Active company products and baseline catalog pricing.</div>
                  </div>
                </div>

                <div className="df-table-wrap">
                  <table className="df-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>SKU</th>
                        <th>Base Price</th>
                        <th>Variants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config?.products?.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>
                            <Badge variant="neutral">{p.category}</Badge>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku || '—'}</td>
                          <td style={{ fontWeight: 700 }}>
                            ${Number(p.basePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="df-text-muted">
                            {p.variants?.length > 0 ? (
                              p.variants.map((v) => v.attributeValue).join(', ')
                            ) : (
                              'Standard'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* TAB 4: DISCOUNT GOVERNANCE RULES */}
            {activeTab === 'governance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Category Limits */}
                <Card style={{ padding: 0 }}>
                  <div className="df-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="df-card-title">Category Discount Limits</div>
                      <div className="df-card-subtitle">Maximum discount percentage allowed per product category.</div>
                    </div>
                  </div>
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead>
                        <tr><th>Category</th><th>Max Discount</th></tr>
                      </thead>
                      <tbody>
                        {config?.categoryLimits?.map((cl) => (
                          <tr key={cl.id}>
                            <td style={{ fontWeight: 600 }}>{cl.category}</td>
                            <td>
                              <Badge variant="primary">{Number(cl.maxDiscountPercent)}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Tier Limits */}
                <Card style={{ padding: 0 }}>
                  <div className="df-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="df-card-title">Customer Tier Limits</div>
                      <div className="df-card-subtitle">Allowed ceiling per customer tier level.</div>
                    </div>
                  </div>
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead>
                        <tr><th>Tier</th><th>Max Discount</th></tr>
                      </thead>
                      <tbody>
                        {config?.tiers?.map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>{t.tier}</td>
                            <td>
                              <Badge variant="success">{Number(t.maxDiscountPercent)}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Approval Chain Rules */}
                <Card style={{ padding: 0, gridColumn: '1 / -1' }}>
                  <div className="df-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="df-card-title">Approval Chain Routing Rules</div>
                      <div className="df-card-subtitle">
                        Conditions that trigger Manager and Finance approvals based on Blended Risk Scores.
                      </div>
                    </div>
                  </div>
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead>
                        <tr>
                          <th>Priority</th>
                          <th>Approver Role</th>
                          <th>Min Risk Score</th>
                          <th>Max Risk Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {config?.approvalChainRules?.map((rule) => (
                          <tr key={rule.id}>
                            <td style={{ fontWeight: 700 }}>#{rule.priority}</td>
                            <td>
                              <Badge variant={rule.approverRole === 'FINANCE' ? 'warning' : 'primary'}>
                                {rule.approverRole}
                              </Badge>
                            </td>
                            <td>{Number(rule.minBlendedRiskScore)}</td>
                            <td>{rule.maxBlendedRiskScore != null ? Number(rule.maxBlendedRiskScore) : '∞'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
