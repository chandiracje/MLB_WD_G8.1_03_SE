import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IconHeadphones, IconCheck, IconSearch, IconX } from './Icons';

export const SupportDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await api.getAllTickets();
      setTickets(res || []);
    } catch (e) {
      console.warn("Could not fetch support tickets:", e.message);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.updateTicketStatus(ticketId, newStatus);
      loadTickets();
    } catch (e) {
      console.error("Failed to update ticket status:", e);
    }
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Customer Support & Inquiries Hub</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Respond to customer queries, resolve grievances, and handle refund requests</p>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🎧</div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>No Support Inquiries</h3>
          <p style={{ fontSize: '0.85rem' }}>All customer support tickets are currently resolved and clear.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {tickets.map(t => (
            <div key={t.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-success">{t.category}</span>
                  <span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : t.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-danger'}`}>
                    {t.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {t.subject}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  From: <strong>{t.user?.name || 'Customer'}</strong> ({t.user?.email || 'N/A'})
                </div>

                <p style={{ fontSize: '0.9rem', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                  "{t.message}"
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket #{t.id}</span>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
