import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IconPackage, 
  IconAlert, 
  IconPlus, 
  IconMinus, 
  IconClock, 
  IconX, 
  IconTrash, 
  IconSearch, 
  IconCheck, 
  IconBarChart,
  IconDollar
} from './Icons';

export const InventoryDashboard = () => {
  const { user } = useAuth();
  
  // Data states
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'alerts', 'audit'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  
  // Adjust Stock modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('New batch supplier delivery');
  const [adjustError, setAdjustError] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Add / Edit Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formUnit, setFormUnit] = useState('unit');
  const [formStock, setFormStock] = useState('20');
  const [formReorder, setFormReorder] = useState('10');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formImg, setFormImg] = useState('');
  const [productFormError, setProductFormError] = useState('');
  const [productFormLoading, setProductFormLoading] = useState(false);

  // Audit trail filtering
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all'); // 'all', 'addition', 'deduction'

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const p = await api.getProducts();
      setProducts(p || []);
    } catch (e) {
      console.warn("Could not fetch products:", e.message);
    }
    try {
      const h = await api.getAdjustmentHistory();
      setHistory(h || []);
    } catch (e) {
      console.warn("Could not fetch adjustment history:", e.message);
    }
    try {
      const c = await api.getCategories();
      setCategories(c || []);
    } catch (e) {
      console.warn("Could not fetch categories:", e.message);
    }
  };

  const showFeedback = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  // ─── Stock Adjustment Handlers ──────────────────────────────────────────────
  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setQuantityChange('');
    setReason('New batch supplier delivery');
    setAdjustError('');
    setIsAdjustModalOpen(true);
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

    setAdjustLoading(true);
    try {
      await api.adjustStock(
        selectedProduct.id, 
        user?.id, 
        change, 
        reason, 
        user?.email
      );
      await loadInventory();
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      setQuantityChange('');
      showFeedback(`Stock updated successfully for "${selectedProduct.name}" (${change > 0 ? `+${change}` : change} ${selectedProduct.unit}).`);
    } catch (err) {
      setAdjustError(err.message || "Stock adjustment failed.");
    } finally {
      setAdjustLoading(false);
    }
  };

  // ─── Product CRUD Handlers ──────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormUnit('unit');
    setFormStock('20');
    setFormReorder('10');
    setFormCategoryId(categories[0] ? String(categories[0].id) : '');
    setFormImg('');
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setFormName(p.name || '');
    setFormDesc(p.description || '');
    setFormPrice(p.price != null ? String(p.price) : '');
    setFormUnit(p.unit || 'unit');
    setFormStock(p.stockQuantity != null ? String(p.stockQuantity) : '0');
    setFormReorder(p.reorderLevel != null ? String(p.reorderLevel) : '10');
    setFormCategoryId(p.category?.id ? String(p.category.id) : (categories[0] ? String(categories[0].id) : ''));
    setFormImg(p.imageUrl || '');
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductFormError('');

    if (!formName.trim() || formName.trim().length < 3) {
      setProductFormError('Product name must be at least 3 characters.');
      return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      setProductFormError('Price must be a valid positive number.');
      return;
    }
    const stock = parseInt(formStock, 10);
    if (isNaN(stock) || stock < 0) {
      setProductFormError('Stock quantity cannot be negative.');
      return;
    }
    const reorder = parseInt(formReorder, 10);
    if (isNaN(reorder) || reorder < 1) {
      setProductFormError('Reorder threshold level must be at least 1.');
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      price,
      unit: formUnit.trim() || 'unit',
      stockQuantity: stock,
      reorderLevel: reorder,
      imageUrl: formImg.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'
    };

    const catId = formCategoryId ? Number(formCategoryId) : null;
    setProductFormLoading(true);

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload, catId);
        showFeedback(`Product "${payload.name}" updated successfully!`);
      } else {
        await api.createProduct(payload, catId);
        showFeedback(`New product "${payload.name}" added to inventory!`);
      }
      await loadInventory();
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setProductFormError(err.message || 'Failed to save product.');
    } finally {
      setProductFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to remove/discontinue "${product.name}" from inventory?`)) {
      return;
    }
    try {
      await api.deleteProduct(product.id);
      await loadInventory();
      showFeedback(`Product "${product.name}" has been discontinued.`);
    } catch (err) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const lowStockItems = products.filter(p => p.stockQuantity <= (p.reorderLevel || 10));

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.unit && p.unit.toLowerCase().includes(term)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  const filteredHistory = history.filter(h => {
    // Type filter
    if (auditTypeFilter === 'addition' && h.quantityChange <= 0) return false;
    if (auditTypeFilter === 'deduction' && h.quantityChange >= 0) return false;

    // Search filter
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    const prodName = h.product?.name ? h.product.name.toLowerCase() : '';
    const reasonText = h.reason ? h.reason.toLowerCase() : '';
    const staffName = h.adjustedBy?.name ? h.adjustedBy.name.toLowerCase() : '';
    const staffRole = h.adjustedBy?.role ? h.adjustedBy.role.toLowerCase() : '';
    return (
      prodName.includes(term) || 
      reasonText.includes(term) || 
      staffName.includes(term) || 
      staffRole.includes(term)
    );
  });

  // Calculate audit stats
  const totalRestockedUnits = history
    .filter(h => h.quantityChange > 0)
    .reduce((sum, h) => sum + h.quantityChange, 0);

  const totalDeductedUnits = history
    .filter(h => h.quantityChange < 0)
    .reduce((sum, h) => sum + Math.abs(h.quantityChange), 0);

  // ─── Tab Helper ─────────────────────────────────────────────────────────────
  const tabBtn = (key, label, badgeCount = null, badgeColor = null) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '9px 18px',
        borderRadius: 'var(--radius-md)',
        fontWeight: '600',
        background: activeTab === key ? 'var(--primary)' : 'var(--bg-card)',
        color: activeTab === key ? 'white' : 'var(--text-main)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer'
      }}
    >
      <span>{label}</span>
      {badgeCount != null && (
        <span style={{
          background: activeTab === key ? 'rgba(255,255,255,0.25)' : (badgeColor || '#e2e8f0'),
          color: activeTab === key ? 'white' : '#1e293b',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: '700'
        }}>
          {badgeCount}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Inventory & Warehouse Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time stock level monitoring, item CRUD operations, restock reorder alerts, and audit trail logs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddProduct} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconPlus size={18} /> Add New Item
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMsg && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontWeight: '600', fontSize: '0.9rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCheck size={18} />
          {actionMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>TOTAL ACTIVE ITEMS</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}><IconPackage size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>{products.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Catalog inventory items</div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>REORDER ALERTS</span>
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '6px', borderRadius: '8px' }}><IconAlert size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#dc2626' }}>{lowStockItems.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>
            {lowStockItems.length > 0 ? 'Replenishment needed' : 'All stocks healthy'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>TOTAL UNITS RESTOCKED</span>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}><IconPlus size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#16a34a' }}>+{totalRestockedUnits}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', fontWeight: '600' }}>Total additions logged</div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>AUDIT LOG ENTRIES</span>
            <div style={{ background: '#f3e8ff', color: '#7e22ce', padding: '6px', borderRadius: '8px' }}><IconClock size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#7e22ce' }}>{history.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Recorded stock audits</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabBtn('catalog', 'Inventory Items', products.length)}
        {tabBtn('alerts', 'Low Stock Replenishment', lowStockItems.length, lowStockItems.length > 0 ? '#fecaca' : null)}
        {tabBtn('audit', 'Stock Adjustment Audit Trails', history.length)}
      </div>

      {/* ─── TAB 1: INVENTORY ITEMS CATALOG ───────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div>
          {/* Search bar & Add shortcut */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
              <input
                type="text"
                placeholder="Search inventory by name, category, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', paddingLeft: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

          {/* Catalog Table */}
          <div className="glass-card" style={{ overflowX: 'auto', padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Product</th>
                  <th style={{ padding: '10px' }}>Category</th>
                  <th style={{ padding: '10px' }}>Price</th>
                  <th style={{ padding: '10px' }}>Stock Level</th>
                  <th style={{ padding: '10px' }}>Reorder Threshold</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No inventory items found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.stockQuantity <= (p.reorderLevel || 10);
                    const isOut = p.stockQuantity === 0;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={p.imageUrl} alt={p.name} style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <strong style={{ color: 'var(--text-main)' }}>{p.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{p.id}</div>
                          </div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ background: 'var(--bg-main)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {p.category?.name || p.categoryName || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>Rs. {Number(p.price).toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontWeight: '800', fontSize: '1rem', color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a' }}>
                            {p.stockQuantity} {p.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                          {p.reorderLevel || 10} {p.unit}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              onClick={() => openAdjustModal(p)}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              title="Adjust Stock Quantity"
                            >
                              Adjust Stock
                            </button>
                            <button
                              onClick={() => openEditProduct(p)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              title="Edit Details"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}
                              title="Discontinue Product"
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LOW STOCK ALERTS ─────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div>
          {lowStockItems.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '8px' }}>All Inventory Levels Are Healthy!</h3>
              <p style={{ fontSize: '0.9rem' }}>No products are currently at or below their reorder thresholds.</p>
            </div>
          ) : (
            <div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '10px' }}>
                  <IconAlert size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '1rem' }}>
                    Critical Attention: {lowStockItems.length} Products Have Fallen Below Reorder Limits!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
                    Issue purchase replenishment orders to suppliers or adjust received stock batches immediately.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {lowStockItems.map(p => {
                  const deficit = Math.max(0, (p.reorderLevel || 10) - p.stockQuantity);
                  return (
                    <div key={p.id} className="glass-card" style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <img src={p.imageUrl} alt={p.name} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: '1' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 4px 0' }}>{p.name}</h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Category: <strong>{p.category?.name || 'General'}</strong>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: '600', marginTop: '2px' }}>
                          Threshold: {p.reorderLevel || 10} {p.unit} | Deficit: -{deficit} {p.unit}
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: p.stockQuantity === 0 ? '#dc2626' : '#d97706', marginTop: '4px' }}>
                          Current: {p.stockQuantity} {p.unit}
                        </div>
                      </div>

                      <button
                        onClick={() => openAdjustModal(p)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.85rem', alignSelf: 'center' }}
                      >
                        Restock Now
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: STOCK ADJUSTMENT AUDIT TRAIL ──────────────────────────────── */}
      {activeTab === 'audit' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
              <input
                type="text"
                placeholder="Search audit trail by product, reason, or staff member..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', paddingLeft: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type:</span>
              <select
                value={auditTypeFilter}
                onChange={(e) => setAuditTypeFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              >
                <option value="all">All Adjustments ({history.length})</option>
                <option value="addition">➕ Additions / Restocks</option>
                <option value="deduction">➖ Deductions / Disposals</option>
              </select>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Log ID</th>
                  <th style={{ padding: '10px' }}>Product</th>
                  <th style={{ padding: '10px' }}>Quantity Change</th>
                  <th style={{ padding: '10px' }}>Reason</th>
                  <th style={{ padding: '10px' }}>Adjusted By</th>
                  <th style={{ padding: '10px' }}>Date & Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No audit trail records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(h => {
                    const isPositive = h.quantityChange > 0;
                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          #{h.id}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <strong>{h.product?.name || 'Stock Item'}</strong>
                          {h.product?.unit && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                              ({h.product.unit})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            fontWeight: '800',
                            fontSize: '0.95rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isPositive ? '#dcfce7' : '#fee2e2',
                            color: isPositive ? '#166534' : '#991b1b'
                          }}>
                            {isPositive ? `+${h.quantityChange}` : h.quantityChange}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                          {h.reason}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            {h.adjustedBy?.name || 'Staff User'}
                          </div>
                          {h.adjustedBy?.role && (
                            <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                              {h.adjustedBy.role}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {h.createdAt ? new Date(h.createdAt).toLocaleString('en-GB') : 'Just now'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ADJUST STOCK MODAL ──────────────────────────────────────────────── */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={() => setIsAdjustModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Adjust Stock: {selectedProduct.name}</h2>
              <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {adjustError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {adjustError}
                </div>
              )}

              {/* Current stock indicator */}
              <div style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Quantity:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedProduct.stockQuantity} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Quantity Adjustment (positive to restock, negative to deduct) *
                </label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. +20 or -5"
                  value={quantityChange} 
                  onChange={(e) => setQuantityChange(e.target.value)} 
                  style={{ width: '100%' }} 
                />

                {/* Quick adjustment buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setQuantityChange('10')} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>+10</button>
                  <button type="button" onClick={() => setQuantityChange('25')} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>+25</button>
                  <button type="button" onClick={() => setQuantityChange('50')} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>+50</button>
                  <button type="button" onClick={() => setQuantityChange('-1')} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#ef4444' }}>-1</button>
                  <button type="button" onClick={() => setQuantityChange('-5')} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#ef4444' }}>-5</button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Reason for Adjustment *
                </label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  <option value="New batch supplier delivery">New batch supplier delivery (Restock)</option>
                  <option value="Damaged packaging during storage">Damaged packaging during storage (Defective)</option>
                  <option value="Expired item safe disposal">Expired item safe disposal (Loss)</option>
                  <option value="Inventory physical count reconciliation">Physical inventory count reconciliation (Audit)</option>
                  <option value="Customer returns back to shelf">Customer return inspected and restocked</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" disabled={adjustLoading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                  {adjustLoading ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
                </button>
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn-secondary" style={{ padding: '11px 18px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT PRODUCT MODAL ────────────────────────────────────────── */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>
                {editingProduct ? `Edit Inventory Item: ${editingProduct.name}` : 'Add New Inventory Item'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productFormError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {productFormError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Product Name *</label>
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Fresh Cavendish Bananas" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Description</label>
                <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Item description and specifications" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Category</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                >
                  <option value="">— Select Category —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Unit Price (Rs.) *</label>
                  <input type="number" step="0.01" required value={formPrice} onChange={(e) => setFormPrice(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Unit of Measure</label>
                  <input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="e.g. kg, pack, 1L bottle" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Stock Quantity *</label>
                  <input type="number" required value={formStock} onChange={(e) => setFormStock(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Reorder Threshold Level *</label>
                  <input type="number" required value={formReorder} onChange={(e) => setFormReorder(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Image URL</label>
                <input placeholder="https://..." value={formImg} onChange={(e) => setFormImg(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" disabled={productFormLoading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                  {productFormLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Inventory'}
                </button>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-secondary" style={{ padding: '11px 18px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
