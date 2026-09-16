import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { 
  IconPackage, IconHeart, IconTruck, IconShield, 
  IconHeadphones, IconClock, IconCheck, IconTrash, 
  IconPlus, IconAlert, IconUser, IconCart, IconX
} from './Icons';

export const CustomerDashboard = ({ onBackToStore, onOpenTracker }) => {
  const { user, updateUser } = useAuth();
  const { addToCart, wishlist, removeFromWishlist, showToast } = useCart();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist' | 'profile' | 'support'
  
  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [actionConfirm, setActionConfirm] = useState(null); // { type: 'CANCEL' | 'DELETE', order: order }
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleConfirmOrderAction = async () => {
    if (!actionConfirm?.order?.id) return;
    const { type, order } = actionConfirm;
    setIsProcessingAction(true);
    try {
      if (type === 'CANCEL') {
        await api.cancelOrder(order.id);
        showToast(`Order #${order.id} cancelled successfully. Inventory restored.`, 'success');
      } else if (type === 'DELETE') {
        await api.deleteOrder(order.id);
        showToast(`Order #${order.id} removed from history.`, 'success');
      }
      setActionConfirm(null);
      await fetchOrders();
    } catch (err) {
      showToast(err.message || `Failed to ${type === 'CANCEL' ? 'cancel' : 'delete'} order`, 'danger');
    } finally {
      setIsProcessingAction(false);
    }
  };


  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Delivery Issue');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [customerReplies, setCustomerReplies] = useState({});
  const [replyingTicketId, setReplyingTicketId] = useState(null);

  const handleSendCustomerReply = async (ticketId) => {
    const text = (customerReplies[ticketId] || '').trim();
    if (!text) return;

    setReplyingTicketId(ticketId);
    try {
      const payload = {
        senderRole: 'CUSTOMER',
        senderName: user?.name || 'Customer',
        message: text
      };
      await api.addTicketReply(ticketId, payload);
      setCustomerReplies(prev => ({ ...prev, [ticketId]: '' }));
      await fetchTickets();
      showToast("Reply sent to customer support!", "success");
    } catch (e) {
      showToast("Failed to send reply: " + e.message, "danger");
    } finally {
      setReplyingTicketId(null);
    }
  };

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Fetch Orders
  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      setLoadingOrders(true);
      const res = await api.getUserOrders(user.id);
      setOrders(res || []);
    } catch (err) {
      console.error("Failed to load user orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Support Tickets
  const fetchTickets = async () => {
    if (!user?.id) return;
    try {
      setLoadingTickets(true);
      const res = await api.getUserTickets(user.id);
      setTickets(res || []);
    } catch (err) {
      console.error("Failed to load customer tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchTickets();
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
    }
  }, [user]);

  // Profile Update Submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!profileName.trim() || profileName.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters.";
    }

    if (profilePhone) {
      const cleanPhone = profilePhone.replace(/[\s-]/g, '');
      if (!/^(?:0|\+94)?7[0-9]{8}$/.test(cleanPhone)) {
        errs.phone = "Enter a valid Sri Lankan mobile (e.g. 0771234567).";
      }
    }

    if (profileAddress && profileAddress.trim().length < 6) {
      errs.address = "Address must be at least 6 characters.";
    }

    if (newPassword) {
      if (!currentPassword) {
        errs.currentPassword = "Enter your current password to set a new password.";
      }
      if (newPassword.length < 6) {
        errs.newPassword = "New password must be at least 6 characters.";
      }
      if (newPassword !== confirmPassword) {
        errs.confirmPassword = "Passwords do not match.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      showToast("Please correct profile errors before saving.", "danger");
      return;
    }

    setSavingProfile(true);
    setProfileErrors({});
    try {
      const updateData = {
        name: profileName.trim(),
        phone: profilePhone.trim(),
        address: profileAddress.trim(),
        currentPassword: currentPassword || null,
        newPassword: newPassword || null
      };

      const updatedUser = await api.updateUserProfile(user.id, updateData);
      if (updateUser) {
        updateUser({
          ...user,
          name: updatedUser.name,
          phone: updatedUser.phone,
          address: updatedUser.address
        });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast("Profile details updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "danger");
    } finally {
      setSavingProfile(false);
    }
  };

  // Create Support Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || newTicketSubject.trim().length < 4) {
      showToast("Subject must be at least 4 characters", "danger");
      return;
    }
    if (!newTicketMessage.trim() || newTicketMessage.trim().length < 10) {
      showToast("Message must be at least 10 characters", "danger");
      return;
    }

    setSubmittingTicket(true);
    try {
      await api.createTicket(user.id, {
        subject: newTicketSubject.trim(),
        category: newTicketCategory,
        message: newTicketMessage.trim()
      });
      showToast("Support ticket created! Our team will respond shortly.", "success");
      setNewTicketSubject('');
      setNewTicketMessage('');
      fetchTickets();
    } catch (err) {
      showToast(err.message || "Failed to create support ticket", "danger");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Calculations for metric cards
  const totalSpent = orders
    .filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  const activeOrdersCount = orders
    .filter(o => ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED'].includes(o.status)).length;

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'ACTIVE') return ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED'].includes(o.status);
    if (orderFilter === 'COMPLETED') return o.status === 'DELIVERED';
    if (orderFilter === 'CANCELLED') return o.status === 'CANCELLED' || o.status === 'REFUNDED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="badge badge-success">✓ Delivered</span>;
      case 'SHIPPED':
        return <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>🚚 Out for Delivery</span>;
      case 'PACKED':
        return <span className="badge badge-warning">📦 Packed</span>;
      case 'CONFIRMED':
        return <span className="badge badge-warning">⏳ Confirmed</span>;
      case 'PLACED':
        return <span className="badge badge-warning">⚡ Processing</span>;
      case 'CANCELLED':
      case 'REFUNDED':
        return <span className="badge badge-danger">✕ Cancelled</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Top Breadcrumb & Return Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBackToStore} 
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
        >
          ← Back to Supermarket Store
        </button>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Customer Account Portal • LankaFresh Retail
        </div>
      </div>

      {/* Customer Profile Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
        color: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.3)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'white',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: '800',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: '800', margin: 0 }}>
                {user?.name || 'Valued Customer'}
              </h1>
              <span style={{
                background: '#fef08a',
                color: '#854d0e',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ⭐ Gold Member
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              {user?.email} {user?.phone ? `• ${user.phone}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IconUser size={16} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPackage size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL ORDERS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>{orders.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconTruck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>ACTIVE DELIVERIES</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4338ca' }}>{activeOrdersCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fce7f3', color: '#be185d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconHeart size={24} filled />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>SAVED WISHLIST</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>{wishlist.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.4rem' }}>Rs.</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL GROCERY SPENT</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
              Rs. {totalSpent.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: '24px',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'transparent',
            fontSize: '0.95rem',
            fontWeight: '700',
            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <IconPackage size={18} /> My Orders & Live Tracking ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'transparent',
            fontSize: '0.95rem',
            fontWeight: '700',
            color: activeTab === 'wishlist' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'wishlist' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <IconHeart size={18} /> Saved Wishlist ({wishlist.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'transparent',
            fontSize: '0.95rem',
            fontWeight: '700',
            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <IconUser size={18} /> Profile & Addresses
        </button>

        <button
          onClick={() => setActiveTab('support')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'transparent',
            fontSize: '0.95rem',
            fontWeight: '700',
            color: activeTab === 'support' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'support' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <IconHeadphones size={18} /> Customer Help Desk ({tickets.length})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ORDERS & TRACKING
         ========================================================================= */}
      {activeTab === 'orders' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    border: '1px solid var(--border)',
                    background: orderFilter === filter ? 'var(--primary)' : 'var(--bg-card)',
                    color: orderFilter === filter ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading your purchase history...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No orders found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                You haven't placed any orders matching this filter yet.
              </p>
              <button onClick={onBackToStore} className="btn-primary" style={{ padding: '10px 20px', margin: '0 auto' }}>
                Start Shopping Fresh Groceries
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="card" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Order Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                          Order #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Placed on {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Recent Order'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                        Rs. {Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {order.paymentMethod || 'Credit / Debit Card'} • {order.paymentStatus === 'PAID' ? '✓ Paid' : 'Cash on delivery'}
                      </div>
                    </div>
                  </div>

                  {/* Order Mid Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px', fontSize: '0.85rem' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>DELIVERY DESTINATION</div>
                      <div style={{ color: 'var(--text-main)' }}>{order.deliveryAddress || 'Standard Address'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                        Slot: {order.deliverySlot || 'Express (Within 60 Mins)'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>TRACKING CODE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', color: 'var(--primary)' }}>
                          {order.trackingNumber || 'LK-PENDING'}
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingNumber);
                            showToast("Tracking code copied to clipboard!", "success");
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                          title="Copy tracking number"
                        >
                          📋
                        </button>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                        Use code to monitor live rider location
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      {['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) ? (
                        <button
                          type="button"
                          onClick={() => setActionConfirm({ type: 'DELETE', order })}
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
                            fontWeight: '600',
                            transition: 'all 0.15s ease'
                          }}
                          title="Permanently remove this order from history"
                        >
                          <IconTrash size={15} /> Delete Order
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActionConfirm({ type: 'CANCEL', order })}
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
                            fontWeight: '600',
                            transition: 'all 0.15s ease'
                          }}
                          title="Cancel order and restore stock"
                        >
                          <IconX size={15} /> Cancel Order
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          if (onOpenTracker) onOpenTracker(order.trackingNumber);
                        }}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <IconTruck size={16} /> Live Track Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SAVED WISHLIST HUB
         ========================================================================= */}
      {activeTab === 'wishlist' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
                My Saved Grocery Wishlist
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Quickly add your staple household items directly into your shopping cart
              </p>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary)' }}>
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
            </span>
          </div>

          {wishlist.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❤️</div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Your Wishlist is Empty</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Tap the heart icon on any product in the store to save it for your next grocery run.
              </p>
              <button onClick={onBackToStore} className="btn-primary" style={{ padding: '10px 20px', margin: '0 auto' }}>
                Browse Fresh Products
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '18px'
            }}>
              {wishlist.map(product => (
                <div 
                  key={product.id} 
                  className="card" 
                  style={{ 
                    padding: '14px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ position: 'relative', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '12px' }}>
                    <img 
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => {
                        removeFromWishlist(product.id);
                        showToast(`Removed ${product.name} from wishlist`, "info");
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        color: '#ef4444'
                      }}
                      title="Remove from wishlist"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                    {product.name}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Unit: {product.unit || '1 Pack'} • Stock: {product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Out of stock'}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                      Rs. {Number(product.price).toFixed(2)}
                    </div>

                    <button
                      onClick={() => {
                        addToCart(product, 1);
                        showToast(`Added ${product.name} to cart!`, "success");
                      }}
                      disabled={product.stockQuantity <= 0}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <IconCart size={14} /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PROFILE & DELIVERY ADDRESSES
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Personal Info & Default Delivery Address */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconUser size={20} /> Personal Profile & Delivery Details
            </h2>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Kasun Perera"
                  style={{ width: '100%', borderColor: profileErrors.name ? '#ef4444' : undefined }}
                />
                {profileErrors.name && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{profileErrors.name}</span>}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Registered Email (Immutable Account ID)
                </label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || ''}
                  style={{ width: '100%', background: 'var(--bg-main)', cursor: 'not-allowed', opacity: 0.7 }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contact support to change your account email.</span>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Contact Phone Number
                </label>
                <input 
                  type="text" 
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="077 123 4567"
                  style={{ width: '100%', borderColor: profileErrors.phone ? '#ef4444' : undefined }}
                />
                {profileErrors.phone && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{profileErrors.phone}</span>}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Default Delivery Address
                </label>
                <textarea 
                  rows={3}
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="House/Apartment No, Street, City..."
                  style={{ width: '100%', resize: 'vertical', borderColor: profileErrors.address ? '#ef4444' : undefined }}
                />
                {profileErrors.address && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{profileErrors.address}</span>}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '6px' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconShield size={16} /> Change Password (Optional)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                      Current Password
                    </label>
                    <input 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', borderColor: profileErrors.currentPassword ? '#ef4444' : undefined }}
                    />
                    {profileErrors.currentPassword && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{profileErrors.currentPassword}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        New Password
                      </label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', borderColor: profileErrors.newPassword ? '#ef4444' : undefined }}
                      />
                      {profileErrors.newPassword && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{profileErrors.newPassword}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        Confirm Password
                      </label>
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', borderColor: profileErrors.confirmPassword ? '#ef4444' : undefined }}
                      />
                      {profileErrors.confirmPassword && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{profileErrors.confirmPassword}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingProfile}
                className="btn-primary"
                style={{ marginTop: '10px', padding: '12px', justifyContent: 'center' }}
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Right Column: Account Security & Loyalty Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> Loyalty Tier & Privileges
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a' }}>✓</span>
                  <span><strong>15% Discount</strong> during Weekend Harvest Specials</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a' }}>✓</span>
                  <span><strong>Priority 60-Minute Express Delivery</strong> dispatch queue</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a' }}>✓</span>
                  <span><strong>Zero Replacement Fee</strong> on fresh produce quality guarantee</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#16a34a' }}>✓</span>
                  <span><strong>Dedicated Customer Care</strong> direct phone line</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-main)' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                Need Help or Have Concerns?
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                Our 24/7 customer resolution desk is available for instant inquiry responses, delivery slot alterations, and refunds.
              </p>
              <button 
                onClick={() => setActiveTab('support')}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                Open Support Desk
              </button>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 4: CUSTOMER SUPPORT & INQUIRIES
         ========================================================================= */}
      {activeTab === 'support' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Create Ticket Form */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconHeadphones size={20} /> Submit a New Inquiry
            </h2>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Inquiry Category
                </label>
                <select 
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Delivery Issue">Delivery Delay or Driver Issue</option>
                  <option value="Quality Issue">Damaged or Expired Item</option>
                  <option value="Billing">Payment & Billing Query</option>
                  <option value="Product Request">Product In-Stock Request</option>
                  <option value="General">Other Customer Feedback</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Subject / Summary *
                </label>
                <input 
                  type="text" 
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="e.g. Missing milk bottle from Order #2"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Detailed Description *
                </label>
                <textarea 
                  rows={4}
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Describe your issue with order number or product details..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingTicket}
                className="btn-primary"
                style={{ padding: '12px', justifyContent: 'center' }}
              >
                {submittingTicket ? 'Submitting Ticket...' : 'Send Inquiry to Support Team'}
              </button>
            </form>
          </div>

          {/* Right Column: Customer Ticket History */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '16px' }}>
              My Past Inquiries ({tickets.length})
            </h3>

            {loadingTickets ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Loading your support history...
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No open or closed support tickets.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Feel free to contact us anytime if you need help!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                {tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    style={{ 
                      padding: '14px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'var(--bg-main)', 
                      border: '1px solid var(--border)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        #{ticket.id} • {ticket.subject}
                      </span>
                      <span className={`badge ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'badge-success' : 'badge-warning'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Category: {ticket.category || 'General'} • {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
                      {ticket.message}
                    </p>

                    {/* Chat Replies Thread */}
                    {ticket.replies && ticket.replies.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary)' }}>
                          💬 Agent Conversation ({ticket.replies.length}):
                        </div>
                        {ticket.replies.map((rep, rIdx) => {
                          const isSupport = rep.senderRole === 'SUPPORT';
                          return (
                            <div 
                              key={rep.id || rIdx} 
                              style={{ 
                                background: isSupport ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)', 
                                border: isSupport ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border)',
                                padding: '8px 12px', 
                                borderRadius: '8px',
                                fontSize: '0.82rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                <strong style={{ color: isSupport ? '#059669' : 'var(--text-main)' }}>
                                  {isSupport ? `🎧 ${rep.senderName || 'Support Agent'}` : 'You'}
                                </strong>
                                <span>{rep.createdAt ? new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              </div>
                              <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>{rep.message}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Customer Reply Input */}
                    {ticket.status !== 'CLOSED' && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Reply back to support agent..."
                          value={customerReplies[ticket.id] || ''}
                          onChange={(e) => setCustomerReplies({ ...customerReplies, [ticket.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendCustomerReply(ticket.id);
                            }
                          }}
                          style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSendCustomerReply(ticket.id)}
                          disabled={replyingTicketId === ticket.id || !(customerReplies[ticket.id] || '').trim()}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          {replyingTicketId === ticket.id ? 'Sending...' : 'Reply'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Order Cancel / Delete Confirmation Modal */}
      {actionConfirm && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100 }}
          onClick={() => !isProcessingAction && setActionConfirm(null)}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '440px', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: actionConfirm.type === 'CANCEL' ? '#fff7ed' : '#fef2f2',
                color: actionConfirm.type === 'CANCEL' ? '#c2410c' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {actionConfirm.type === 'CANCEL' ? <IconAlert size={22} /> : <IconTrash size={22} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                  {actionConfirm.type === 'CANCEL' ? 'Cancel Order' : 'Delete Order'} #{actionConfirm.order?.id}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tracking Code: {actionConfirm.order?.trackingNumber || 'LK-PENDING'}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              {actionConfirm.type === 'CANCEL'
                ? 'Are you sure you want to cancel this order? Any reserved grocery items will be returned to supermarket stock, and delivery will be cancelled.'
                : 'Are you sure you want to permanently delete this order record from your order history? This action cannot be undone.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={isProcessingAction}
                onClick={() => setActionConfirm(null)}
                style={{ padding: '8px 16px' }}
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleConfirmOrderAction}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: actionConfirm.type === 'CANCEL' ? '#ea580c' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  fontWeight: '700',
                  cursor: isProcessingAction ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isProcessingAction 
                  ? 'Processing...' 
                  : actionConfirm.type === 'CANCEL' 
                    ? 'Yes, Cancel Order' 
                    : 'Yes, Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
