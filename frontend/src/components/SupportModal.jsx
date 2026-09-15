import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IconHeadphones, IconX, IconSend, IconCheck } from './Icons';

export const SupportModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState('new'); // 'new', 'tickets', 'chat'
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Order Delivery Inquiry');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! 👋 How can we help your grocery shopping today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      setFormError('');
    }
  }, [isOpen, user]);

  const loadTickets = async () => {
    try {
      const targetUserId = user?.id || 6;
      const res = await api.getUserTickets(targetUserId);
      setTickets(res || []);
    } catch (e) {
      console.warn("Could not load user tickets:", e.message);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!subject.trim() || subject.trim().length < 4) {
      setFormError('Subject must be at least 4 characters.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setFormError('Detailed message must be at least 10 characters so our team can assist.');
      return;
    }

    try {
      const targetUserId = user?.id || 6;
      await api.createTicket(targetUserId, {
        subject: subject.trim(),
        category,
        message: message.trim()
      });
      loadTickets();
      setSubmittedSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => {
        setSubmittedSuccess(false);
        setTab('tickets');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to submit support ticket.');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: 'Thanks for contacting LankaFresh Support! An agent will assist you shortly or update your ticket.' }
      ]);
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
              <IconHeadphones size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>Customer Support & Helpdesk</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>We are here to assist with deliveries, refunds & inquiries</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <IconX size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '18px' }}>
          <button
            onClick={() => setTab('new')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: tab === 'new' ? 'var(--primary)' : 'var(--bg-main)',
              color: tab === 'new' ? 'white' : 'var(--text-main)'
            }}
          >
            Submit Ticket
          </button>
          <button
            onClick={() => setTab('tickets')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: tab === 'tickets' ? 'var(--primary)' : 'var(--bg-main)',
              color: tab === 'tickets' ? 'white' : 'var(--text-main)'
            }}
          >
            My Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setTab('chat')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: tab === 'chat' ? 'var(--primary)' : 'var(--bg-main)',
              color: tab === 'chat' ? 'white' : 'var(--text-main)'
            }}
          >
            Live Chat
          </button>
        </div>

        {/* Tab 1: Submit Form */}
        {tab === 'new' && (
          <div>
            {submittedSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#10b981' }}>
                <IconCheck size={40} />
                <h3 style={{ marginTop: '10px' }}>Ticket Submitted!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting to your tickets list...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                    {formError}
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Order Delivery Inquiry">Order Delivery Inquiry</option>
                    <option value="Item Quality / Damaged Goods">Item Quality / Damaged Goods</option>
                    <option value="Refund or Cancellation Request">Refund or Cancellation Request</option>
                    <option value="Payment / Billing Issue">Payment / Billing Issue</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Subject *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Brief description of the problem..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Detailed Message *
                  </label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Provide order number or details so we can resolve it quickly..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-primary"
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.95rem' }}
                >
                  <IconSend size={16} />
                  <span>Submit Support Request</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: My Tickets */}
        {tab === 'tickets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <p>No support tickets filed yet.</p>
              </div>
            ) : (
              tickets.map(t => (
                <div key={t.id} style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>{t.subject}</h4>
                    <span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : t.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-danger'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Category: <strong>{t.category}</strong> • Ticket #{t.id}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{t.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Live Chat */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
            <div style={{ flex: '1', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              {chatMessages.map(m => (
                <div 
                  key={m.id}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                    color: m.sender === 'user' ? 'white' : 'var(--text-main)',
                    padding: '8px 14px',
                    borderRadius: '14px',
                    maxWidth: '80%',
                    fontSize: '0.88rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input 
                type="text" 
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: '1' }}
              />
              <button type="submit" className="btn-primary">
                <IconSend size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
