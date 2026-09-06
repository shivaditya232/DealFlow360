import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Settings, Pencil, Trash2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import NewProductModal from './NewProductModal';
import EditProductModal from './EditProductModal';
import productService from '../../services/product.service';

// Mockup screen 16 ("Product Dashboard") basics: catalog table + "+ New
// Product". Screen 17 (variants/price-list detail per product) and the
// "Manage Price fields" action aren't built yet — this covers create + list
// + edit/delete (the last two were the actual bug: this screen only ever
// let you create a product, never fix or remove one afterwards).
export default function ProductsList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    productService.list().then(setProducts).catch(() => setError('Could not load products.'));
  };

  useEffect(load, []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setDeletingId(product.id);
    setError(null);
    try {
      await productService.remove(product.id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete that product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <TopBar
        title="Products"
        subtitle={!products ? 'Loading…' : `${products.length} in catalog`}
        actions={
          <>
            <button type="button" className="df-btn df-btn-outline df-btn-sm" onClick={() => navigate('/products/config')}>
              <Settings size={15} /> Discount &amp; Approval Config
            </button>
            <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> New Product
            </button>
          </>
        }
      />

      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        {!products ? (
          <Card><Skeleton height={280} /></Card>
        ) : products.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Package size={24} />}
              title="No products yet"
              description="Add your first product to start building quotations against it."
              action={
                <button type="button" className="df-btn df-btn-primary df-btn-sm df-mt-16" onClick={() => setModalOpen(true)}>
                  <Plus size={15} /> New Product
                </button>
              }
            />
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <div className="df-table-wrap">
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Variants</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th>Tax</th>
                    <th>Margin</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td className="df-text-muted">{p.variants?.length ?? 0}</td>
                      <td>${Number(p.basePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="df-text-muted">{p.unit}</td>
                      <td className="df-text-muted">{Number(p.taxRate)}%</td>
                      <td className="df-text-muted">{Number(p.marginPercent)}%</td>
                      <td>
                        <div className="df-row-actions">
                          <button
                            type="button"
                            className="df-icon-btn"
                            aria-label={`Edit ${p.name}`}
                            title="Edit"
                            onClick={() => setEditingProduct(p)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="df-icon-btn df-icon-btn-danger"
                            aria-label={`Delete ${p.name}`}
                            title="Delete"
                            disabled={deletingId === p.id}
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <NewProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); load(); }}
        existingProducts={products || []}
      />

      <EditProductModal
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={() => { setEditingProduct(null); load(); }}
      />
    </>
  );
}
