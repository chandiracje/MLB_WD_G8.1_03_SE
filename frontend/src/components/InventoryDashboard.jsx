import React, { useState, useEffect } from 'react';
import { api, initialSampleProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconPackage, IconAlert, IconPlus, IconMinus, IconClock, IconX } from './Icons';

export const InventoryDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('New batch supplier delivery');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [adjustError, setAdjustError] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const p = await api.getProducts();
      setProducts(p || []);
      const h = await api.getAdjustmentHistory();
      setHistory(h || []);
    } catch (e) {
      console.warn("Could not fetch inventory:", e.message);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjustError('');
    if (!selectedProduct || !quantityChange) return;

    const change = parseInt(quantityChange, 10);
    if (isNaN(change) || change === 0) {
      setAdjustError('Please specify a non-zero adjustment amount (+ to add, - to deduct).');
      return;
    }

    if (selectedProduct.stockQuantity + change < 0) {
      setAdjustError(`Cannot deduct ${Math.abs(change)} units. Current stock is only ${selectedProduct.stockQuantity}.`);
      return;
    }

    try {
      await api.adjustStock(selectedProduct.id, user?.id || 2, change, reason);
      await loadInventory();
      setIsModalOpen(false);
      setSelectedProduct(null);
      setQuantityChange('');
      setAdjustError('');
    } catch (e) {
      setAdjustError(e.message || "Stock adjustment failed.");
    }
  };

  const lowStockItems = products.filter(p => p.stockQuantity <= (p.reorderLevel || 10));

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Inventory & Warehouse Control</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time stock level monitoring, threshold alerts, and stock adjustments</p>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '10px' }}>
              <IconAlert size={22} />
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '1rem' }}>
                ⚠️ {lowStockItems.length} Products Have Reached Reorder Thresholds!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
                Immediate supplier replenishment required for: {lowStockItems.map(p => p.name).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {products.map(p => {
          const isLow = p.stockQuantity <= (p.reorderLevel || 10);
          return (
            <div key={p.id} className="glass-card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img src={p.imageUrl} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: '1' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{p.name}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Reorder Level: <strong>{p.reorderLevel || 10} {p.unit}</strong>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: isLow ? '#dc2626' : '#10b981', marginTop: '4px' }}>
                  {p.stockQuantity} {p.unit} in stock
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedProduct(p);
                  setIsModalOpen(true);
                }}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              >
                Adjust Stock
              </button>
            </div>
          );
        })}
      </div>

      {/* Adjustment Log */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Stock Adjustment Audit Trail</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Product</th>
                <th style={{ padding: '10px' }}>Change</th>
                <th style={{ padding: '10px' }}>Reason</th>
                <th style={{ padding: '10px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', fontWeight: '600' }}>{h.product?.name || 'Stock Item'}</td>
                  <td style={{ padding: '10px', fontWeight: '700', color: h.quantityChange > 0 ? '#16a34a' : '#dc2626' }}>
                    {h.quantityChange > 0 ? `+${h.quantityChange}` : h.quantityChange}
                  </td>
                  <td style={{ padding: '10px' }}>{h.reason}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{h.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {isModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Adjust Stock: {selectedProduct.name}</h2>
              <button onClick={() => setIsModalOpen(false)}><IconX size={20} /></button>
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {adjustError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {adjustError}
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Quantity Adjustment (use positive to add, negative to deduct) *</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. +20 (restock) or -5 (damaged/expired)"
                  value={quantityChange} 
                  onChange={(e) => setQuantityChange(e.target.value)} 
                  style={{ width: '100%' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Reason for Adjustment *</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%' }}>
                  <option value="New batch supplier delivery">New batch supplier delivery</option>
                  <option value="Damaged packaging during storage">Damaged packaging during storage</option>
                  <option value="Expired item safe disposal">Expired item safe disposal</option>
                  <option value="Inventory physical count reconciliation">Inventory physical count reconciliation</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '12px', marginTop: '8px' }}>
                Confirm Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
