import React, { useState, useEffect } from 'react';
import { api, initialSampleProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconBarChart, IconPackage, IconDollar, IconPlus, IconTrash, IconCheck, IconX, IconAlert, IconBuilding, IconSearch } from './Icons';

export const ManagerDashboard = () => {
  const { demoAccounts } = useAuth();
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, lowStockCount: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'categories', 'suppliers', 'orders', 'staff'

  // Product modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formUnit, setFormUnit] = useState('unit');
  const [formStock, setFormStock] = useState('20');
  const [formReorder, setFormReorder] = useState('10');
  const [formMainCategory, setFormMainCategory] = useState('');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formImg, setFormImg] = useState('');
  const [productFormError, setProductFormError] = useState('');

  // Category modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormParent, setCatFormParent] = useState('');
  const [catFormError, setCatFormError] = useState('');
  const [catActionMsg, setCatActionMsg] = useState('');

  // Supplier modal state
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supFormName, setSupFormName] = useState('');
  const [supFormContact, setSupFormContact] = useState('');
  const [supFormEmail, setSupFormEmail] = useState('');
  const [supFormPhone, setSupFormPhone] = useState('');
  const [supFormAddress, setSupFormAddress] = useState('');
  const [supFormError, setSupFormError] = useState('');
  const [supActionMsg, setSupActionMsg] = useState('');
  const [supSearchTerm, setSupSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const s = await api.getDashboardStats();
      if (s) setStats(s);
    } catch (e) {
      console.warn('Could not fetch stats:', e.message);
    }
    try {
      const p = await api.getProducts();
      setProducts(p || []);
    } catch (e) {
      console.warn('Could not fetch products:', e.message);
    }
    try {
      const o = await api.getAllOrders();
      setOrders(o || []);
    } catch (e) {
      console.warn('Could not fetch orders:', e.message);
    }
    try {
      const c = await api.getCategories();
      setCategories(c || []);
    } catch (e) {
      console.warn('Could not fetch categories:', e.message);
    }
    try {
      const sup = await api.getSuppliers();
      setSuppliers(sup || []);
    } catch (e) {
      console.warn('Could not fetch suppliers:', e.message);
    }
  };

  // Derived data helpers
  const mainCategories = categories.filter(c => !c.parentId);
  const subCategoriesOf = (parentId) => categories.filter(c => c.parentId === parentId);
  const effectiveCategoryId = () => {
    if (formSubCategory) return formSubCategory;
    if (formMainCategory) return formMainCategory;
    return null;
  };

  const filteredSuppliers = suppliers.filter(s => {
    if (!supSearchTerm.trim()) return true;
    const term = supSearchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.contactName && s.contactName.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.address && s.address.toLowerCase().includes(term))
    );
  });

  // ─── Product handlers ───────────────────────────────────────────────────────

  const openAddProduct = () => {
    setEditingProduct(null);
    setFormName(''); setFormDesc(''); setFormPrice('');
    setFormUnit('unit'); setFormStock('20'); setFormReorder('10');
    setFormMainCategory(''); setFormSubCategory(''); setFormImg('');
    setProductFormError('');
    setIsAddModalOpen(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description || '');
    setFormPrice(p.price.toString());
    setFormStock(p.stockQuantity != null ? p.stockQuantity.toString() : '0');
    setFormReorder(p.reorderLevel != null ? p.reorderLevel.toString() : '10');
    setFormUnit(p.unit || 'unit');
    setFormImg(p.imageUrl || '');
    setProductFormError('');

    // Resolve main / sub category from product
    const cat = p.category;
    if (cat) {
      if (cat.parentId) {
        setFormMainCategory(String(cat.parentId));
        setFormSubCategory(String(cat.id));
      } else {
        setFormMainCategory(String(cat.id));
        setFormSubCategory('');
      }
    } else {
      setFormMainCategory(''); setFormSubCategory('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductFormError('');
    if (!formName.trim() || formName.trim().length < 3) {
      setProductFormError('Product name must be at least 3 characters.'); return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      setProductFormError('Price must be a valid positive amount greater than 0.'); return;
    }
    const stock = parseInt(formStock, 10);
    if (isNaN(stock) || stock < 0) {
      setProductFormError('Stock quantity cannot be negative.'); return;
    }
    const reorder = parseInt(formReorder, 10);
    if (isNaN(reorder) || reorder < 1) {
      setProductFormError('Reorder threshold level must be at least 1.'); return;
    }

    const productPayload = {
      name: formName.trim(),
      description: formDesc.trim(),
      price,
      unit: formUnit.trim() || 'unit',
      stockQuantity: stock,
      reorderLevel: reorder,
      imageUrl: formImg.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'
    };

    const catId = effectiveCategoryId();

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productPayload, catId);
      } else {
        await api.createProduct(productPayload, catId);
      }
      loadData();
      setIsAddModalOpen(false);
      setEditingProduct(null);
      setProductFormError('');
    } catch (err) {
      setProductFormError(err.message || 'Save product failed.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to discontinue this product?')) {
      try {
        await api.deleteProduct(id);
        loadData();
      } catch (e) {
        console.error('Delete product failed:', e);
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (e) {
      console.error('Update order status failed:', e);
    }
  };

  // ─── Category handlers ──────────────────────────────────────────────────────

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatFormName(''); setCatFormParent(''); setCatFormError('');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatFormName(cat.name);
    setCatFormParent(cat.parentId ? String(cat.parentId) : '');
    setCatFormError('');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatFormError('');
    if (!catFormName.trim()) { setCatFormError('Category name is required.'); return; }
    try {
      const payload = {
        name: catFormName.trim(),
        parentId: catFormParent ? Number(catFormParent) : null
      };
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
      } else {
        await api.createCategory(payload);
      }
      await loadData();
      setIsCatModalOpen(false);
      setCatActionMsg(editingCategory ? 'Category updated!' : 'Category created!');
      setTimeout(() => setCatActionMsg(''), 3000);
    } catch (err) {
      setCatFormError(err.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (cat) => {
    const subCount = subCategoriesOf(cat.id).length;
    const productCount = products.filter(p => p.category?.id === cat.id).length;

    if (subCount > 0) {
      alert(`Cannot delete "${cat.name}" — it has ${subCount} sub-category(s). Delete them first.`);
      return;
    }
    if (productCount > 0) {
      alert(`Cannot delete "${cat.name}" — ${productCount} product(s) are assigned to it. Reassign them first.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      await loadData();
      setCatActionMsg(`Category "${cat.name}" deleted.`);
      setTimeout(() => setCatActionMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  // ─── Supplier handlers ──────────────────────────────────────────────────────
  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupFormName('');
    setSupFormContact('');
    setSupFormEmail('');
    setSupFormPhone('');
    setSupFormAddress('');
    setSupFormError('');
    setIsSupModalOpen(true);
  };

  const openEditSupplier = (s) => {
    setEditingSupplier(s);
    setSupFormName(s.name || '');
    setSupFormContact(s.contactName || '');
    setSupFormEmail(s.email || '');
    setSupFormPhone(s.phone || '');
    setSupFormAddress(s.address || '');
    setSupFormError('');
    setIsSupModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setSupFormError('');
    if (!supFormName.trim()) {
      setSupFormError('Supplier company name is required.');
      return;
    }

    const payload = {
      name: supFormName.trim(),
      contactName: supFormContact.trim(),
      email: supFormEmail.trim(),
      phone: supFormPhone.trim(),
      address: supFormAddress.trim()
    };

    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, payload);
        setSupActionMsg(`Supplier "${payload.name}" updated successfully!`);
      } else {
        await api.createSupplier(payload);
        setSupActionMsg(`Supplier "${payload.name}" registered successfully!`);
      }
      await loadData();
      setIsSupModalOpen(false);
      setEditingSupplier(null);
      setTimeout(() => setSupActionMsg(''), 4000);
    } catch (err) {
      setSupFormError(err.message || 'Failed to save supplier details.');
    }
  };

  const handleDeleteSupplier = async (s) => {
    if (!window.confirm(`Are you sure you want to remove supplier "${s.name}"?`)) {
      return;
    }
    try {
      await api.deleteSupplier(s.id);
      await loadData();
      setSupActionMsg(`Supplier "${s.name}" removed successfully.`);
      setTimeout(() => setSupActionMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete supplier.');
    }
  };

  // ─── Tab style helper ───────────────────────────────────────────────────────
  const tabBtn = (key, label) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: '8px 18px',
        borderRadius: 'var(--radius-md)',
        fontWeight: '600',
        background: activeTab === key ? 'var(--primary)' : 'var(--bg-card)',
        color: activeTab === key ? 'white' : 'var(--text-main)',
        border: '1px solid var(--border)'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Store Manager Command Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full administrative oversight of products, categories, inventory, orders and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddProduct} className="btn-primary">
            <IconPlus size={18} /> Add New Product
          </button>
          <button
            onClick={openAddCategory}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontWeight: '600' }}
          >
            <IconPlus size={16} /> Add Category
          </button>
          <button
            onClick={openAddSupplier}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontWeight: '600' }}
          >
            <IconBuilding size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>TOTAL SALES REVENUE</span>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}><IconDollar size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>Rs. {Number(stats.totalRevenue).toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', fontWeight: '600' }}>↑ +14.2% this week</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>TOTAL ORDERS PLACED</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}><IconPackage size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>{orders.length || stats.totalOrders}</div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px', fontWeight: '600' }}>Active supermarket orders</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>ACTIVE CATALOG ITEMS</span>
            <div style={{ background: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '8px' }}><IconBarChart size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main)' }}>{products.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px', fontWeight: '600' }}>Across {mainCategories.length} categories</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>LOW STOCK ALERTS</span>
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '6px', borderRadius: '8px' }}><IconAlert size={18} /></div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#dc2626' }}>
            {products.filter(p => p.stockQuantity <= (p.reorderLevel || 10)).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>Items need replenishment</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabBtn('overview', `Product Catalog (${products.length})`)}
        {tabBtn('categories', `Categories (${categories.length})`)}
        {tabBtn('suppliers', `Suppliers (${suppliers.length})`)}
        {tabBtn('orders', `Customer Orders (${orders.length})`)}
        {tabBtn('staff', 'Staff & Access Controls')}
      </div>

      {/* Tab: Product Catalog */}
      {activeTab === 'overview' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Product</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Price</th>
                <th style={{ padding: '10px' }}>Stock</th>
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
                  <td style={{ padding: '10px' }}>
                    {p.category?.parentName
                      ? <span>{p.category.parentName} <span style={{ color: 'var(--text-muted)' }}>›</span> {p.category.name}</span>
                      : (p.category?.name || p.categoryName || '—')}
                  </td>
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
                    <button onClick={() => openEditProduct(p)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '6px' }}>Edit</button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ color: '#ef4444', padding: '4px 8px' }} title="Discontinue">
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Categories Management */}
      {activeTab === 'categories' && (
        <div>
          {catActionMsg && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '14px', fontWeight: '600', fontSize: '0.9rem' }}>
              ✓ {catActionMsg}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {mainCategories.map(cat => {
              const subs = subCategoriesOf(cat.id);
              return (
                <div key={cat.id} className="glass-card" style={{ padding: '18px' }}>
                  {/* Main Category Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{cat.name}</span>
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
                        Main Category
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        style={{ color: '#ef4444', padding: '3px 8px' }}
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Sub-categories */}
                  <div style={{ paddingLeft: '12px', borderLeft: '2px solid var(--border)' }}>
                    {subs.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '4px' }}>No sub-categories</div>
                    ) : (
                      subs.map(sub => (
                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            <span style={{ marginRight: '6px', color: 'var(--text-muted)' }}>›</span>
                            {sub.name}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => openEditCategory(sub)}
                              className="btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(sub)}
                              style={{ color: '#ef4444', padding: '2px 6px' }}
                            >
                              <IconTrash size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {/* Add Sub-category quick link */}
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCatFormName('');
                        setCatFormParent(String(cat.id));
                        setCatFormError('');
                        setIsCatModalOpen(true);
                      }}
                      style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                    >
                      + Add Sub-category
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Suppliers Management */}
      {activeTab === 'suppliers' && (
        <div>
          {supActionMsg && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600', fontSize: '0.9rem' }}>
              ✓ {supActionMsg}
            </div>
          )}

          {/* Search bar & Add button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '450px' }}>
              <input
                type="text"
                placeholder="Search suppliers by name, contact, phone, or address..."
                value={supSearchTerm}
                onChange={(e) => setSupSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', paddingLeft: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>

            <button onClick={openAddSupplier} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconPlus size={16} /> Register New Supplier
            </button>
          </div>

          {/* Suppliers Cards Grid */}
          {filteredSuppliers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>🏢</div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                {supSearchTerm ? 'No matching suppliers found' : 'No suppliers registered yet'}
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                {supSearchTerm ? 'Try adjusting your search criteria.' : 'Add your farm or merchandise suppliers to maintain contact details and restock inventory.'}
              </p>
              {!supSearchTerm && (
                <button onClick={openAddSupplier} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconPlus size={16} /> Add First Supplier
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredSuppliers.map(s => (
                <div key={s.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
                          <IconBuilding size={20} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{s.name}</h4>
                          <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
                            Supplier #{s.id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditSupplier(s)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s)}
                          style={{ color: '#ef4444', padding: '4px 8px', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', borderRadius: '4px' }}
                          title="Delete Supplier"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600', width: '75px' }}>Contact:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{s.contactName || '—'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600', width: '75px' }}>Phone:</span>
                        <span>{s.phone ? <a href={`tel:${s.phone}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{s.phone}</a> : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600', width: '75px' }}>Email:</span>
                        <span>{s.email ? <a href={`mailto:${s.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{s.email}</a> : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600', width: '75px' }}>Address:</span>
                        <span style={{ color: 'var(--text-muted)' }}>{s.address || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
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
                  <td style={{ padding: '10px', fontWeight: '700', color: 'var(--primary)' }}>Rs. {Number(o.totalAmount).toFixed(2)}</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-success">{o.status}</span></td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
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

      {/* Tab: Staff */}
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

      {/* ─── Add / Edit Product Modal ─────────────────────────────────────────── */}
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

              {/* Category Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Main Category</label>
                  <select
                    value={formMainCategory}
                    onChange={(e) => { setFormMainCategory(e.target.value); setFormSubCategory(''); }}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  >
                    <option value="">— Select Category —</option>
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                    Sub-Category
                    <span style={{ fontWeight: '400', color: 'var(--text-muted)', marginLeft: '4px' }}>(optional)</span>
                  </label>
                  <select
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    disabled={!formMainCategory || subCategoriesOf(Number(formMainCategory)).length === 0}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', opacity: (!formMainCategory || subCategoriesOf(Number(formMainCategory)).length === 0) ? 0.5 : 1 }}
                  >
                    <option value="">— None —</option>
                    {formMainCategory && subCategoriesOf(Number(formMainCategory)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
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
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Category Modal ────────────────────────────────────────── */}
      {isCatModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCatModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => setIsCatModalOpen(false)}><IconX size={20} /></button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {catFormError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {catFormError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Category Name *</label>
                <input
                  required
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  placeholder="e.g. Organic Fruits"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Parent Category
                  <span style={{ fontWeight: '400', color: 'var(--text-muted)', marginLeft: '4px' }}>(leave empty for main category)</span>
                </label>
                <select
                  value={catFormParent}
                  onChange={(e) => setCatFormParent(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                >
                  <option value="">— None (Main Category) —</option>
                  {mainCategories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="btn-secondary" style={{ padding: '11px 18px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Supplier Modal ────────────────────────────────────────── */}
      {isSupModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSupModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconBuilding size={20} />
                {editingSupplier ? 'Edit Supplier Details' : 'Register New Supplier'}
              </h2>
              <button onClick={() => setIsSupModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {supFormError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {supFormError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Company / Business Name *
                </label>
                <input
                  required
                  value={supFormName}
                  onChange={(e) => setSupFormName(e.target.value)}
                  placeholder="e.g. Lanka Fresh Farms (Pvt) Ltd"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Contact Representative Name
                </label>
                <input
                  value={supFormContact}
                  onChange={(e) => setSupFormContact(e.target.value)}
                  placeholder="e.g. Ruwan Perera"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={supFormPhone}
                    onChange={(e) => setSupFormPhone(e.target.value)}
                    placeholder="e.g. 0112345678"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={supFormEmail}
                    onChange={(e) => setSupFormEmail(e.target.value)}
                    placeholder="e.g. supply@lankafresh.lk"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Warehouse / Physical Address
                </label>
                <textarea
                  rows={2}
                  value={supFormAddress}
                  onChange={(e) => setSupFormAddress(e.target.value)}
                  placeholder="e.g. 120/4 High Level Road, Maharagama"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                  {editingSupplier ? 'Update Supplier' : 'Register Supplier'}
                </button>
                <button type="button" onClick={() => setIsSupModalOpen(false)} className="btn-secondary" style={{ padding: '11px 18px' }}>
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
