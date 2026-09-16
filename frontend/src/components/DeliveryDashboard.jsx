import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconTruck, IconCheck, IconClock, IconAlert, IconX, IconTrash } from './Icons';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'route'
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [failureNote, setFailureNote] = useState('');
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Route Assignment Configuration State
  const [routeName, setRouteName] = useState('Route Run 1 - Express Corridor');
  const [vehicleNumber, setVehicleNumber] = useState('WP BCD-4589');
  const [routeNotes, setRouteNotes] = useState('Follow order sequence. Handle chilled dairy items with priority.');
  const [orderedTransitList, setOrderedTransitList] = useState([]);
  const [isSavingRoute, setIsSavingRoute] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await api.getAllDeliveries();
      const list = res || [];
      setDeliveries(list);

      // Sync transit deliveries for route assignment (filter only orders accepted in transit)
      const transitOrders = list
        .filter(d => d.status === 'TRANSIT')
        .sort((a, b) => (a.routeStopOrder || 999) - (b.routeStopOrder || 999));
      
      setOrderedTransitList(transitOrders);
    } catch (e) {
      console.warn("Could not fetch deliveries:", e.message);
    }
  };

  const showNotification = (msg) => {
    setNotificationMessage(msg);
    setTimeout(() => setNotificationMessage(''), 4500);
  };

  const handleAssignToMe = async (delivId) => {
    try {
      await api.assignDeliveryStaff(delivId, user?.id || 3);
      await loadDeliveries();
      showNotification("Delivery route accepted! You can now start transit when departing.");
    } catch (e) {
      console.error("Failed to assign delivery staff:", e);
      alert(e.message || "Failed to accept route");
    }
  };

  const handleUpdateStatus = async (delivId, status, notes = '') => {
    try {
      await api.updateDeliveryStatus(delivId, status, notes);
      await loadDeliveries();
      if (status === 'TRANSIT') {
        showNotification("Order status updated to IN TRANSIT. Added to Route Assignment!");
      } else if (status === 'DELIVERED') {
        showNotification("Order marked as DELIVERED successfully!");
      }
    } catch (e) {
      console.error("Update delivery status failed:", e);
      alert(e.message || "Failed to update status");
    }

    if (status === 'FAILED') {
      setIsFailModalOpen(false);
      setFailureNote('');
      showNotification("Delivery marked as FAILED.");
    }
  };

  const handleDeleteDelivery = async (delivId, orderId) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the delivery request for Order #${orderId}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteDelivery(delivId);
      await loadDeliveries();
      showNotification(`Delivery request for Order #${orderId} has been successfully deleted.`);
    } catch (e) {
      console.error("Failed to delete delivery:", e);
      alert(e.message || "Failed to delete delivery request");
    }
  };

  // Reorder stops within transit route assignment
  const handleMoveStop = (index, direction) => {
    const newList = [...orderedTransitList];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newList.length) return;

    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    setOrderedTransitList(newList);
  };

  // Save batch route assignment
  const handleSaveRouteAssignment = async () => {
    if (orderedTransitList.length === 0) return;
    setIsSavingRoute(true);
    try {
      const payload = orderedTransitList.map((item, idx) => ({
        deliveryId: item.id,
        routeName: routeName || 'Standard Transit Route',
        routeStopOrder: idx + 1,
        vehicleNumber: vehicleNumber || 'WP BCD-4589'
      }));

      await api.batchAssignRoute(payload);
      await loadDeliveries();
      showNotification("Route Assignment saved successfully! Stop order and vehicle assignment updated.");
    } catch (e) {
      console.error("Failed to save route assignment:", e);
      alert(e.message || "Failed to save route assignment");
    } finally {
      setIsSavingRoute(false);
    }
  };

  // Filter deliveries for Requests Queue tab
  const filteredDeliveries = deliveries.filter(d => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  // Calculate dashboard summary counts
  const totalCount = deliveries.length;
  const transitCount = deliveries.filter(d => d.status === 'TRANSIT').length;
  const deliveredCount = deliveries.filter(d => d.status === 'DELIVERED').length;
  const failedCount = deliveries.filter(d => d.status === 'FAILED').length;

  // Build multi-stop Google Maps URL from transit address locations
  const getMultiStopMapUrl = () => {
    if (orderedTransitList.length === 0) return '#';
    const destinationAddresses = orderedTransitList
      .map(d => d.order?.deliveryAddress)
      .filter(Boolean);
    if (destinationAddresses.length === 0) return '#';
    return `https://www.google.com/maps/dir/${destinationAddresses.map(encodeURIComponent).join('/')}`;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Portal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            🚚 Delivery Staff & Logistics Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage delivery dispatch requests, delete completed/failed entries, and construct sequential transit route assignments.
          </p>
        </div>

        {/* Quick Stat Chips */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Requests</div>
          </div>
          <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0369a1' }}>{transitCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>In Transit</div>
          </div>
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#166534' }}>{deliveredCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#166534' }}>Delivered</div>
          </div>
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#dc2626' }}>{failedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Failed</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMessage && (
        <div style={{
          background: '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontWeight: '600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <span>✨ {notificationMessage}</span>
          <button onClick={() => setNotificationMessage('')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
      )}

      {/* Main Navigation Tabs: Requests Queue vs Route Assignment */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '24px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: '700',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'queue' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'queue' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          📦 Delivery Requests Queue
          <span style={{
            background: activeTab === 'queue' ? 'var(--primary)' : 'var(--bg-main)',
            color: activeTab === 'queue' ? 'white' : 'var(--text-muted)',
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          style={{
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: '700',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'route' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'route' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          🗺️ Route Assignment Planner
          <span style={{
            background: activeTab === 'route' ? 'var(--primary)' : '#0284c7',
            color: 'white',
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {transitCount} Transit
          </span>
        </button>
      </div>

      {/* TAB 1: DELIVERY REQUESTS QUEUE */}
      {activeTab === 'queue' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['ALL', 'PENDING', 'ASSIGNED', 'TRANSIT', 'DELIVERED', 'FAILED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: statusFilter === st ? 'var(--primary)' : 'var(--bg-card)',
                    color: statusFilter === st ? 'white' : 'var(--text-muted)',
                    borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  {st === 'ALL' ? `All Requests (${totalCount})` : `${st} (${deliveries.filter(d => d.status === st).length})`}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Resolved (DELIVERED) and FAILED requests can be deleted to keep your queue clean.
            </div>
          </div>

          {/* Requests List */}
          {filteredDeliveries.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🚚</div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>No Deliveries Found</h3>
              <p style={{ fontSize: '0.85rem' }}>No delivery dispatch requests match the selected "{statusFilter}" status filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '18px' }}>
              {filteredDeliveries.map(d => {
                const isResolvedOrFailed = d.status === 'DELIVERED' || d.status === 'FAILED';

                return (
                  <div key={d.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: isResolvedOrFailed ? '1px solid var(--border)' : '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="badge badge-success">
                          Order #{d.order?.id} ({d.order?.trackingNumber})
                        </span>
                        <span className={`badge ${d.status === 'DELIVERED' ? 'badge-success' : d.status === 'FAILED' ? 'badge-danger' : d.status === 'TRANSIT' ? 'badge-primary' : 'badge-warning'}`}>
                          {d.status}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                        {d.order?.user?.name || 'Customer'}
                      </h3>
                      <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '10px' }}>
                        📞 Phone: <a href={`tel:${d.order?.user?.phone || '0771234567'}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{d.order?.user?.phone || '0771234567'}</a>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '14px' }}>
                        <div style={{ marginBottom: '6px' }}>
                          📍 <strong>Delivery Address:</strong> <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{d.order?.deliveryAddress}</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>⏰ <strong>Delivery Slot:</strong> {d.order?.deliverySlot}</div>
                        {d.routeName && (
                          <div style={{ color: '#0369a1', marginTop: '4px' }}>
                            🗺️ <strong>Route:</strong> {d.routeName} {d.routeStopOrder ? `(Stop #${d.routeStopOrder})` : ''} {d.vehicleNumber ? `• 🚙 ${d.vehicleNumber}` : ''}
                          </div>
                        )}
                        {d.deliveryStaff && (
                          <div style={{ color: 'var(--primary)', marginTop: '4px' }}>
                            👤 Assigned Rider: {d.deliveryStaff.name}
                          </div>
                        )}
                        {d.notes && <div style={{ color: '#dc2626', marginTop: '4px' }}>⚠️ Note: {d.notes}</div>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {!d.deliveryStaff && (
                        <button
                          onClick={() => handleAssignToMe(d.id)}
                          className="btn-secondary"
                          style={{ flex: '1', justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}
                        >
                          ✋ Accept Route
                        </button>
                      )}

                      {d.status !== 'TRANSIT' && d.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'TRANSIT', 'Driver on the way')}
                          className="btn-secondary"
                          style={{ flex: '1', justifyContent: 'center', padding: '8px', fontSize: '0.85rem', background: '#0284c7', color: 'white', border: 'none' }}
                        >
                          <IconTruck size={16} /> Start Transit
                        </button>
                      )}

                      {d.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'DELIVERED', 'Delivered to customer')}
                          className="btn-primary"
                          style={{ flex: '1', justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}
                        >
                          <IconCheck size={16} /> Mark Delivered
                        </button>
                      )}

                      {d.status !== 'DELIVERED' && d.status !== 'FAILED' && (
                        <button
                          onClick={() => {
                            setActiveDelivery(d);
                            setIsFailModalOpen(true);
                          }}
                          className="btn-danger"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          Flag Failed
                        </button>
                      )}

                      {/* DELETE ACTION FOR RESOLVED OR FAILED DELIVERY REQUESTS */}
                      {isResolvedOrFailed && (
                        <button
                          onClick={() => handleDeleteDelivery(d.id, d.order?.id)}
                          style={{
                            flex: '1',
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: '600'
                          }}
                          title="Delete resolved or failed delivery request from queue"
                        >
                          <IconTrash size={16} /> Delete Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROUTE ASSIGNMENT PLANNER */}
      {activeTab === 'route' && (
        <div>
          {/* Subheader info */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>
              <span>📍</span> Route Assignment Dispatch Planner
            </div>
            <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, lineHeight: '1.5' }}>
              In accordance with delivery operations, this planner <strong>only displays the destination address locations of orders you have accepted and transitioned into transit</strong>. You can organize stop sequence, assign vehicle and route codes, and open multi-stop GPS directions.
            </p>
          </div>

          {orderedTransitList.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🗺️</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                No Accepted In-Transit Orders Found
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '560px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
                Route assignments can only be constructed using orders that have been accepted for transit. 
                Switch to the <strong>Delivery Requests Queue</strong>, accept available orders, and click <strong>"Start Transit"</strong> to add them to your route stops.
              </p>
              <button
                onClick={() => setActiveTab('queue')}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.9rem' }}
              >
                Go to Delivery Requests Queue →
              </button>
            </div>
          ) : (
            <div>
              {/* Route Assignment Configuration Card */}
              <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚙️ Make Route Assignment Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      ROUTE NAME / RUN CODE
                    </label>
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="e.g. Route South #1 - Express"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      ASSIGNED VEHICLE / MOTORBIKE NO.
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. WP BCD-4589"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      DISPATCH DISPATCHER / RIDER
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name ? `${user.name} (${user.email || 'Delivery Staff'})` : 'Active Delivery Staff'}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    ROUTE DISPATCH NOTES & PRIORITY INSTRUCTIONS
                  </label>
                  <input
                    type="text"
                    value={routeNotes}
                    onChange={(e) => setRouteNotes(e.target.value)}
                    placeholder="Instructions for transit order, customer gate codes, temperature items..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>

                {/* Route Action Controls */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={handleSaveRouteAssignment}
                    disabled={isSavingRoute}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    💾 {isSavingRoute ? 'Saving Route...' : 'Save Route Assignment'}
                  </button>

                  <a
                    href={getMultiStopMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    🗺️ Open Multi-Stop Route in Google Maps
                  </a>

                  <button
                    onClick={() => window.print()}
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🖨️ Print Route Manifest Sheet
                  </button>
                </div>
              </div>

              {/* Transit Address Locations in Route Order */}
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                  📍 Transit Address Locations ({orderedTransitList.length} Stops in Sequence)
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Use ⬆️ / ⬇️ to optimize stop itinerary
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orderedTransitList.map((d, index) => {
                  const isFirst = index === 0;
                  const isLast = index === orderedTransitList.length - 1;

                  return (
                    <div
                      key={d.id}
                      className="glass-card"
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderLeft: '5px solid #0284c7',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Stop Sequence Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '100px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#0284c7',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '1.1rem',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>STOP #{index + 1}</div>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>IN TRANSIT</span>
                        </div>
                      </div>

                      {/* Destination Address Location & Recipient Details */}
                      <div style={{ flex: '1', minWidth: '280px' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📍 {d.order?.deliveryAddress}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span>👤 <strong>Recipient:</strong> {d.order?.user?.name || 'Customer'}</span>
                          <span>📞 <strong>Contact:</strong> <a href={`tel:${d.order?.user?.phone || '0771234567'}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{d.order?.user?.phone || '0771234567'}</a></span>
                          <span>⏰ <strong>Window:</strong> {d.order?.deliverySlot}</span>
                          <span>📦 <strong>Order:</strong> #{d.order?.id} ({d.order?.trackingNumber})</span>
                        </div>
                      </div>

                      {/* Reorder and Direct Navigation Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Sequence reorder buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            disabled={isFirst}
                            onClick={() => handleMoveStop(index, -1)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              background: isFirst ? 'var(--bg-card)' : 'var(--bg-main)',
                              color: isFirst ? 'var(--text-muted)' : 'var(--text-main)',
                              cursor: isFirst ? 'not-allowed' : 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '700'
                            }}
                            title="Move stop earlier in route"
                          >
                            ▲
                          </button>
                          <button
                            disabled={isLast}
                            onClick={() => handleMoveStop(index, 1)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              background: isLast ? 'var(--bg-card)' : 'var(--bg-main)',
                              color: isLast ? 'var(--text-muted)' : 'var(--text-main)',
                              cursor: isLast ? 'not-allowed' : 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '700'
                            }}
                            title="Move stop later in route"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Direct GPS Map Link */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.order?.deliveryAddress || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Open address in Google Maps"
                        >
                          📍 Map
                        </a>

                        {/* Complete Delivery directly from route sheet */}
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'DELIVERED', 'Delivered during route transit')}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <IconCheck size={14} /> Delivered
                        </button>

                        {/* Flag failed */}
                        <button
                          onClick={() => {
                            setActiveDelivery(d);
                            setIsFailModalOpen(true);
                          }}
                          className="btn-danger"
                          style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                          title="Flag delivery failure"
                        >
                          Issue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Failed Delivery Modal */}
      {isFailModalOpen && activeDelivery && (
        <div className="modal-overlay" onClick={() => setIsFailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Flag Delivery Failure</h3>
              <button onClick={() => setIsFailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <IconX size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Specify the reason why order #{activeDelivery.order?.id} ({activeDelivery.order?.trackingNumber}) could not be completed:
            </p>

            <textarea 
              rows={3}
              required
              placeholder="e.g. Customer unreachable by phone, gate closed, wrong address..."
              value={failureNote}
              onChange={(e) => setFailureNote(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '14px', background: 'var(--bg-main)', color: 'var(--text-main)' }}
            />

            <button 
              onClick={() => handleUpdateStatus(activeDelivery.id, 'FAILED', failureNote || 'Customer unreachable')}
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              Confirm Failure & Trigger Reschedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
