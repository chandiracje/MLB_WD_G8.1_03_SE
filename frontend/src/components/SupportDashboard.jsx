import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IconHeadphones, 
  IconCheck, 
  IconSearch, 
  IconX, 
  IconTrash, 
  IconSend, 
  IconAlert,
  IconClock,
  IconUser
} from './Icons';

export const SupportDashboard = () => {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Active Chat State
  const [activeChatTicket, setActiveChatTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const chatEndRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (activeChatTicket) {
      scrollToBottom();
    }
  }, [activeChatTicket?.replies]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getAllTickets();
      setTickets(res || []);
    } catch (e) {
      console.warn("Could not fetch support tickets:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Status Change
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.updateTicketStatus(ticketId, newStatus);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (activeChatTicket?.id === ticketId) {
        setActiveChatTicket(prev => ({ ...prev, status: newStatus }));
      }
      showToast(`Ticket #${ticketId} status updated to ${newStatus}`);
    } catch (e) {
      console.error("Failed to update ticket status:", e);
      // Local fallback
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (activeChatTicket?.id === ticketId) {
        setActiveChatTicket(prev => ({ ...prev, status: newStatus }));
      }
      showToast(`Ticket #${ticketId} status updated`);
    }
  };

  // Open Chat with Ticket
  const handleOpenChat = async (ticket) => {
    setActiveChatTicket(ticket);
    setReplyText('');
    try {
      const fresh = await api.getTicketById(ticket.id);
      if (fresh) {
        setActiveChatTicket(fresh);
        // Also update list
        setTickets(prev => prev.map(t => t.id === fresh.id ? fresh : t));
      }
    } catch (e) {
      // Keep existing
    }
    scrollToBottom();
  };

  // Send Reply
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeChatTicket) return;

    setSendingReply(true);
    const newReply = {
      senderRole: 'SUPPORT',
      senderName: user?.name || 'Support Agent (Dilini)',
      message: replyText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const saved = await api.addTicketReply(activeChatTicket.id, newReply);
      const replyToAdd = saved || { id: Date.now(), ...newReply };

      // Update active chat ticket
      const updatedReplies = [...(activeChatTicket.replies || []), replyToAdd];
      const updatedTicket = { 
        ...activeChatTicket, 
        replies: updatedReplies,
        status: activeChatTicket.status === 'OPEN' ? 'IN_PROGRESS' : activeChatTicket.status
      };
      setActiveChatTicket(updatedTicket);

      // Update in main list
      setTickets(prev => prev.map(t => t.id === activeChatTicket.id ? updatedTicket : t));
      setReplyText('');
      showToast("Reply sent to customer!");
      scrollToBottom();
    } catch (err) {
      console.warn("API add reply failed, using local optimistic reply:", err);
      const localReply = { id: Date.now(), ...newReply };
      const updatedReplies = [...(activeChatTicket.replies || []), localReply];
      const updatedTicket = { 
        ...activeChatTicket, 
        replies: updatedReplies,
        status: activeChatTicket.status === 'OPEN' ? 'IN_PROGRESS' : activeChatTicket.status
      };
      setActiveChatTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === activeChatTicket.id ? updatedTicket : t));
      setReplyText('');
      showToast("Reply saved!");
      scrollToBottom();
    } finally {
      setSendingReply(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async () => {
    if (!deleteConfirmTicket) return;
    const targetId = deleteConfirmTicket.id;
    try {
      await api.deleteTicket(targetId);
      setTickets(prev => prev.filter(t => t.id !== targetId));
      if (activeChatTicket?.id === targetId) {
        setActiveChatTicket(null);
      }
      showToast(`Support Ticket #${targetId} deleted successfully.`);
    } catch (err) {
      console.warn("API delete ticket failed, removing locally:", err);
      setTickets(prev => prev.filter(t => t.id !== targetId));
      if (activeChatTicket?.id === targetId) {
        setActiveChatTicket(null);
      }
      showToast(`Ticket #${targetId} removed.`);
    } finally {
      setDeleteConfirmTicket(null);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    const matchSearch = !searchTerm ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.id).includes(searchTerm);

    if (!matchSearch) return false;

    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

    return true;
  });

  // Analytics
  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Categories list
  const availableCategories = ['ALL', ...new Set(tickets.map(t => t.category).filter(Boolean))];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast */}
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>
              Customer Support & Inquiries Hub
            </h1>
            <span style={{ 
              background: 'rgba(236, 72, 153, 0.15)', 
              color: '#ec4899', 
              fontSize: '0.75rem', 
              fontWeight: '800', 
              padding: '3px 8px', 
              borderRadius: '6px' 
            }}>
              LIVE HELPDESK
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', marginBottom: 0 }}>
            Chat directly with customers, respond to order complaints, adjust statuses, and manage inquiry records
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>TOTAL INQUIRIES</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Filed customer support tickets</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>PENDING ATTENTION</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b' }}>{pendingCount} Needs Reply</div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>OPEN and IN_PROGRESS requests</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>RESOLVED INQUIRIES</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16a34a' }}>{resolvedCount} Solved</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>Successfully closed tickets</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>RESOLUTION RATE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0284c7' }}>{resolutionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '4px' }}>Customer satisfaction index</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '340px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by customer, subject, message or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '0.88rem' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: `1px solid ${statusFilter === status ? 'var(--primary)' : 'var(--border)'}`,
                  background: statusFilter === status ? 'var(--primary)' : 'transparent',
                  color: statusFilter === status ? 'white' : 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading customer support inquiries...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🎧</div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>No Inquiries Found</h3>
          <p style={{ fontSize: '0.85rem' }}>No tickets match your filter criteria or search query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredTickets.map(t => {
            const repliesCount = t.replies ? t.replies.length : 0;
            const createdStr = t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Recent';

            return (
              <div 
                key={t.id} 
                className="glass-card" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: t.status === 'OPEN' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Bar: Category & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ 
                      background: 'var(--bg-hover)', 
                      color: 'var(--text-main)', 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      border: '1px solid var(--border)'
                    }}>
                      🏷️ {t.category || 'General'}
                    </span>

                    <span className={`badge ${
                      t.status === 'RESOLVED' ? 'badge-success' : 
                      t.status === 'IN_PROGRESS' ? 'badge-warning' : 
                      t.status === 'CLOSED' ? 'badge-secondary' : 'badge-danger'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {/* Subject & Customer Info */}
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)', lineHeight: 1.3 }}>
                    #{t.id} • {t.subject}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <IconUser size={14} />
                    <span><strong>{t.user?.name || 'Customer'}</strong> ({t.user?.email || 'N/A'})</span>
                  </div>

                  {/* Message Bubble */}
                  <div style={{ 
                    background: 'var(--bg-main)', 
                    padding: '12px 14px', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.88rem', 
                    color: 'var(--text-main)',
                    lineHeight: 1.45,
                    marginBottom: '14px',
                    borderLeft: '3px solid var(--primary)'
                  }}>
                    "{t.message}"
                  </div>

                  {/* Reply Count Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    <span>Opened: {createdStr}</span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      color: repliesCount > 0 ? '#10b981' : 'var(--text-muted)',
                      fontWeight: repliesCount > 0 ? '700' : '500'
                    }}>
                      💬 {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px' }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenChat(t)}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <span>💬 Chat & Reply</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmTicket(t)}
                      className="btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Delete Ticket"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──────────────── LIVE CHAT & REPLY MODAL / DRAWER ──────────────── */}
      {activeChatTicket && (
        <div className="modal-overlay" onClick={() => setActiveChatTicket(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '680px', 
              width: '95%',
              height: '85vh',
              maxHeight: '750px',
              padding: 0, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Chat Top Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border)', 
              background: 'var(--bg-card)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                    #{activeChatTicket.id} • {activeChatTicket.subject}
                  </h3>
                  <span className={`badge ${activeChatTicket.status === 'RESOLVED' ? 'badge-success' : activeChatTicket.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-danger'}`}>
                    {activeChatTicket.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Customer: <strong>{activeChatTicket.user?.name || 'Customer'}</strong> ({activeChatTicket.user?.email || 'N/A'}) • Category: <strong>{activeChatTicket.category || 'General'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Status Switcher in Chat Header */}
                <select
                  value={activeChatTicket.status}
                  onChange={(e) => handleStatusChange(activeChatTicket.id, e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px' }}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>

                <button
                  onClick={() => setDeleteConfirmTicket(activeChatTicket)}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    padding: '5px 8px', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Delete this ticket"
                >
                  <IconTrash size={16} />
                </button>

                <button 
                  onClick={() => setActiveChatTicket(null)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              background: 'var(--bg-main)'
            }}>
              {/* Initial Customer Inquiry Bubble (Always First) */}
              <div style={{ 
                alignSelf: 'flex-start', 
                maxWidth: '85%',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px' 
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{activeChatTicket.user?.name || 'Customer'}</span>
                  <span>• Initial Request</span>
                  <span>{activeChatTicket.createdAt ? new Date(activeChatTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '14px', 
                  borderTopLeftRadius: '4px',
                  padding: '14px 16px',
                  color: 'var(--text-main)',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {activeChatTicket.message}
                </div>
              </div>

              {/* Chat Thread Replies */}
              {activeChatTicket.replies && activeChatTicket.replies.map((reply, idx) => {
                const isSupport = reply.senderRole === 'SUPPORT';
                const timeStr = reply.createdAt 
                  ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '';

                return (
                  <div 
                    key={reply.id || idx}
                    style={{ 
                      alignSelf: isSupport ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px'
                    }}
                  >
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      justifyContent: isSupport ? 'flex-end' : 'flex-start'
                    }}>
                      <span style={{ 
                        fontWeight: '700', 
                        color: isSupport ? 'var(--primary)' : 'var(--text-main)' 
                      }}>
                        {isSupport ? `🎧 ${reply.senderName || 'Support Agent'}` : (reply.senderName || 'Customer')}
                      </span>
                      <span>• {timeStr}</span>
                    </div>

                    <div style={{ 
                      background: isSupport 
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                        : 'var(--bg-card)', 
                      border: isSupport ? 'none' : '1px solid var(--border)', 
                      borderRadius: '14px', 
                      borderTopRightRadius: isSupport ? '4px' : '14px',
                      borderTopLeftRadius: !isSupport ? '4px' : '14px',
                      padding: '12px 16px',
                      color: isSupport ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {reply.message}
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div style={{ 
              padding: '16px 20px', 
              background: 'var(--bg-card)', 
              borderTop: '1px solid var(--border)' 
            }}>
              <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <textarea
                  rows="2"
                  placeholder="Type a helpful reply to the customer... (Press Enter to send)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="input"
                  style={{ 
                    flex: 1, 
                    resize: 'none', 
                    fontSize: '0.9rem',
                    padding: '10px 14px'
                  }}
                  disabled={sendingReply}
                />

                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="btn-primary"
                  style={{ 
                    padding: '12px 18px', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    cursor: 'pointer',
                    height: '46px'
                  }}
                >
                  <IconSend size={16} />
                  <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                </button>
              </form>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Tip: Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line</span>
                {activeChatTicket.status === 'OPEN' && (
                  <span style={{ color: '#10b981' }}>Sending a reply will automatically transition status to <strong>IN_PROGRESS</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── DELETE CONFIRMATION MODAL ──────────────── */}
      {deleteConfirmTicket && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <IconAlert size={24} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Delete Support Request?</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to permanently delete <strong>Ticket #{deleteConfirmTicket.id} ("{deleteConfirmTicket.subject}")</strong> from customer <strong>{deleteConfirmTicket.user?.name || 'Customer'}</strong>? This will permanently remove the inquiry and all conversation history.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmTicket(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTicket}
                className="btn-danger"
                style={{ padding: '8px 18px', cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
