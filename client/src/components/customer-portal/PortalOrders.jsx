import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Package, RefreshCw, Truck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import portalService from '../../services/portal.service';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';
import Badge from '../ui/Badge';

export default function PortalOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalService.getOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load order fulfillment history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const shippedCount = orders.filter((o) => !o.isBackorder).length;
  const backorderCount = orders.filter((o) => o.isBackorder).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PortalSectionHeader
        title="Orders & Fulfillment"
        subtitle="Track shipment and fulfillment status across all confirmed order lines."
        action={
          <button
            onClick={loadOrders}
            title="Refresh"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '7px',
              border: '1px solid var(--portal-border-strong)',
              backgroundColor: 'transparent',
              color: 'var(--portal-text-2)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
          </button>
        }
      />

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 200px',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--color-success-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Shipped / Fulfilled</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--portal-text-1)' }}>{shippedCount}</div>
          </div>
        </div>

        <div style={{
          flex: '1 1 200px',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--color-warning-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Awaiting Stock (Backorder)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--portal-text-1)' }}>{backorderCount}</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
          color: '#ef4444',
          fontSize: '0.8125rem',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: '84px',
              borderRadius: '10px',
              border: '1px solid var(--portal-border)',
              backgroundColor: 'var(--portal-chip-bg)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <PortalEmptyState
            icon={Package}
            title="No orders yet"
            description="When your quotations are confirmed, shipment and warehouse fulfillment splits will appear here."
          />
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div className="df-table-wrap">
            <table className="df-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Product / Category</th>
                  <th>Quantity</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th>Fulfilled At</th>
                  <th>Quote Ref</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((item) => {
                  const isBackorder = item.isBackorder;
                  return (
                    <tr key={item.id} style={{ cursor: 'default' }}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {item.productName}
                        </div>
                        <div className="df-text-sm df-text-muted">{item.category}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700' }}>{item.quantityFulfilled}</span>
                        <span className="df-text-muted df-text-sm"> of {item.totalQuantity}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{item.warehouseName}</div>
                        <div className="df-text-sm df-text-muted">{item.warehouseLocation || 'Primary'}</div>
                      </td>
                      <td>
                        {isBackorder ? (
                          <Badge variant="warning" dot>
                            Backordered
                          </Badge>
                        ) : (
                          <Badge variant="success" dot>
                            Shipped
                          </Badge>
                        )}
                      </td>
                      <td className="df-text-muted">
                        {item.fulfilledAt ? new Date(item.fulfilledAt).toLocaleDateString() : 'Pending stock'}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          #{item.quotationId.slice(-8).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
