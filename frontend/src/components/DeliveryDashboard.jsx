import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconTruck, IconCheck, IconX, IconTrash, IconPackage, IconNavigation, IconMapPin, IconCalendar, IconClock, IconPhone, IconUser, IconAlert, IconSettings, IconPrinter, IconArrowUp, IconArrowDown, IconExternalLink } from './Icons';
import { PREDEFINED_DELIVERY_ROUTES } from '../constants/deliveryRoutes';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'route'
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [failureNote, setFailureNote] = useState('');
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Individual Delivery Scheduling & Route Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingDelivery, setSchedulingDelivery] = useState(null);
  const [schedRoute, setSchedRoute] = useState('');
  const [schedCustomRoute, setSchedCustomRoute] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedVehicle, setSchedVehicle] = useState('');
  const [schedNotes, setSchedNotes] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const getGoogleMapsLink = (addr) => {
    if (!addr) return 'https://maps.google.com';
    const match = addr.match(/\[GPS:\s*([0-9.-]+),\s*([0-9.-]+)\]/i);
    if (match) {
      return `https://www.google.com/maps/search/?api=1&query=${match[1]},${match[2]}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  };

  // Route Assignment Configuration State (Tab 2)
  const [selectedRoutePresetId, setSelectedRoutePresetId] = useState(PREDEFINED_DELIVERY_ROUTES[0].id);
  const [routeName, setRouteName] = useState(PREDEFINED_DELIVERY_ROUTES[0].name);
  const [vehicleNumber, setVehicleNumber] = useState(PREDEFINED_DELIVERY_ROUTES[0].defaultVehicle);
  const [routeNotes, setRouteNotes] = useState(`Corridor: ${PREDEFINED_DELIVERY_ROUTES[0].corridor}. Handle chilled items with priority.`);
  const [departureSchedule, setDepartureSchedule] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  });
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

  // Format scheduled delivery time cleanly
  const formatScheduledTime = (isoString, slot) => {
    if (!isoString) return slot || 'Express (60 Mins)';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return slot || isoString;
      return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return slot || isoString;
    }
  };

  // Open Schedule & Choose Route modal for a single delivery
  const handleOpenScheduleModal = (delivery) => {
    setSchedulingDelivery(delivery);
    const existingRoute = delivery.routeName || '';
    const matchingPreset = PREDEFINED_DELIVERY_ROUTES.find(r => r.name === existingRoute || r.shortName === existingRoute);
    if (matchingPreset) {
      setSchedRoute(matchingPreset.name);
      setSchedCustomRoute('');
      setSchedVehicle(delivery.vehicleNumber || matchingPreset.defaultVehicle);
    } else if (existingRoute) {
      setSchedRoute('CUSTOM');
      setSchedCustomRoute(existingRoute);
      setSchedVehicle(delivery.vehicleNumber || 'WP BCD-4589');
    } else {
      setSchedRoute(PREDEFINED_DELIVERY_ROUTES[0].name);
      setSchedCustomRoute('');
      setSchedVehicle(delivery.vehicleNumber || PREDEFINED_DELIVERY_ROUTES[0].defaultVehicle);
    }

    if (delivery.estimatedTime) {
      try {
        const d = new Date(delivery.estimatedTime);
        if (!isNaN(d.getTime())) {
          setSchedDate(d.toISOString().slice(0, 10));
          setSchedTime(d.toTimeString().slice(0, 5));
        } else {
          const today = new Date();
          setSchedDate(today.toISOString().slice(0, 10));
          setSchedTime('11:00');
        }
      } catch {
        const today = new Date();
        setSchedDate(today.toISOString().slice(0, 10));
        setSchedTime('11:00');
      }
    } else {
      const today = new Date();
      setSchedDate(today.toISOString().slice(0, 10));
      setSchedTime('11:00');
    }

    setSchedNotes(delivery.notes || '');
    setIsScheduleModalOpen(true);
  };

  // Save single delivery schedule & route choice
  const handleSaveDeliverySchedule = async (e) => {
    if (e) e.preventDefault();
    if (!schedulingDelivery) return;
    setIsSavingSchedule(true);

    try {
      const finalRoute = schedRoute === 'CUSTOM' ? schedCustomRoute.trim() : schedRoute;
      let scheduledDateTime = null;
      if (schedDate && schedTime) {
        scheduledDateTime = `${schedDate}T${schedTime}:00`;
      } else if (schedDate) {
        scheduledDateTime = `${schedDate}T12:00:00`;
      }

      await api.scheduleDelivery(schedulingDelivery.id, {
        scheduledTime: scheduledDateTime,
        routeName: finalRoute,
        notes: schedNotes
      });

      await api.updateDeliveryRoute(schedulingDelivery.id, {
        routeName: finalRoute,
        vehicleNumber: schedVehicle,
        estimatedTime: scheduledDateTime
      });

      await loadDeliveries();
      setIsScheduleModalOpen(false);
      showNotification(`Delivery for Order #${schedulingDelivery.order?.id} scheduled on ${finalRoute || 'selected route'}!`);
    } catch (err) {
      console.error("Failed to schedule delivery:", err);
      alert(err.message || "Failed to schedule delivery");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Switch preset route in Route Assignment Planner
  const handleSelectPresetRoute = (routeId) => {
    setSelectedRoutePresetId(routeId);
    if (routeId === 'CUSTOM') {
      setRouteName('');
      return;
    }
    const found = PREDEFINED_DELIVERY_ROUTES.find(r => r.id === routeId);
    if (found) {
      setRouteName(found.name);
      setVehicleNumber(found.defaultVehicle);
      setRouteNotes(`Corridor: ${found.corridor}. Handle chilled items with priority.`);
    }
  };

  // Calculate estimated stop ETA in sequence (15-min intervals)
  const calculateStopETA = (index) => {
    try {
      const base = departureSchedule ? new Date(departureSchedule) : new Date();
      if (isNaN(base.getTime())) return null;
      const stopTime = new Date(base.getTime() + (index + 1) * 15 * 60000);
      return stopTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
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

  // Save batch route assignment with calculated arrival schedules
  const handleSaveRouteAssignment = async () => {
    if (orderedTransitList.length === 0) return;
    setIsSavingRoute(true);
    try {
      const baseDate = departureSchedule ? new Date(departureSchedule) : new Date();
      const payload = orderedTransitList.map((item, idx) => {
        const stopTime = !isNaN(baseDate.getTime()) 
          ? new Date(baseDate.getTime() + (idx + 1) * 15 * 60000).toISOString().slice(0, 19)
          : null;

        return {
          deliveryId: item.id,
          routeName: routeName || 'Standard Transit Route',
          routeStopOrder: idx + 1,
          vehicleNumber: vehicleNumber || 'WP BCD-4589',
          estimatedTime: stopTime
        };
      });

      await api.batchAssignRoute(payload);
      await loadDeliveries();
      showNotification("Route Assignment saved successfully! Stop order, scheduled ETAs, and vehicle updated.");
    } catch (e) {
      console.error("Failed to save route assignment:", e);
      alert(e.message || "Failed to save route assignment");
    } finally {
      setIsSavingRoute(false);
    }
  };

  // Filter deliveries for Requests Queue tab by Status AND Route
  const filteredDeliveries = deliveries.filter(d => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesRoute = routeFilter === 'ALL' || 
      (routeFilter === 'UNASSIGNED' ? (!d.routeName || d.routeName.trim() === '') : d.routeName === routeFilter);
    return matchesStatus && matchesRoute;
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
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconTruck size={28} style={{ color: 'var(--primary)' }} /> Delivery Staff & Logistics Portal
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCheck size={18} /> {notificationMessage}
          </span>
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
          <IconPackage size={18} /> Delivery Requests Queue
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
          <IconNavigation size={18} /> Route Assignment Planner
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
          {/* Filter Bar with Status AND Route filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Status:</span>
              {['ALL', 'PENDING', 'ASSIGNED', 'TRANSIT', 'DELIVERED', 'FAILED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: statusFilter === st ? 'var(--primary)' : 'var(--bg-card)',
                    color: statusFilter === st ? 'white' : 'var(--text-muted)',
                    borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  {st === 'ALL' ? `All (${totalCount})` : `${st} (${deliveries.filter(d => d.status === st).length})`}
                </button>
              ))}
            </div>

            {/* Route Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconNavigation size={15} /> Choose Route:
              </span>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Delivery Routes ({deliveries.length})</option>
                <option value="UNASSIGNED">Unassigned Routes ({deliveries.filter(d => !d.routeName).length})</option>
                {PREDEFINED_DELIVERY_ROUTES.map(r => {
                  const count = deliveries.filter(d => d.routeName === r.name).length;
                  return (
                    <option key={r.id} value={r.name}>
                      {r.shortName} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Requests List */}
          {filteredDeliveries.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <IconTruck size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 14px auto', display: 'block' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>No Deliveries Found</h3>
              <p style={{ fontSize: '0.85rem' }}>No delivery dispatch requests match the selected filters (Status: {statusFilter} | Route: {routeFilter}).</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '18px' }}>
              {filteredDeliveries.map(d => {
                const isResolvedOrFailed = d.status === 'DELIVERED' || d.status === 'FAILED';

                return (
                  <div key={d.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: isResolvedOrFailed ? '1px solid var(--border)' : '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="badge badge-success">
                          Order #{d.order?.id} ({d.order?.trackingNumber})
                        </span>
                        <span className={`badge ${d.status === 'DELIVERED' ? 'badge-success' : d.status === 'FAILED' ? 'badge-danger' : d.status === 'TRANSIT' ? 'badge-primary' : 'badge-warning'}`}>
                          {d.status}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', marginBottom: '4px', color: 'var(--text-main)' }}>
                        {d.order?.user?.name || 'Customer'}
                      </h3>
                      <div style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconPhone size={14} /> Phone: <a href={`tel:${d.order?.user?.phone || '0771234567'}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{d.order?.user?.phone || '0771234567'}</a>
                      </div>

                      <div style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '14px', border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <IconMapPin size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div><strong>Delivery Address:</strong> <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{d.order?.deliveryAddress}</span></div>
                        </div>

                        {/* Delivery Route Tag */}
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconNavigation size={13} /> Route:
                          </span>
                          {d.routeName ? (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '0.78rem', border: '1px solid #bae6fd' }}>
                              {d.routeName} {d.routeStopOrder ? `(Stop #${d.routeStopOrder})` : ''} {d.vehicleNumber ? `• ${d.vehicleNumber}` : ''}
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '0.78rem', border: '1px solid #fde68a' }}>
                              No Route Assigned
                            </span>
                          )}
                        </div>

                        {/* Scheduled Delivery Time Tag */}
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconCalendar size={13} /> Scheduled:
                          </span>
                          <span style={{
                            background: d.estimatedTime ? '#dcfce7' : 'var(--bg-card)',
                            color: d.estimatedTime ? '#15803d' : 'var(--text-main)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '0.78rem',
                            border: '1px solid var(--border)'
                          }}>
                            {formatScheduledTime(d.estimatedTime, d.order?.deliverySlot)}
                          </span>
                        </div>

                        {d.deliveryStaff && (
                          <div style={{ color: 'var(--primary)', marginTop: '4px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconUser size={14} /> Assigned Rider: <strong>{d.deliveryStaff.name}</strong>
                          </div>
                        )}
                        {d.notes && (
                          <div style={{ color: '#dc2626', marginTop: '4px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconAlert size={14} /> Note: {d.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Schedule & Route Action Button */}
                      <button
                        onClick={() => handleOpenScheduleModal(d)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          background: '#ede9fe',
                          color: '#6d28d9',
                          border: '1px solid #ddd6fe',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          flex: '1'
                        }}
                        title="Choose delivery route corridor and schedule delivery date & time"
                      >
                        <IconCalendar size={15} /> Route & Schedule
                      </button>

                      {!d.deliveryStaff && (
                        <button
                          onClick={() => handleAssignToMe(d.id)}
                          className="btn-secondary"
                          style={{ flex: '1', justifyContent: 'center', padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <IconCheck size={15} /> Accept Route
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
              <IconNavigation size={18} /> Route Assignment Dispatch Planner
            </div>
            <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, lineHeight: '1.5' }}>
              In accordance with delivery operations, this planner <strong>only displays the destination address locations of orders you have accepted and transitioned into transit</strong>. You can organize stop sequence, assign vehicle and route codes, and open multi-stop GPS directions.
            </p>
          </div>

          {orderedTransitList.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <IconNavigation size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', display: 'block' }} />
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconSettings size={18} /> Make Route Assignment Details
                  </h3>
                  <span style={{ fontSize: '0.8rem', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                    {orderedTransitList.length} Active Stops in Route
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      SELECT DELIVERY ROUTE CORRIDOR
                    </label>
                    <select
                      value={selectedRoutePresetId}
                      onChange={(e) => handleSelectPresetRoute(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {PREDEFINED_DELIVERY_ROUTES.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.corridor})
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Route Corridor...</option>
                    </select>
                  </div>

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
                      SCHEDULED RUN DEPARTURE TIME
                    </label>
                    <input
                      type="datetime-local"
                      value={departureSchedule}
                      onChange={(e) => setDepartureSchedule(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        fontWeight: '600'
                      }}
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
                    <IconCheck size={16} /> {isSavingRoute ? 'Saving Route...' : 'Save Route Assignment'}
                  </button>

                  <a
                    href={getMultiStopMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <IconNavigation size={16} /> Open Multi-Stop Route in Google Maps
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
                    <IconPrinter size={16} /> Print Route Manifest Sheet
                  </button>
                </div>
              </div>

              {/* Transit Address Locations in Route Order */}
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconMapPin size={18} /> Transit Address Locations ({orderedTransitList.length} Stops in Sequence)
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Use arrow controls to optimize stop itinerary
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
                          {calculateStopETA(index) && (
                            <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#0284c7', fontWeight: '700' }}>
                              ETA: {calculateStopETA(index)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Destination Address Location & Recipient Details */}
                      <div style={{ flex: '1', minWidth: '280px' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconMapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} /> {d.order?.deliveryAddress}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconUser size={14} /> <strong>Recipient:</strong> {d.order?.user?.name || 'Customer'}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPhone size={14} /> <strong>Contact:</strong> <a href={`tel:${d.order?.user?.phone || '0771234567'}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{d.order?.user?.phone || '0771234567'}</a></span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconClock size={14} /> <strong>Window:</strong> {d.order?.deliverySlot}</span>
                          {d.estimatedTime && (
                            <span style={{ color: '#0284c7', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <IconCalendar size={14} /> <strong>Scheduled:</strong> {formatScheduledTime(d.estimatedTime)}
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPackage size={14} /> <strong>Order:</strong> #{d.order?.id} ({d.order?.trackingNumber})</span>
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
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Move stop earlier in route"
                          >
                            <IconArrowUp size={12} />
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
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Move stop later in route"
                          >
                            <IconArrowDown size={12} />
                          </button>
                        </div>

                        {/* Direct GPS Map Link */}
                        <a
                          href={getGoogleMapsLink(d.order?.deliveryAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Open address in Google Maps"
                        >
                          <IconMapPin size={14} /> Map
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

      {/* Schedule Delivery & Route Choice Modal */}
      {isScheduleModalOpen && schedulingDelivery && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconCalendar size={18} /> Choose Delivery Route & Schedule
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Order #{schedulingDelivery.order?.id} ({schedulingDelivery.order?.trackingNumber})
                </span>
              </div>
              <button 
                onClick={() => setIsScheduleModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Destination Highlight */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMapPin size={15} style={{ flexShrink: 0 }} /> <span><strong>Delivery Address:</strong> {schedulingDelivery.order?.deliveryAddress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconUser size={13} /> Recipient: {schedulingDelivery.order?.user?.name || 'Customer'}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPhone size={13} /> {schedulingDelivery.order?.user?.phone || '0771234567'}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPackage size={13} /> Total: Rs. {Number(schedulingDelivery.order?.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleSaveDeliverySchedule}>
              {/* Route Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  CHOOSE DELIVERY ROUTE / CORRIDOR
                </label>
                <select
                  value={schedRoute}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSchedRoute(val);
                    const matched = PREDEFINED_DELIVERY_ROUTES.find(r => r.name === val);
                    if (matched) {
                      setSchedVehicle(matched.defaultVehicle);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  {PREDEFINED_DELIVERY_ROUTES.map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name} — {r.corridor} ({r.transitTime})
                    </option>
                  ))}
                  <option value="CUSTOM">Custom Route Corridor...</option>
                </select>

                {schedRoute === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom delivery corridor (e.g. Route North #3 - Wattala/Ja-Ela)"
                    value={schedCustomRoute}
                    onChange={(e) => setSchedCustomRoute(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                )}
              </div>

              {/* Schedule Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    SCHEDULE DELIVERY DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    ESTIMATED TIME (ETA)
                  </label>
                  <input
                    type="time"
                    required
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Quick Preset Slot Buttons */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  QUICK SCHEDULE TIME PRESETS:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Morning (10:00 AM)', time: '10:00' },
                    { label: 'Noon (01:00 PM)', time: '13:00' },
                    { label: 'Afternoon (03:30 PM)', time: '15:30' },
                    { label: 'Evening (06:30 PM)', time: '18:30' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSchedTime(preset.time)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        border: schedTime === preset.time ? '1px solid var(--primary)' : '1px solid var(--border)',
                        background: schedTime === preset.time ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
                        color: schedTime === preset.time ? 'var(--primary)' : 'var(--text-main)',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Number */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  ASSIGNED VEHICLE / MOTORBIKE
                </label>
                <input
                  type="text"
                  placeholder="e.g. WP BCD-4589"
                  value={schedVehicle}
                  onChange={(e) => setSchedVehicle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Special Schedule Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  DELIVERY / SCHEDULE NOTES
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deliver before 11:30 AM. Call customer before arrival."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="btn-primary"
                  style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSavingSchedule ? 'Saving...' : 'Confirm Route & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
