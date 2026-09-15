import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconTruck, IconCheck, IconClock, IconAlert, IconX } from './Icons';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [failureNote, setFailureNote] = useState('');
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await api.getAllDeliveries();
      setDeliveries(res || []);
    } catch (e) {
      console.warn("Could not fetch deliveries:", e.message);
    }
  };

  const handleAssignToMe = async (delivId) => {
    try {
      await api.assignDeliveryStaff(delivId, user?.id || 3);
      loadDeliveries();
    } catch (e) {
      console.error("Failed to assign delivery staff:", e);
    }
  };

  const handleUpdateStatus = async (delivId, status, notes = '') => {
    try {
      await api.updateDeliveryStatus(delivId, status, notes);
      loadDeliveries();
    } catch (e) {
      console.error("Update delivery status failed:", e);
    }

    if (status === 'FAILED') {
      setIsFailModalOpen(false);
      setFailureNote('');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Delivery Staff & Logistics Portal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active order route assignments, GPS delivery progress, and customer contact info</p>
      </div>

      {/* Deliveries List */}
      {deliveries.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🚚</div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>No Deliveries in Queue</h3>
          <p style={{ fontSize: '0.85rem' }}>When customers place orders, delivery route dispatches will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {deliveries.map(d => (
            <div key={d.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-success">
                    Order #{d.order?.id} ({d.order?.trackingNumber})
                  </span>
                  <span className={`badge ${d.status === 'DELIVERED' ? 'badge-success' : d.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
                    {d.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {d.order?.user?.name || 'Customer'}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '10px' }}>
                  📞 Phone: {d.order?.user?.phone || '0771234567'}
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <div style={{ marginBottom: '4px' }}>📍 <strong>Destination:</strong> {d.order?.deliveryAddress}</div>
                  <div>⏰ <strong>Slot:</strong> {d.order?.deliverySlot}</div>
                  {d.deliveryStaff && <div style={{ color: 'var(--primary)', marginTop: '4px' }}>👤 Assigned Rider: {d.deliveryStaff.name}</div>}
                  {d.notes && <div style={{ color: '#dc2626', marginTop: '4px' }}>⚠️ Note: {d.notes}</div>}
                </div>
              </div>

              {/* Status Update Action Buttons */}
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
                    style={{ flex: '1', justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Failed Delivery Modal */}
      {isFailModalOpen && activeDelivery && (
        <div className="modal-overlay" onClick={() => setIsFailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Flag Delivery Failure</h3>
              <button onClick={() => setIsFailModalOpen(false)}><IconX size={20} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Specify the reason why order #{activeDelivery.order?.id} could not be completed:
            </p>

            <textarea 
              rows={3}
              required
              placeholder="e.g. Customer unreachable by phone, address not found, gates locked..."
              value={failureNote}
              onChange={(e) => setFailureNote(e.target.value)}
              style={{ width: '100%', marginBottom: '14px' }}
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
