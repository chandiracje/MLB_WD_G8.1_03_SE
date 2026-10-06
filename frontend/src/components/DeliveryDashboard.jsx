import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconTruck, IconCheck, IconX, IconTrash, IconPackage, IconNavigation, IconMapPin, IconCalendar, IconClock, IconPhone, IconUser, IconAlert, IconSettings, IconPrinter, IconArrowUp, IconArrowDown, IconExternalLink, IconFlag, IconPlus } from './Icons';
import { PREDEFINED_DELIVERY_ROUTES, getAllDeliveryRoutes, saveCustomDeliveryRoute, findOptimalRouteForAddress } from '../constants/deliveryRoutes';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'route'
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [failureNote, setFailureNote] = useState('');
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ASSIGNED');
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [selectedDetailDelivery, setSelectedDetailDelivery] = useState(null);
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Delivery Routes State & Creation Modal State
  const [availableRoutes, setAvailableRoutes] = useState(() => getAllDeliveryRoutes());
  const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteCorridor, setNewRouteCorridor] = useState('');
  const [newRouteVehicle, setNewRouteVehicle] = useState('WP BCD-4589 (Express Motorbike)');
  const [newRouteTransitMins, setNewRouteTransitMins] = useState('45');
  const [newRouteColor, setNewRouteColor] = useState('#10b981');

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
  const [selectedRoutePresetId, setSelectedRoutePresetId] = useState(availableRoutes[0]?.id || PREDEFINED_DELIVERY_ROUTES[0].id);
  const [routeName, setRouteName] = useState(availableRoutes[0]?.name || PREDEFINED_DELIVERY_ROUTES[0].name);
  const [vehicleNumber, setVehicleNumber] = useState(availableRoutes[0]?.defaultVehicle || PREDEFINED_DELIVERY_ROUTES[0].defaultVehicle);
  const [routeNotes, setRouteNotes] = useState(`Corridor: ${availableRoutes[0]?.corridor || PREDEFINED_DELIVERY_ROUTES[0].corridor}. Handle chilled items with priority.`);
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

      // Keep selectedDetailDelivery updated if currently open
      setSelectedDetailDelivery(prev => {
        if (!prev) return null;
        return list.find(d => d.id === prev.id) || null;
      });

      // Default filter logic: show assigned deliveries; if none assigned currently, show pending ones
      if (!hasInitializedFilter) {
        const hasAssigned = list.some(d => d.status === 'ASSIGNED');
        if (hasAssigned) {
          setStatusFilter('ASSIGNED');
        } else {
          const hasPending = list.some(d => d.status === 'PENDING');
          if (hasPending) {
            setStatusFilter('PENDING');
          } else {
            setStatusFilter('ALL');
          }
        }
        setHasInitializedFilter(true);
      }

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
      if (selectedDetailDelivery?.id === delivId) {
        setSelectedDetailDelivery(null);
      }
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

  // Create custom delivery route corridor
  const handleCreateRoute = (e) => {
    if (e) e.preventDefault();
    if (!newRouteName.trim() || !newRouteCorridor.trim()) {
      alert("Please enter both Route Name and Corridor/Serviced Areas.");
      return;
    }
    const created = saveCustomDeliveryRoute({
      name: newRouteName.trim(),
      corridor: newRouteCorridor.trim(),
      defaultVehicle: newRouteVehicle.trim() || 'WP BCD-4589 (Express Motorbike)',
      transitTime: `${newRouteTransitMins || 45} mins`,
      color: newRouteColor || '#10b981'
    });
    const updated = getAllDeliveryRoutes();
    setAvailableRoutes(updated);
    setIsCreateRouteModalOpen(false);
    setNewRouteName('');
    setNewRouteCorridor('');
    setNewRouteVehicle('WP BCD-4589 (Express Motorbike)');
    setNewRouteTransitMins('45');
    showNotification(`New delivery route "${created.name}" created and added to corridors!`);
  };

  // Open Schedule & Choose Route modal for a single delivery
  const handleOpenScheduleModal = (delivery) => {
    setSchedulingDelivery(delivery);
    const existingRoute = delivery.routeName || '';
    const matchingPreset = availableRoutes.find(r => r.name === existingRoute || r.shortName === existingRoute);
    if (matchingPreset) {
      setSchedRoute(matchingPreset.name);
      setSchedCustomRoute('');
      setSchedVehicle(delivery.vehicleNumber || matchingPreset.defaultVehicle);
    } else if (existingRoute) {
      setSchedRoute('CUSTOM');
      setSchedCustomRoute(existingRoute);
      setSchedVehicle(delivery.vehicleNumber || 'WP BCD-4589');
    } else {
      // Auto-match route from address if unassigned!
      const autoMatchedName = findOptimalRouteForAddress(delivery.order?.deliveryAddress);
      const matched = availableRoutes.find(r => r.name === autoMatchedName) || availableRoutes[0];
      setSchedRoute(matched ? matched.name : availableRoutes[0]?.name || 'Route 1 - Colombo Central');
      setSchedCustomRoute('');
      setSchedVehicle(delivery.vehicleNumber || matched?.defaultVehicle || 'WP BCD-4589');
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
    const found = availableRoutes.find(r => r.id === routeId);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>Status Filter:</span>
              {[
                { key: 'ASSIGNED', label: 'Assigned' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'TRANSIT', label: 'In Transit' },
                { key: 'DELIVERED', label: 'Delivered' },
                { key: 'FAILED', label: 'Failed' },
                { key: 'ALL', label: 'All Requests' }
              ].map(({ key, label }) => {
                const count = key === 'ALL' ? totalCount : deliveries.filter(d => d.status === key).length;
                const isActive = statusFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      border: '1px solid',
                      cursor: 'pointer',
                      background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                      color: isActive ? 'white' : 'var(--text-muted)',
                      borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                      boxShadow: isActive ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Route Filter Dropdown & New Route Button */}
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
                {availableRoutes.map(r => {
                  const count = deliveries.filter(d => d.routeName === r.name).length;
                  return (
                    <option key={r.id} value={r.name}>
                      {r.shortName || r.name} ({count})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setIsCreateRouteModalOpen(true)}
                className="btn-primary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Create a new custom delivery corridor/route"
              >
                <IconPlus size={14} /> New Route
              </button>
            </div>
          </div>

          {/* Requests List */}
          {filteredDeliveries.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <IconTruck size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 14px auto', display: 'block' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                No {statusFilter === 'ALL' ? '' : `${statusFilter} `}Deliveries Found
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                {statusFilter === 'ASSIGNED' 
                  ? 'There are currently no deliveries assigned to riders. You can view pending deliveries or all requests.'
                  : `No delivery dispatch requests match the selected filters (Status: ${statusFilter} | Route: ${routeFilter}).`}
              </p>
              {statusFilter !== 'ALL' && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {statusFilter === 'ASSIGNED' && (
                    <button
                      onClick={() => setStatusFilter('PENDING')}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      View Pending Deliveries ({deliveries.filter(d => d.status === 'PENDING').length}) →
                    </button>
                  )}
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    View All ({deliveries.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {filteredDeliveries.map(d => {
                const getStatusBadge = (st) => {
                  switch (st) {
                    case 'ASSIGNED':
                      return { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe', label: 'ASSIGNED' };
                    case 'PENDING':
                      return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'PENDING' };
                    case 'TRANSIT':
                      return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'IN TRANSIT' };
                    case 'DELIVERED':
                      return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'DELIVERED' };
                    case 'FAILED':
                      return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca', label: 'FAILED' };
                    default:
                      return { bg: 'var(--bg-main)', color: 'var(--text-main)', border: 'var(--border)', label: st };
                  }
                };

                const statusStyle = getStatusBadge(d.status);
                const isAccepted = !!d.deliveryStaff || d.status === 'ASSIGNED' || d.status === 'TRANSIT' || d.status === 'DELIVERED';
                const canAccept = !d.deliveryStaff && d.status !== 'DELIVERED';
                const canStartTransit = d.status !== 'TRANSIT' && d.status !== 'DELIVERED' && d.status !== 'FAILED';

                return (
                  <div
                    key={d.id}
                    className="glass-card"
                    onClick={() => setSelectedDetailDelivery(d)}
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: 'var(--bg-card)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {/* Top Row: Order ID & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          Order #{d.order?.id}
                        </span>
                        {d.order?.trackingNumber && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            {d.order.trackingNumber}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        padding: '3px 9px',
                        borderRadius: '12px',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        letterSpacing: '0.04em'
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Body: Route name, Address, Phone number */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {/* Route Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem' }}>
                        <IconNavigation size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Route:</span>
                        <span style={{
                          fontWeight: '700',
                          color: d.routeName ? 'var(--text-main)' : '#b45309',
                          background: d.routeName ? 'var(--bg-main)' : '#fef3c7',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          border: d.routeName ? '1px solid var(--border)' : '1px solid #fde68a'
                        }}>
                          {d.routeName || 'Unassigned Route'}
                        </span>
                      </div>

                      {/* Address */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem' }}>
                        <IconMapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1, minWidth: 0, color: 'var(--text-main)', lineHeight: '1.4' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Address: </span>
                          <span style={{
                            fontWeight: '600',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }} title={d.order?.deliveryAddress}>
                            {d.order?.deliveryAddress || 'No address specified'}
                          </span>
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem' }}>
                        <IconPhone size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Phone:</span>
                        <a
                          href={`tel:${d.order?.user?.phone || '0771234567'}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: 'var(--primary)',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                          title="Call recipient"
                        >
                          {d.order?.user?.phone || '0771234567'}
                        </a>
                      </div>
                    </div>

                    {/* Bottom Action Controls: Accept Route and Start Transit */}
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        {/* Button 1: Accept Route */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignToMe(d.id);
                          }}
                          disabled={!canAccept}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            cursor: canAccept ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            background: isAccepted ? '#f0fdf4' : 'var(--bg-card)',
                            borderColor: isAccepted ? '#86efac' : 'var(--border)',
                            color: isAccepted ? '#166534' : 'var(--text-main)',
                            opacity: canAccept ? 1 : 0.85,
                            transition: 'all 0.15s ease'
                          }}
                          title={isAccepted ? "Route already accepted" : "Accept delivery route"}
                        >
                          <IconCheck size={14} />
                          {isAccepted ? 'Accepted' : 'Accept Route'}
                        </button>

                        {/* Button 2: Start Transit */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(d.id, 'TRANSIT', 'Driver dispatched on transit route');
                          }}
                          disabled={!canStartTransit}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: canStartTransit ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            background: d.status === 'TRANSIT' ? '#0284c7' : (d.status === 'DELIVERED' ? '#166534' : 'var(--primary)'),
                            color: 'white',
                            opacity: canStartTransit ? 1 : (d.status === 'TRANSIT' ? 1 : 0.65),
                            transition: 'all 0.15s ease',
                            boxShadow: canStartTransit ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none'
                          }}
                          title={canStartTransit ? "Start delivery transit" : `Status: ${d.status}`}
                        >
                          <IconTruck size={14} />
                          {d.status === 'TRANSIT' ? 'In Transit' : (d.status === 'DELIVERED' ? 'Delivered' : 'Start Transit')}
                        </button>
                      </div>

                      {/* Click affordance indicator */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        paddingTop: '6px',
                        borderTop: '1px dashed var(--border)'
                      }}>
                        <span>Click card for details, delete or flag</span>
                        <IconExternalLink size={12} />
                      </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        SELECT DELIVERY ROUTE CORRIDOR
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreateRouteModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          padding: 0
                        }}
                      >
                        + Create Corridor
                      </button>
                    </div>
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
                      {availableRoutes.map(r => (
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

      {/* Detailed Delivery Card Modal */}
      {selectedDetailDelivery && (
        <div className="modal-overlay" onClick={() => setSelectedDetailDelivery(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '620px', width: '95%', padding: '24px', borderRadius: 'var(--radius-lg)' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', margin: 0 }}>
                    Order #{selectedDetailDelivery.order?.id}
                  </h2>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    ...(() => {
                      const st = selectedDetailDelivery.status;
                      if (st === 'ASSIGNED') return { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' };
                      if (st === 'PENDING') return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
                      if (st === 'TRANSIT') return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
                      if (st === 'DELIVERED') return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
                      if (st === 'FAILED') return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
                      return { background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)' };
                    })()
                  }}>
                    {selectedDetailDelivery.status}
                  </span>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Tracking Number: <strong style={{ color: 'var(--text-main)' }}>{selectedDetailDelivery.order?.trackingNumber || 'N/A'}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailDelivery(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                title="Close Modal"
              >
                <IconX size={22} />
              </button>
            </div>

            {/* Customer & Destination Details Card */}
            <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Customer & Contact Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Customer Name</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconUser size={15} style={{ color: 'var(--primary)' }} /> {selectedDetailDelivery.order?.user?.name || 'Customer'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Contact Phone</span>
                  <a
                    href={`tel:${selectedDetailDelivery.order?.user?.phone || '0771234567'}`}
                    style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <IconPhone size={15} /> {selectedDetailDelivery.order?.user?.phone || '0771234567'}
                  </a>
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Delivery Address</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1 }}>
                    <IconMapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{selectedDetailDelivery.order?.deliveryAddress || 'No address provided'}</span>
                  </div>
                  <a
                    href={getGoogleMapsLink(selectedDetailDelivery.order?.deliveryAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <IconNavigation size={13} /> Open in Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Route & Logistics Information */}
            <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Logistics & Schedule
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Assigned Corridor</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: selectedDetailDelivery.routeName ? 'var(--text-main)' : '#b45309' }}>
                    {selectedDetailDelivery.routeName || 'Not Assigned Yet'}
                    {selectedDetailDelivery.routeStopOrder ? ` (Stop #${selectedDetailDelivery.routeStopOrder})` : ''}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Assigned Vehicle</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {selectedDetailDelivery.vehicleNumber || 'WP BCD-4589'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Delivery Schedule</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {formatScheduledTime(selectedDetailDelivery.estimatedTime, selectedDetailDelivery.order?.deliverySlot)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Order Total</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary)' }}>
                    Rs. {Number(selectedDetailDelivery.order?.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedDetailDelivery.deliveryStaff && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <strong>Assigned Rider:</strong> {selectedDetailDelivery.deliveryStaff.name} ({selectedDetailDelivery.deliveryStaff.email || 'Delivery Staff'})
                </div>
              )}

              {selectedDetailDelivery.notes && (
                <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fee2e2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <IconAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Dispatch Note / Issue:</strong> {selectedDetailDelivery.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions: Flag, Delete, Schedule, Deliver */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Flag Issue button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDelivery(selectedDetailDelivery);
                    setIsFailModalOpen(true);
                  }}
                  className="btn-danger"
                  style={{ flex: 1, minWidth: '130px', justifyContent: 'center', padding: '10px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Flag failure or issue with delivery"
                >
                  <IconFlag size={16} /> Flag Issue
                </button>

                {/* Delete Request button */}
                <button
                  type="button"
                  onClick={() => handleDeleteDelivery(selectedDetailDelivery.id, selectedDetailDelivery.order?.id)}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '10px 14px',
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
                    fontWeight: '700'
                  }}
                  title="Delete this delivery request"
                >
                  <IconTrash size={16} /> Delete Request
                </button>

                {/* Route & Schedule button */}
                <button
                  type="button"
                  onClick={() => {
                    handleOpenScheduleModal(selectedDetailDelivery);
                  }}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '10px 14px',
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
                    gap: '6px'
                  }}
                  title="Adjust route corridor and scheduled date/time"
                >
                  <IconCalendar size={16} /> Schedule
                </button>
              </div>

              {/* Complete & Mark Delivered (if in transit) */}
              {selectedDetailDelivery.status === 'TRANSIT' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedDetailDelivery.id, 'DELIVERED', 'Delivered to customer')}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: '700' }}
                >
                  <IconCheck size={18} /> Complete & Mark Delivered
                </button>
              )}
            </div>
          </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    CHOOSE DELIVERY ROUTE / CORRIDOR
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateRouteModalOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      padding: 0
                    }}
                  >
                    + Create Corridor
                  </button>
                </div>
                <select
                  value={schedRoute}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSchedRoute(val);
                    const matched = availableRoutes.find(r => r.name === val);
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
                  {availableRoutes.map(r => (
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

      {/* Create Delivery Route Modal */}
      {isCreateRouteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateRouteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconPlus size={18} style={{ color: 'var(--primary)' }} /> Create Delivery Route Corridor
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Add a new delivery corridor and service area
                </span>
              </div>
              <button 
                onClick={() => setIsCreateRouteModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Newly created routes will be saved to your system and automatically suggested for customer addresses matching this corridor during checkout and dispatch.
            </p>

            <form onSubmit={handleCreateRoute}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  ROUTE NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route North #3 - Negombo Corridor"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
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

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  CORRIDOR / SERVICED AREAS *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wattala, Hendala, Kandana, Ragama, Ja-Ela"
                  value={newRouteCorridor}
                  onChange={(e) => setNewRouteCorridor(e.target.value)}
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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Customer addresses containing these area names will automatically auto-match to this route.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    DEFAULT VEHICLE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WP BCD-4589"
                    value={newRouteVehicle}
                    onChange={(e) => setNewRouteVehicle(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    EST. TRANSIT (MINS)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    value={newRouteTransitMins}
                    onChange={(e) => setNewRouteTransitMins(e.target.value)}
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

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateRouteModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <IconCheck size={16} /> Save & Activate Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
