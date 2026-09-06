import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, LayoutGrid, List, FileStack, X } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import NewQuotationModal from './NewQuotationModal';
import quotationService from '../../services/quotation.service';
import { getSocket } from '../../lib/socket';

const COLUMNS = [
  { key: 'DRAFT', label: 'Draft', color: 'var(--chart-track)' },
  { key: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'var(--chart-series-4)' },
  { key: 'APPROVED', label: 'Approved', color: 'var(--chart-series-3)' },
  { key: 'NEGOTIATING', label: 'Negotiating', color: 'var(--chart-series-2)' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'var(--chart-series-1)' },
  // Bug fix: this column didn't exist before, so the moment a quotation
  // actually finished fulfillment it fell out of every Kanban bucket (the
  // status still got tracked in `byColumn`, just under a key nothing ever
  // rendered) — it looked like fulfilled orders vanished, or that a
  // quotation could never leave "Confirmed".
  { key: 'FULFILLED', label: 'Fulfilled', color: 'var(--color-success-500)' },
];

export default function QuotationsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [quotations, setQuotations] = useState(null);
  const [view, setView] = useState(statusFilter ? 'table' : 'kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    quotationService.list().then(setQuotations).catch(() => setError('Could not load quotations.'));
  };

  useEffect(load, []);

  // Live refresh — without this, a quotation that changes status elsewhere
  // (e.g. an admin resolving its last backorder) stays stuck showing its old
  // status here until the page is manually reloaded.
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const ids = (quotations || []).map((q) => q.id).filter(Boolean);
    const joinAll = () => { for (const id of ids) socket.emit('join', { quotationId: id }); };
    const handleUpdate = () => load();
    socket.on('connect', joinAll);
    socket.on('quotation:update', handleUpdate);
    if (socket.connected) joinAll();
    return () => {
      for (const id of ids) socket.emit('leave', { quotationId: id });
      socket.off('connect', joinAll);
      socket.off('quotation:update', handleUpdate);
    };
  }, [quotations]);

  const visible = useMemo(
    () => (statusFilter ? (quotations || []).filter((q) => q.status === statusFilter) : quotations),
    [quotations, statusFilter]
  );

  const byColumn = useMemo(() => {
    const map = {};
    COLUMNS.forEach((c) => { map[c.key] = []; });
    (visible || []).forEach((q) => { (map[q.status] ??= []).push(q); });
    return map;
  }, [visible]);

  const filterLabel = COLUMNS.find((c) => c.key === statusFilter)?.label;
  const clearFilter = () => setSearchParams({});

  return (
    <>
      <TopBar
        title="Quotations"
        subtitle={
          !quotations
            ? 'Loading…'
            : statusFilter
            ? `${visible.length} ${filterLabel || statusFilter}`
            : `${quotations.length} total`
        }
        actions={
          <>
            <div className="df-row-gap-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 3 }}>
              <button
                type="button"
                className="df-icon-btn"
                style={{ border: 'none', background: view === 'kanban' ? 'var(--color-primary-100)' : 'transparent', color: view === 'kanban' ? 'var(--color-primary-700)' : 'var(--text-muted)' }}
                onClick={() => setView('kanban')}
                aria-label="Kanban view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className="df-icon-btn"
                style={{ border: 'none', background: view === 'table' ? 'var(--color-primary-100)' : 'transparent', color: view === 'table' ? 'var(--color-primary-700)' : 'var(--text-muted)' }}
                onClick={() => setView('table')}
                aria-label="Table view"
              >
                <List size={15} />
              </button>
            </div>
            <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> New Quotation
            </button>
          </>
        }
      />

      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        {statusFilter && (
          <div
            className="df-row-gap-8"
            style={{
              marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 6px 6px 12px', borderRadius: 999,
              border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
              fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)',
            }}
          >
            Filtered: {filterLabel || statusFilter}
            <button
              type="button"
              onClick={clearFilter}
              aria-label="Clear filter"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'var(--bg-app)', color: 'var(--text-muted)',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {!quotations ? (
          <div className="df-kanban">
            {COLUMNS.map((c) => (
              <div key={c.key} className="df-kanban-col">
                <Skeleton height={90} radius={12} />
                <Skeleton height={90} radius={12} />
              </div>
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileStack size={24} />}
              title="No quotations yet"
              description="Start your first deal — pick a customer and build a quote."
              action={
                <button type="button" className="df-btn df-btn-primary df-btn-sm df-mt-16" onClick={() => setModalOpen(true)}>
                  <Plus size={15} /> New Quotation
                </button>
              }
            />
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileStack size={24} />}
              title="Nothing here"
              description={`No quotations are currently ${(filterLabel || statusFilter || '').toLowerCase()}.`}
            />
          </Card>
        ) : view === 'kanban' ? (
          <div className="df-kanban">
            {COLUMNS.map((col) => (
              <div key={col.key} className="df-kanban-col">
                <div className="df-kanban-col-header">
                  <span className="df-row-gap-8">
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: col.color }} />
                    {col.label}
                  </span>
                  <span className="df-kanban-count">{byColumn[col.key]?.length || 0}</span>
                </div>
                {(byColumn[col.key] || []).map((q) => (
                  <Card
                    key={q.id}
                    className="df-kanban-card"
                    onClick={() => navigate(`/quotations/${q.id}`)}
                    style={{ borderLeft: `3px solid ${col.color}` }}
                  >
                    <div className="df-kanban-card-customer">{q.customerName}</div>
                    <div className="df-kanban-card-amount">${q.amount.toLocaleString()}</div>
                    <div className="df-kanban-card-meta">
                      <span>{new Date(q.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
                {(byColumn[col.key] || []).length === 0 && (
                  <div className="df-text-sm df-text-muted" style={{ padding: '10px 4px' }}>Empty</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card style={{ padding: 0 }}>
            <div className="df-table-wrap">
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((q) => (
                    <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)}>
                      <td style={{ fontWeight: 600 }}>{q.customerName}</td>
                      <td>
                        {COLUMNS.find((c) => c.key === q.status) ? (
                          <span className="df-row-gap-8">
                            <span style={{ width: 8, height: 8, borderRadius: 3, background: COLUMNS.find((c) => c.key === q.status).color }} />
                            {COLUMNS.find((c) => c.key === q.status).label}
                          </span>
                        ) : q.status}
                      </td>
                      <td>${q.amount.toLocaleString()}</td>
                      <td className="df-text-muted">{new Date(q.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <NewQuotationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => { setModalOpen(false); navigate(`/quotations/${id}`); }}
      />
    </>
  );
}
