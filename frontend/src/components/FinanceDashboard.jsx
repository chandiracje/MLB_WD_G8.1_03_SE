import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IconDollar, IconBarChart, IconCheck, IconX } from './Icons';

export const FinanceDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadLiveOrders();
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

  const totalCollected = transactions.filter(t => t.status !== 'REFUNDED').reduce((acc, t) => acc + t.amount, 0);
  const totalRefunded = transactions.filter(t => t.status === 'REFUNDED').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Finance & Payment Records</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time revenue monitoring, payment gateway audits, transaction logs, and customer receipts</p>
      </div>

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
        <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Customer Payment Transaction Ledger</h3>
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

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>LankaFresh Supermarket</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Customer Purchase Receipt</div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><IconX size={20} /></button>
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
