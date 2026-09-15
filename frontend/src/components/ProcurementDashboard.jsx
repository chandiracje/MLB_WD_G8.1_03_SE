import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconBuilding, IconPlus, IconCheck, IconX } from './Icons';

export const ProcurementDashboard = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);

  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poCost, setPoCost] = useState('');

  useEffect(() => {
    loadProcurement();
  }, []);

  const loadProcurement = async () => {
    try {
      const s = await api.getSuppliers();
      setSuppliers(s || []);
      if (s && s.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(String(s[0].id));
      }
      const o = await api.getPurchaseOrders();
      setPos(o || []);
    } catch (e) {
      console.warn("Could not fetch procurement data:", e.message);
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    const supId = parseInt(selectedSupplierId) || (suppliers[0] ? suppliers[0].id : 1);
    const cost = parseFloat(poCost) || 15000;

    try {
      await api.createPurchaseOrder(supId, user?.id || 1, cost);
      loadProcurement();
    } catch (e) {
      console.error("Create PO failed:", e);
    }

    setIsPoModalOpen(false);
    setPoCost('');
  };

  const handleStatusChange = async (poId, status) => {
    try {
      await api.updatePoStatus(poId, status);
      loadProcurement();
    } catch (e) {
      console.error("Update PO status failed:", e);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Procurement & Supplier Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sourcing goods, purchase order tracking, and supplier contact directory</p>
        </div>

        <button onClick={() => setIsPoModalOpen(true)} className="btn-primary">
          <IconPlus size={18} /> Create Purchase Order
        </button>
      </div>

      {/* Suppliers Grid */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Registered Goods Suppliers</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {suppliers.map(s => (
          <div key={s.id} className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
                <IconBuilding size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{s.name}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contact: {s.contactName}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div>📞 {s.phone}</div>
              <div>✉️ {s.email}</div>
              <div>📍 {s.address}</div>
            </div>
          </div>
        ))}
      </div>

      {/* POs Table */}
      <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Purchase Orders (Restock Restock Pipeline)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px' }}>PO Number</th>
              <th style={{ padding: '10px' }}>Supplier</th>
              <th style={{ padding: '10px' }}>Estimated Cost</th>
              <th style={{ padding: '10px' }}>Date</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Update</th>
            </tr>
          </thead>
          <tbody>
            {pos.map(po => (
              <tr key={po.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 10px', fontWeight: '700' }}>PO #{po.id}</td>
                <td style={{ padding: '10px' }}>{po.supplier?.name}</td>
                <td style={{ padding: '10px', fontWeight: '800' }}>Rs. {Number(po.totalCost).toLocaleString()}</td>
                <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{po.createdAt}</td>
                <td style={{ padding: '10px' }}>
                  <span className={`badge ${po.status === 'RECEIVED' ? 'badge-success' : po.status === 'SENT' ? 'badge-warning' : 'badge-danger'}`}>
                    {po.status}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  <select
                    value={po.status}
                    onChange={(e) => handleStatusChange(po.id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="SENT">SENT</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create PO Modal */}
      {isPoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPoModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Generate Purchase Order</h2>
              <button onClick={() => setIsPoModalOpen(false)}><IconX size={20} /></button>
            </div>

            <form onSubmit={handleCreatePo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Select Supplier *</label>
                <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} style={{ width: '100%' }}>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contactName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Estimated Batch Order Cost (Rs.) *</label>
                <input type="number" required placeholder="e.g. 35000" value={poCost} onChange={(e) => setPoCost(e.target.value)} style={{ width: '100%' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '12px', marginTop: '6px' }}>
                Issue Purchase Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
