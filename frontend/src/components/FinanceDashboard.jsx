import React, { useState, useEffect } from 'react';
import { api, initialPromotions } from '../services/api';
import { useCart } from '../context/CartContext';
import { 
  IconDollar, 
  IconBarChart, 
  IconCheck, 
  IconX, 
  IconPlus, 
  IconTrash, 
  IconEdit, 
  IconTag, 
  IconClock, 
  IconAlert,
  IconSearch
} from './Icons';

export const FinanceDashboard = () => {
  const { refreshPromotions } = useCart();

  // Tab State
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'campaigns'

  // Ledger State
  const [transactions, setTransactions] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Campaigns State
  const [promotions, setPromotions] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [searchPromo, setSearchPromo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal State for Campaign Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountPercentage: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmPromo, setDeleteConfirmPromo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadLiveOrders();
    loadPromotionsList();
  }, []);

  const loadLiveOrders = async () => {
    try {
      const orders = await api.getAllOrders();
      if (orders) {
        const mapped = orders.map(o => ({
          id: `TXN-${o.id + 9000}`,
          orderId: o.id,
          customer: o.user?.name || 'Registered Customer',
          customerEmail: o.user?.email || 'N/A',
          customerPhone: o.user?.phone || 'N/A',
          amount: Number(o.totalAmount),
          method: o.paymentMethod || 'Credit / Debit Card',
          status: o.paymentStatus || (o.status === 'CANCELLED' ? 'REFUNDED' : 'PAID'),
          date: o.orderDate ? new Date(o.orderDate).toLocaleString() : 'Recent'
        }));
        setTransactions(mapped);
      }
    } catch (e) {
      console.warn("Could not fetch orders for finance:", e.message);
    }
  };

  const loadPromotionsList = async () => {
    setLoadingPromos(true);
    try {
      const data = await api.getAllPromotions();
      if (Array.isArray(data) && data.length > 0) {
        setPromotions(data);
      } else {
        // Fallback to active promotions or initial if empty
        const activeData = await api.getPromotions();
        if (Array.isArray(activeData) && activeData.length > 0) {
          setPromotions(activeData);
        } else {
          setPromotions(initialPromotions || []);
        }
      }
    } catch (e) {
      console.warn("Could not fetch promotions from API, using fallback:", e.message);
      setPromotions(initialPromotions || []);
    } finally {
      setLoadingPromos(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 14);

    setEditingPromo(null);
    setFormData({
      name: '',
      code: '',
      discountPercentage: '15',
      description: '',
      startDate: now.toISOString().slice(0, 16),
      endDate: nextWeek.toISOString().slice(0, 16),
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name || '',
      code: promo.code || '',
      discountPercentage: promo.discountPercentage ? String(promo.discountPercentage) : '10',
      description: promo.description || '',
      startDate: promo.startDate ? promo.startDate.slice(0, 16) : '',
      endDate: promo.endDate ? promo.endDate.slice(0, 16) : '',
      isActive: promo.isActive !== false
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save (Create or Update) Promotion
  const handleSavePromotion = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Campaign name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Voucher code is required (e.g. SUMMER20).');
      return;
    }
    const discount = parseFloat(formData.discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      setFormError('Discount percentage must be between 1% and 100%.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      discountPercentage: discount,
      description: formData.description.trim(),
      startDate: formData.startDate ? formData.startDate : new Date().toISOString(),
      endDate: formData.endDate ? formData.endDate : new Date(Date.now() + 14 * 86400000).toISOString(),
      isActive: Boolean(formData.isActive)
    };

    try {
      if (editingPromo) {
        await api.updatePromotion(editingPromo.id, payload);
        showToast(`Campaign "${payload.name}" updated successfully!`);
      } else {
        await api.createPromotion(payload);
        showToast(`Campaign "${payload.name}" launched successfully!`);
      }
      setIsModalOpen(false);
      await loadPromotionsList();
      if (refreshPromotions) refreshPromotions();
    } catch (err) {
      console.error("Save promotion failed:", err);
      // Local optimistic fallback
      if (editingPromo) {
        setPromotions(prev => prev.map(p => p.id === editingPromo.id ? { ...p, ...payload } : p));
        showToast(`Campaign "${payload.name}" updated locally!`);
      } else {
        const newEntry = { id: Date.now(), ...payload };
        setPromotions(prev => [newEntry, ...prev]);
        showToast(`Campaign "${payload.name}" added locally!`);
      }
      setIsModalOpen(false);
      if (refreshPromotions) refreshPromotions();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle campaign active status
  const handleToggleActive = async (promo) => {
    const updatedStatus = !promo.isActive;
    try {
      await api.updatePromotion(promo.id, { ...promo, isActive: updatedStatus });
      setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: updatedStatus } : p));
      showToast(`Campaign "${promo.name}" is now ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}`);
      if (refreshPromotions) refreshPromotions();
    } catch (e) {
      // Local fallback
      setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: updatedStatus } : p));
      showToast(`Campaign "${promo.name}" status updated locally`);
      if (refreshPromotions) refreshPromotions();
    }
  };

  // Confirm delete promotion
  const handleDeletePromotion = async () => {
    if (!deleteConfirmPromo) return;
    try {
      await api.deletePromotion(deleteConfirmPromo.id);
      showToast(`Campaign "${deleteConfirmPromo.name}" deleted successfully.`);
      setPromotions(prev => prev.filter(p => p.id !== deleteConfirmPromo.id));
      if (refreshPromotions) refreshPromotions();
    } catch (e) {
      // Local fallback
      setPromotions(prev => prev.filter(p => p.id !== deleteConfirmPromo.id));
      showToast(`Campaign deleted locally.`);
      if (refreshPromotions) refreshPromotions();
    } finally {
      setDeleteConfirmPromo(null);
    }
  };

  // Filtering promotions
  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = !searchPromo || 
      p.name?.toLowerCase().includes(searchPromo.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchPromo.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchPromo.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') return p.isActive !== false;
    if (statusFilter === 'INACTIVE') return p.isActive === false;
    return true;
  });

  const totalCollected = transactions.filter(t => t.status !== 'REFUNDED').reduce((acc, t) => acc + t.amount, 0);
  const totalRefunded = transactions.filter(t => t.status === 'REFUNDED').reduce((acc, t) => acc + t.amount, 0);
  const activeCount = promotions.filter(p => p.isActive !== false).length;
  const maxDiscount = promotions.length > 0 
    ? Math.max(...promotions.map(p => Number(p.discountPercentage) || 0)) 
    : 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toastMessage.type === 'danger' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toastMessage.type === 'danger' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header & Subtab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>
              Finance & Commercial Operations
            </h1>
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.15)', 
              color: '#10b981', 
              fontSize: '0.75rem', 
              fontWeight: '800', 
              padding: '3px 8px', 
              borderRadius: '6px' 
            }}>
              OFFICIAL
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', marginBottom: 0 }}>
            Revenue monitoring, customer payment ledger, tax invoicing, and store promotional marketing campaigns
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: 'var(--bg-hover)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'ledger' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'ledger' ? 'white' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <IconDollar size={16} />
            <span>Payment Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'campaigns' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'campaigns' ? 'white' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <IconTag size={16} />
            <span>Promotional Campaigns</span>
            <span style={{ 
              background: activeTab === 'campaigns' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)', 
              color: activeTab === 'campaigns' ? 'white' : 'var(--text-main)', 
              padding: '1px 6px', 
              borderRadius: '10px', 
              fontSize: '0.75rem' 
            }}>
              {promotions.length}
            </span>
          </button>
        </div>
      </div>

      {/* ──────────────── TAB 1: PAYMENT LEDGER ──────────────── */}
      {activeTab === 'ledger' && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>TOTAL REVENUE COLLECTED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16a34a' }}>Rs. {totalCollected.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>Verified card, digital wallet & cash receipts</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>TOTAL REFUNDS PROCESSED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#dc2626' }}>Rs. {totalRefunded.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Approved return disputes</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>TOTAL TRANSACTIONS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{transactions.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px' }}>Settled orders across all payment channels</div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Customer Payment Transaction Ledger</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Showing {transactions.length} settlement records</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Txn ID</th>
                  <th style={{ padding: '10px' }}>Order</th>
                  <th style={{ padding: '10px' }}>Customer</th>
                  <th style={{ padding: '10px' }}>Payment Method</th>
                  <th style={{ padding: '10px' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No payment transactions recorded in the ledger yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '700', fontFamily: 'monospace' }}>{t.id}</td>
                      <td style={{ padding: '10px' }}>#{t.orderId}</td>
                      <td style={{ padding: '10px' }}>{t.customer}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{t.method}</td>
                      <td style={{ padding: '10px', fontWeight: '800' }}>Rs. {Number(t.amount).toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${t.status === 'REFUNDED' ? 'badge-danger' : t.status === 'PENDING_COD' ? 'badge-warning' : 'badge-success'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button 
                          onClick={() => setSelectedInvoice(t)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ──────────────── TAB 2: PROMOTIONAL CAMPAIGNS ──────────────── */}
      {activeTab === 'campaigns' && (
        <>
          {/* Promotion KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>TOTAL CAMPAIGNS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{promotions.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Configured discount offers</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>ACTIVE IN STOREFRONT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16a34a' }}>{activeCount} Live</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>Currently available for customer carts</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>MAX SAVINGS OFFERED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0284c7' }}>{maxDiscount}% OFF</div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px' }}>Peak promotional campaign discount</div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: '1', maxWidth: '340px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <IconSearch size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search campaign by name or code..."
                  value={searchPromo}
                  onChange={(e) => setSearchPromo(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '34px', fontSize: '0.88rem' }}
                />
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: `1px solid ${statusFilter === status ? 'var(--primary)' : 'var(--border)'}`,
                      background: statusFilter === status ? 'var(--primary)' : 'transparent',
                      color: statusFilter === status ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Live Only' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOpenCreate}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', cursor: 'pointer' }}
            >
              <IconPlus size={16} />
              <span>Create Campaign</span>
            </button>
          </div>

          {/* Promotions Table */}
          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Promotional Campaign Directory</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing {filteredPromotions.length} of {promotions.length} campaigns
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 10px' }}>Campaign Name & Details</th>
                  <th style={{ padding: '12px 10px' }}>Voucher Code</th>
                  <th style={{ padding: '12px 10px' }}>Discount</th>
                  <th style={{ padding: '12px 10px' }}>Validity Window</th>
                  <th style={{ padding: '12px 10px' }}>Storefront Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {loadingPromos ? "Loading promotional campaigns..." : "No promotional campaigns match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredPromotions.map(promo => {
                    const isLive = promo.isActive !== false;
                    const startDateStr = promo.startDate ? new Date(promo.startDate).toLocaleDateString() : 'N/A';
                    const endDateStr = promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'Ongoing';

                    return (
                      <tr key={promo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {promo.name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', maxWidth: '300px' }}>
                            {promo.description || 'No campaign description'}
                          </div>
                        </td>

                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: '800', 
                            fontSize: '0.9rem', 
                            color: 'var(--primary)',
                            background: 'var(--bg-hover)', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            border: '1px dashed var(--primary)',
                            display: 'inline-block'
                          }}>
                            {promo.code || `PROMO${promo.id}`}
                          </span>
                        </td>

                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ 
                            background: '#dcfce7', 
                            color: '#15803d', 
                            fontSize: '0.8rem', 
                            fontWeight: '800', 
                            padding: '3px 8px', 
                            borderRadius: '20px',
                            display: 'inline-block'
                          }}>
                            🔥 {promo.discountPercentage}% OFF
                          </span>
                        </td>

                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <div>From: <strong>{startDateStr}</strong></div>
                          <div>To: <strong>{endDateStr}</strong></div>
                        </td>

                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge ${isLive ? 'badge-success' : 'badge-danger'}`}>
                              {isLive ? 'LIVE' : 'INACTIVE'}
                            </span>
                            <button
                              onClick={() => handleToggleActive(promo)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                              title={isLive ? "Deactivate from store" : "Activate on store"}
                            >
                              {isLive ? 'Pause' : 'Enable'}
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button 
                              onClick={() => handleOpenEdit(promo)}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Campaign"
                            >
                              <IconEdit size={14} />
                              <span>Edit</span>
                            </button>

                            <button 
                              onClick={() => setDeleteConfirmPromo(promo)}
                              className="btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Delete Campaign"
                            >
                              <IconTrash size={14} />
                              <span>Delete</span>
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
        </>
      )}

      {/* ──────────────── CREATE / EDIT PROMOTION MODAL ──────────────── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconTag size={22} className="text-primary" />
                <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0 }}>
                  {editingPromo ? 'Edit Promotional Campaign' : 'Create New Promotional Campaign'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePromotion}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sinhala New Year Mega Harvest"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                      Promo Voucher Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AVURUDU20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="input"
                      style={{ width: '100%', fontFamily: 'monospace', fontWeight: '700' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                      Discount Percentage (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      required
                      placeholder="e.g. 20"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                    Campaign Description
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Provide details about discounts, eligible categories, or conditions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="isActivePromo"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActivePromo" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                    Publish campaign as Live in Storefront immediately
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', cursor: 'pointer' }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 22px', cursor: 'pointer' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingPromo ? 'Update Campaign' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── DELETE CONFIRMATION MODAL ──────────────── */}
      {deleteConfirmPromo && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmPromo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <IconAlert size={24} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Delete Campaign?</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to permanently remove <strong>"{deleteConfirmPromo.name}"</strong> (Code: <code>{deleteConfirmPromo.code}</code>)? Customers will no longer be able to use this voucher code.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmPromo(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePromotion}
                className="btn-danger"
                style={{ padding: '8px 18px', cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── INVOICE TAX RECEIPT MODAL ──────────────── */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', margin: 0 }}>LankaFresh Supermarket</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Customer Purchase Receipt</div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <IconX size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receipt #:</span>
                <strong>{selectedInvoice.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Reference:</span>
                <strong>#{selectedInvoice.orderId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                <span>{selectedInvoice.customer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span>{selectedInvoice.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Channel:</span>
                <span>{selectedInvoice.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                <span className={`badge ${selectedInvoice.status === 'REFUNDED' ? 'badge-danger' : selectedInvoice.status === 'PENDING_COD' ? 'badge-warning' : 'badge-success'}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px', fontSize: '1.1rem' }}>
                <strong>Total Amount:</strong>
                <strong style={{ color: 'var(--primary)' }}>Rs. {Number(selectedInvoice.amount).toFixed(2)}</strong>
              </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '10px', cursor: 'pointer' }}
            >
              🖨️ Print Official Tax Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
