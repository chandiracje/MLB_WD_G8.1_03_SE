import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IconX, IconCheck, IconClock, IconTruck, IconPackage, IconTrash, IconAlert } from './Icons';

export const OrderTrackerModal = ({ isOpen, onClose, initialOrders = [], defaultTrackingCode = '' }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTracking, setSearchTracking] = useState(defaultTrackingCode || '');

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'CANCEL' | 'DELETE' | null
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleCancelSelectedOrder = async () => {
    if (!selectedOrder?.id) return;
    setIsProcessingAction(true);
    setActionFeedback(null);
    try {
      const res = await api.cancelOrder(selectedOrder.id);
      const updated = res.order || { ...selectedOrder, status: 'CANCELLED' };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setActionFeedback({ type: 'success', text: `Order #${selectedOrder.id} cancelled. Stock restored to inventory.` });
      setConfirmAction(null);
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message || 'Failed to cancel order.' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteSelectedOrder = async () => {
    if (!selectedOrder?.id) return;
    setIsProcessingAction(true);
    setActionFeedback(null);
    try {
      await api.deleteOrder(selectedOrder.id);
      const remaining = orders.filter(o => o.id !== selectedOrder.id);
      setOrders(remaining);
      setSelectedOrder(remaining.length > 0 ? remaining[0] : null);
      setActionFeedback({ type: 'success', text: `Order #${selectedOrder.id} permanently deleted from history.` });
      setConfirmAction(null);
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message || 'Failed to delete order.' });
    } finally {
      setIsProcessingAction(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
      if (defaultTrackingCode) {
        setSearchTracking(defaultTrackingCode);
        fetchOrderByCode(defaultTrackingCode);
      } else {
        loadOrders();
      }
    }
  }, [isOpen, defaultTrackingCode, user]);

  const fetchOrderByCode = async (code) => {
    if (!code) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const liveOrder = await api.getOrderByTracking(code);
      if (liveOrder && liveOrder.id) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === liveOrder.id);
          return exists ? prev : [liveOrder, ...prev];
        });
        setSelectedOrder(liveOrder);
      }
    } catch (e) {
      loadOrders();
    } finally {
      setIsSearching(false);
    }
  };

  const loadOrders = async () => {
    try {
      const targetUserId = user?.id || (user?.role === 'CUSTOMER' ? 6 : null);
      if (targetUserId) {
        const res = await api.getUserOrders(targetUserId);
        if (res && res.length > 0) {
          setOrders(res);
          setSelectedOrder(res[0]);
          return;
        }
      }
      // If initialOrders has newly placed orders
      if (initialOrders && initialOrders.length > 0) {
        setOrders(initialOrders);
        setSelectedOrder(initialOrders[0]);
      }
    } catch (e) {
      if (initialOrders && initialOrders.length > 0) {
        setOrders(initialOrders);
        setSelectedOrder(initialOrders[0]);
      }
    }
  };

  const handleSearchTracking = async (e) => {
    if (e) e.preventDefault();
    const code = searchTracking.trim();
    if (!code) return;

    setSearchError('');
    setIsSearching(true);
    try {
      // Direct live search from database
      const liveOrder = await api.getOrderByTracking(code);
      if (liveOrder && liveOrder.id) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === liveOrder.id);
          return exists ? prev : [liveOrder, ...prev];
        });
        setSelectedOrder(liveOrder);
        setSearchTracking('');
        return;
      }
    } catch (err) {
      // Local match fallback
      const localMatch = orders.find(o => o.trackingNumber?.toLowerCase().includes(code.toLowerCase()));
      if (localMatch) {
        setSelectedOrder(localMatch);
      } else {
        setSearchError('No order found with tracking code: ' + code);
      }
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Order received & confirmed' },
    { key: 'CONFIRMED', label: 'Processing', desc: 'Items checked in store' },
    { key: 'PACKED', label: 'Packed', desc: 'Packed into freshness bags' },
    { key: 'SHIPPED', label: 'Out for Delivery', desc: 'Rider on the way' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Successfully handed over' }
  ];

  const getStepIndex = (status) => {
    const idx = steps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentIdx = selectedOrder ? getStepIndex(selectedOrder.status) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Track Your Orders</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time delivery updates directly from database</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <IconX size={20} />
          </button>
        </div>

        {/* Order Selector / Search */}
        <form onSubmit={handleSearchTracking} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input 
            type="text" 
            placeholder="Search by Tracking Code (e.g. LK-XXXXXXXX)..."
            value={searchTracking}
            onChange={(e) => setSearchTracking(e.target.value)}
            style={{ flex: '1', padding: '8px 12px', fontSize: '0.9rem' }}
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="btn-primary"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && (
          <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '14px' }}>
            ⚠️ {searchError}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <IconPackage size={40} className="text-muted" />
            <h3 style={{ marginTop: '12px', color: 'var(--text-main)' }}>No orders found yet</h3>
            <p style={{ fontSize: '0.85rem' }}>Place your first grocery order to start live tracking!</p>
          </div>
        ) : (
          <div>
            {/* Orders Tab Row */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
              {orders.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: selectedOrder?.id === ord.id ? 'var(--primary)' : 'var(--bg-main)',
                    color: selectedOrder?.id === ord.id ? 'white' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Order #{ord.id} ({ord.status})
                </button>
              ))}
            </div>

            {selectedOrder && (
              <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>TRACKING CODE</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                      {selectedOrder.trackingNumber || `LK-ORD-${selectedOrder.id}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL AMOUNT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      Rs. {Number(selectedOrder.totalAmount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Action Feedback Banner */}
                {actionFeedback && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    marginBottom: '14px',
                    background: actionFeedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: actionFeedback.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${actionFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{actionFeedback.text}</span>
                    <button 
                      onClick={() => setActionFeedback(null)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Cancelled Alert Banner */}
                {(selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'REFUNDED') && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>✕</span>
                    <div>
                      <strong>Order is Cancelled ({selectedOrder.status})</strong>
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                        This order was cancelled. Reserved supermarket stock has been returned to store inventory.
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Milestones Stepper (only if not cancelled) */}
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'REFUNDED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
                    {steps.map((step, idx) => {
                      const isPassed = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isPassed ? 'var(--primary)' : 'var(--border)',
                            color: isPassed ? 'white' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                            boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none'
                          }}>
                            {isPassed ? <IconCheck size={16} /> : idx + 1}
                          </div>
                          <div style={{ flex: '1' }}>
                            <div style={{ fontWeight: isPassed ? '700' : '500', color: isPassed ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                              {step.label}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>📍 <strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}</div>
                  {selectedOrder.deliverySlot && <div>⏰ <strong>Delivery Slot:</strong> {selectedOrder.deliverySlot}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span>💳 <strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'Credit / Debit Card'}</span>
                    <span className={`badge ${selectedOrder.paymentStatus === 'PENDING_COD' ? 'badge-warning' : 'badge-success'}`}>
                      {selectedOrder.paymentStatus === 'PENDING_COD' ? 'Pay on Delivery' : 'Paid Online'}
                    </span>
                  </div>
                </div>

                {/* Tracker Order Actions (Cancel or Delete) */}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px' }}>
                  {confirmAction ? (
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {confirmAction === 'CANCEL' ? 'Confirm Order Cancellation' : 'Confirm Order Deletion'}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                        {confirmAction === 'CANCEL'
                          ? 'Cancel Order #' + selectedOrder.id + '? Any reserved stock will be returned to inventory immediately.'
                          : 'Permanently remove Order #' + selectedOrder.id + ' from your tracking history? This cannot be undone.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={isProcessingAction}
                          onClick={() => setConfirmAction(null)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={confirmAction === 'CANCEL' ? handleCancelSelectedOrder : handleDeleteSelectedOrder}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            borderRadius: 'var(--radius-md)',
                            background: confirmAction === 'CANCEL' ? '#ea580c' : '#dc2626',
                            color: '#fff',
                            border: 'none',
                            cursor: isProcessingAction ? 'not-allowed' : 'pointer',
                            fontWeight: '700'
                          }}
                        >
                          {isProcessingAction ? 'Processing...' : confirmAction === 'CANCEL' ? 'Yes, Cancel' : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(selectedOrder.status) ? (
                        <button
                          type="button"
                          onClick={() => setConfirmAction('DELETE')}
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            background: '#fef2f2',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          title="Permanently remove order from tracking"
                        >
                          <IconTrash size={15} /> Delete Order
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmAction('CANCEL')}
                          style={{
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            background: '#fff1f2',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          title="Cancel active order"
                        >
                          <IconX size={15} /> Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
