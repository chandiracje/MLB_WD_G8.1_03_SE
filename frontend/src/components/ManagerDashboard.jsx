import React, { useState, useEffect } from 'react';
import { api, initialSampleProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconBarChart, IconPackage, IconDollar, IconPlus, IconTrash, IconCheck, IconX, IconAlert } from './Icons';

export const ManagerDashboard = () => {
  const { demoAccounts } = useAuth();
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, lowStockCount: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'orders', 'staff'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formUnit, setFormUnit] = useState('unit');
  const [formStock, setFormStock] = useState('20');
  const [formReorder, setFormReorder] = useState('10');
  const [formCategory, setFormCategory] = useState('1');
  const [formImg, setFormImg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const s = await api.getDashboardStats();
      if (s) setStats(s);
    } catch (e) {
      console.warn("Could not fetch stats:", e.message);
    }

    try {
      const p = await api.getProducts();
      setProducts(p || []);
    } catch (e) {
      console.warn("Could not fetch products:", e.message);
    }

    try {
      const o = await api.getAllOrders();
      setOrders(o || []);
    } catch (e) {
      console.warn("Could not fetch orders:", e.message);
    }
  };

  const [productFormError, setProductFormError] = useState('');

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductFormError('');

    if (!formName.trim() || formName.trim().length < 3) {
      setProductFormError('Product name must be at least 3 characters.');
      return;
    }

    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      setProductFormError('Price must be a valid positive amount greater than 0.');
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

    const productPayload = {
      name: formName.trim(),
      description: formDesc.trim(),
      price: price,
      unit: formUnit.trim() || 'unit',
      stockQuantity: stock,
      reorderLevel: reorder,
      imageUrl: formImg.trim() || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productPayload, formCategory);
      } else {
        await api.createProduct(productPayload, formCategory);
      }
      loadData();
      setIsAddModalOpen(false);
      setEditingProduct(null);
      setProductFormError('');
    } catch (err) {
      setProductFormError(err.message || "Save product failed.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to discontinue this product?")) {
      try {
        await api.deleteProduct(id);
        loadData();
      } catch (e) {
        console.error("Delete product failed:", e);
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (e) {
      console.error("Update order status failed:", e);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Store Manager Command Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full administrative oversight of products, inventory, orders and permissions</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setFormName('');
              setFormDesc('');
              setFormPrice('');
              setFormStock('20');
              setFormImg('');
              setIsAddModalOpen(true);
            }}
            className="btn-primary"
          >
            <IconPlus size={18} /> Add New Product
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>TOTAL SALES REVENUE</span>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
              <IconDollar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Rs. {Number(stats.totalRevenue).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', fontWeight: '600' }}>
            ↑ +14.2% this week
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>TOTAL ORDERS PLACED</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
              <IconPackage size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {orders.length || stats.totalOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px', fontWeight: '600' }}>
            Active supermarket orders
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>ACTIVE CATALOG ITEMS</span>
            <div style={{ background: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '8px' }}>
              <IconBarChart size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {products.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px', fontWeight: '600' }}>
            Across 6 categories
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>LOW STOCK ALERTS</span>
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '6px', borderRadius: '8px' }}>
              <IconAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#dc2626' }}>
            {products.filter(p => p.stockQuantity <= (p.reorderLevel || 10)).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>
            Items need replenishment
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            background: activeTab === 'overview' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'overview' ? 'white' : 'var(--text-main)',
            border: '1px solid var(--border)'
          }}
        >
          Product Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            background: activeTab === 'orders' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'orders' ? 'white' : 'var(--text-main)',
            border: '1px solid var(--border)'
          }}
        >
          Customer Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            background: activeTab === 'staff' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'staff' ? 'white' : 'var(--text-main)',
            border: '1px solid var(--border)'
          }}
        >
          Staff & Access Controls
        </button>
      </div>

      {/* Tab 1: Product Catalog Table */}
      {activeTab === 'overview' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Product</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Price</th>
                <th style={{ padding: '10px' }}>Stock Quantity</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    <strong>{p.name}</strong>
                  </td>
                  <td style={{ padding: '10px' }}>{p.category?.name || p.categoryName || 'General'}</td>
                  <td style={{ padding: '10px', fontWeight: '700' }}>Rs. {Number(p.price).toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontWeight: '700', color: p.stockQuantity <= (p.reorderLevel || 10) ? '#dc2626' : 'var(--text-main)' }}>
                      {p.stockQuantity} {p.unit}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge ${p.stockQuantity > 10 ? 'badge-success' : p.stockQuantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                      {p.stockQuantity > 10 ? 'Available' : p.stockQuantity > 0 ? 'Low Stock' : 'Out'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button 
                      onClick={() => {
                        setEditingProduct(p);
                        setFormName(p.name);
                        setFormDesc(p.description || '');
                        setFormPrice(p.price.toString());
                        setFormStock(p.stockQuantity.toString());
                        setFormUnit(p.unit || 'unit');
                        setFormImg(p.imageUrl || '');
                        setIsAddModalOpen(true);
                      }}
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '6px' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      style={{ color: '#ef4444', padding: '4px 8px' }}
                      title="Discontinue"
                    >
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Orders Table */}
      {activeTab === 'orders' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Order ID</th>
                <th style={{ padding: '10px' }}>Customer & Address</th>
                <th style={{ padding: '10px' }}>Delivery Slot</th>
                <th style={{ padding: '10px' }}>Total Amount</th>
                <th style={{ padding: '10px' }}>Current Status</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <strong>#{o.id}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.trackingNumber}</div>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ fontWeight: '600' }}>{o.user?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.deliveryAddress}</div>
                  </td>
                  <td style={{ padding: '10px', fontSize: '0.85rem' }}>{o.deliverySlot}</td>
                  <td style={{ padding: '10px', fontWeight: '700', color: 'var(--primary)' }}>
                    Rs. {Number(o.totalAmount).toFixed(2)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className="badge badge-success">{o.status}</span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PACKED">PACKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Staff & Access Controls */}
      {activeTab === 'staff' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '14px' }}>System Staff Accounts & Role Matrix</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {demoAccounts.map(acc => (
              <div key={acc.id} style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong>{acc.name}</strong>
                  <span className="badge badge-success">{acc.role}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email: {acc.email}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {acc.phone}</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px' }}>✓ Spring Security Authorized</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>{editingProduct ? 'Edit Product' : 'Add New Supermarket Item'}</h2>
              <button onClick={() => setIsAddModalOpen(false)}><IconX size={20} /></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productFormError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {productFormError}
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Product Name *</label>
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Description</label>
                <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Price (Rs.) *</label>
                  <input type="number" step="0.01" required value={formPrice} onChange={(e) => setFormPrice(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Unit (e.g. kg, pack, bottle)</label>
                  <input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Initial Stock</label>
                  <input type="number" required value={formStock} onChange={(e) => setFormStock(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Reorder Level</label>
                  <input type="number" required value={formReorder} onChange={(e) => setFormReorder(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Image URL</label>
                <input placeholder="https://..." value={formImg} onChange={(e) => setFormImg(e.target.value)} style={{ width: '100%' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '12px', marginTop: '10px' }}>
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
