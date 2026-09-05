import React, { useEffect, useState, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  RotateCcw, 
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import reportService from '../../services/report.service';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FULFILLED', label: 'Fulfilled' },
];

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    category: '',
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportService.getReportData(filters);
      setData(result || []);
    } catch (err) {
      setError(err.response?.data?.error || err.friendlyMessage || 'Could not load report data.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', status: '', category: '' });
  };

  const handleExport = async (format) => {
    if (format === 'pdf') setExportingPdf(true);
    if (format === 'xlsx') setExportingXlsx(true);
    setError(null);
    try {
      await reportService.downloadReport(filters, format);
    } catch (err) {
      setError(`Failed to export ${format.toUpperCase()} report.`);
    } finally {
      if (format === 'pdf') setExportingPdf(false);
      if (format === 'xlsx') setExportingXlsx(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalValue = data.reduce((sum, q) => sum + (q.orderTotal || 0), 0);

  return (
    <>
      <TopBar
        title="Quotation Reports & Exports"
        subtitle="Filter and analyze quotations across pipeline stages with instant PDF and XLSX downloads."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="df-btn df-btn-outline df-btn-sm"
              disabled={exportingPdf || loading}
              onClick={() => handleExport('pdf')}
            >
              <FileText size={14} />
              {exportingPdf ? 'Generating PDF…' : 'Export PDF'}
            </button>
            <button
              type="button"
              className="df-btn df-btn-outline df-btn-sm"
              disabled={exportingXlsx || loading}
              onClick={() => handleExport('xlsx')}
            >
              <FileSpreadsheet size={14} color="var(--color-success-600)" />
              {exportingXlsx ? 'Exporting…' : 'Export XLSX'}
            </button>
          </div>
        }
      />

      <div className="df-page">
        {error && (
          <div className="df-status-banner df-status-banner-error" style={{ marginBottom: 16 }}>
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px', minWidth: 140 }}>
              <label className="df-input-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>From Date</label>
              <input
                type="date"
                name="dateFrom"
                className="df-input"
                style={{ padding: '7px 10px', fontSize: 13 }}
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>

            <div style={{ flex: '1 1 140px', minWidth: 140 }}>
              <label className="df-input-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>To Date</label>
              <input
                type="date"
                name="dateTo"
                className="df-input"
                style={{ padding: '7px 10px', fontSize: 13 }}
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>

            <div style={{ flex: '1 1 160px', minWidth: 160 }}>
              <label className="df-input-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Status</label>
              <select
                name="status"
                className="df-input"
                style={{ padding: '7px 10px', fontSize: 13 }}
                value={filters.status}
                onChange={handleFilterChange}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 160px', minWidth: 160 }}>
              <label className="df-input-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Category</label>
              <input
                type="text"
                name="category"
                placeholder="e.g. Hardware, SaaS"
                className="df-input"
                style={{ padding: '7px 10px', fontSize: 13 }}
                value={filters.category}
                onChange={handleFilterChange}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="df-btn df-btn-secondary df-btn-sm"
                onClick={handleReset}
                title="Reset all filters"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        </Card>

        {/* Aggregate Summary */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
            <span className="df-text-muted df-text-sm">Total Records: </span>
            <strong style={{ fontSize: 16, color: 'var(--text-primary)' }}>{data.length}</strong>
          </div>
          <div style={{ padding: '12px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
            <span className="df-text-muted df-text-sm">Filtered Order Value: </span>
            <strong style={{ fontSize: 16, color: 'var(--color-primary-600)' }}>
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Data Table */}
        <Card style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              <Skeleton height={240} />
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: 40 }}>
              <EmptyState
                icon={<Filter size={24} />}
                title="No quotations match these criteria"
                description="Try clearing or broadening your date and category filters."
              />
            </div>
          ) : (
            <div className="df-table-wrap">
              <table className="df-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <th>Quotation Ref</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Tier</th>
                    <th>Rep</th>
                    <th>Lines</th>
                    <th>Total Value</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((q) => {
                    const isExpanded = expandedRows[q.id];
                    return (
                      <React.Fragment key={q.id}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className="df-icon-btn"
                              style={{ border: 'none', background: 'transparent' }}
                              onClick={() => toggleRow(q.id)}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            #{q.id.slice(-8).toUpperCase()}
                          </td>
                          <td>
                            <Badge variant={{
                              DRAFT: 'neutral',
                              PENDING_APPROVAL: 'warning',
                              APPROVED: 'success',
                              NEGOTIATING: 'violet',
                              CONFIRMED: 'primary',
                              FULFILLED: 'success',
                              REJECTED: 'danger',
                            }[q.status] || 'neutral'} dot>
                              {q.status}
                            </Badge>
                          </td>
                          <td style={{ fontWeight: 600 }}>{q.customerName}</td>
                          <td>
                            <Badge variant="neutral">{q.customerTier}</Badge>
                          </td>
                          <td>{q.repName}</td>
                          <td>{q.lineCount}</td>
                          <td style={{ fontWeight: 700 }}>
                            ${q.orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="df-text-muted">
                            {new Date(q.createdAt).toLocaleDateString()}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: 'var(--bg-app)' }}>
                            <td colSpan={9} style={{ padding: '12px 20px 16px 44px' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>
                                LINE ITEM DETAILS ({q.lines?.length || 0})
                              </div>
                              <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '4px 8px' }}>Product</th>
                                    <th style={{ padding: '4px 8px' }}>Category</th>
                                    <th style={{ padding: '4px 8px' }}>Type</th>
                                    <th style={{ padding: '4px 8px' }}>Qty</th>
                                    <th style={{ padding: '4px 8px' }}>Unit Price</th>
                                    <th style={{ padding: '4px 8px' }}>Discount</th>
                                    <th style={{ padding: '4px 8px' }}>Line Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.lines?.map((line, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{line.productName}</td>
                                      <td style={{ padding: '6px 8px' }}>{line.category}</td>
                                      <td style={{ padding: '6px 8px' }}>{line.lineType}</td>
                                      <td style={{ padding: '6px 8px' }}>{line.quantity}</td>
                                      <td style={{ padding: '6px 8px' }}>${line.unitPrice.toLocaleString()}</td>
                                      <td style={{ padding: '6px 8px' }}>{line.discountPercent}%</td>
                                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>${line.lineTotal.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
