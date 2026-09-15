import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  IconCart, 
  IconHeart, 
  IconSearch, 
  IconSun, 
  IconMoon, 
  IconUser, 
  IconTruck, 
  IconHeadphones, 
  IconBarChart, 
  IconPackage, 
  IconDollar, 
  IconBuilding 
} from './Icons';

export const Navbar = ({ 
  searchTerm, 
  setSearchTerm, 
  onOpenCart, 
  onOpenWishlist, 
  onOpenTracker, 
  onOpenSupport, 
  onOpenAuth,
  activeTab,
  setActiveTab
}) => {
  const { user, logout, isStaff } = useAuth();
  const { cartCount, wishlist, total } = useCart();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme ? 'dark' : 'light');
  };

  const getStaffBadge = (role) => {
    switch(role) {
      case 'MANAGER': return { label: 'Branch Manager', icon: '🏢', color: '#8b5cf6' };
      case 'INVENTORY_STAFF': return { label: 'Inventory Controller', icon: '📦', color: '#f59e0b' };
      case 'DELIVERY_STAFF': return { label: 'Delivery Staff', icon: '🚚', color: '#0ea5e9' };
      case 'SUPPORT_STAFF': return { label: 'Support Agent', icon: '🎧', color: '#ec4899' };
      case 'FINANCE_OFFICER': return { label: 'Finance Officer', icon: '💰', color: '#10b981' };
      default: return { label: 'Staff Member', icon: '👔', color: '#64748b' };
    }
  };

  const staffInfo = isStaff ? getStaffBadge(user.role) : null;

  return (
    <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Banner - No public role dropdowns */}
      <div style={{ 
        background: isStaff 
          ? 'linear-gradient(90deg, #1e293b 0%, #334155 100%)' 
          : 'linear-gradient(90deg, #059669 0%, #10b981 100%)', 
        color: 'white', 
        padding: '6px 20px', 
        fontSize: '0.82rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '8px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          {isStaff ? (
            <span>🛡️ <strong>Staff Workspace Mode</strong> — Logged in as {user.name} ({staffInfo.label})</span>
          ) : (
            <span>🌿 <strong>LankaFresh Express</strong>: Fresh Organic Groceries Delivered in 60 Mins! Hotline: 011-2345678</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem' }}>
          {isStaff ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: staffInfo.color, padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '0.75rem' }}>
                {staffInfo.icon} {staffInfo.label}
              </span>
              <button 
                onClick={logout}
                style={{ color: '#fca5a5', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ opacity: 0.9 }}>📍 Colombo Express Hub</span>
              <span style={{ opacity: 0.9 }}>⚡ Open 6 AM – 11 PM</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('store')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
            <span style={{ fontSize: '1.4rem' }}>🛒</span>
          </div>
          <div>
            <div className="brand-font" style={{ fontSize: '1.35rem', color: 'var(--text-main)', lineHeight: 1.1 }}>
              Lanka<span style={{ color: 'var(--primary)' }}>Fresh</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em', fontWeight: '600' }}>
              ONLINE SUPERMARKET
            </div>
          </div>
        </div>

        {/* Search Bar (Visible on store view) */}
        {activeTab === 'store' && (
          <div style={{ flex: '1', maxWidth: '480px', position: 'relative' }}>
            <input 
              type="text"
              placeholder="Search 1000+ fresh items (e.g. Milk, Bananas, Rice, Tea)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', height: '42px', borderRadius: 'var(--radius-full)' }}
            />
            <div style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-muted)' }}>
              <IconSearch size={18} />
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Toggler */}
          <button 
            onClick={toggleTheme} 
            title="Toggle Light/Dark Theme"
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', background: 'var(--bg-card)', cursor: 'pointer' }}
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>

          {/* Customer / Storefront Navigation */}
          {activeTab === 'store' && (
            <>
              <button 
                onClick={onOpenTracker}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
              >
                <IconTruck size={17} />
                <span style={{ display: 'inline' }}>Track Order</span>
              </button>

              <button 
                onClick={onOpenSupport}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
              >
                <IconHeadphones size={17} />
                <span style={{ display: 'inline' }}>Help</span>
              </button>

              <button 
                onClick={onOpenWishlist}
                title="Wishlist"
                style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', background: 'var(--bg-card)', cursor: 'pointer' }}
              >
                <IconHeart size={18} />
                {wishlist.length > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '0.65rem', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button 
                onClick={onOpenCart}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <IconCart size={18} />
                <span>Cart ({cartCount})</span>
                {total > 0 && (
                  <span style={{ marginLeft: '4px', borderLeft: '1px solid rgba(255,255,255,0.4)', paddingLeft: '8px', fontWeight: 'bold' }}>
                    Rs. {total.toFixed(0)}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Customer Switch between Store & Personal Account Dashboard */}
          {user && user.role === 'CUSTOMER' && (
            <button
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'store' : 'dashboard')}
              style={{
                background: activeTab === 'dashboard' ? 'var(--bg-main)' : 'var(--primary-light)',
                color: activeTab === 'dashboard' ? 'var(--text-main)' : 'var(--primary)',
                border: `1px solid ${activeTab === 'dashboard' ? 'var(--border)' : 'var(--primary)'}`,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              {activeTab === 'dashboard' ? (
                <>🛒 Browse Store</>
              ) : (
                <>👤 My Account & Orders</>
              )}
            </button>
          )}

          {/* Staff Switch between Store & Personal Dashboard */}
          {isStaff && (
            <button
              onClick={() => setActiveTab(activeTab === 'store' ? 'dashboard' : 'store')}
              style={{
                background: activeTab === 'dashboard' ? 'var(--bg-main)' : 'var(--primary)',
                color: activeTab === 'dashboard' ? 'var(--text-main)' : 'white',
                border: activeTab === 'dashboard' ? '1px solid var(--border)' : 'none',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              {activeTab === 'dashboard' ? (
                <>🛒 Browse Store</>
              ) : (
                <>{staffInfo.icon} My {staffInfo.label} Portal</>
              )}
            </button>
          )}

          {/* User Account / Sign In Button */}
          {user ? (
            <button 
              onClick={onOpenAuth}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: '26px', 
                height: '26px', 
                borderRadius: '50%', 
                background: isStaff ? staffInfo.color : 'var(--primary)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.75rem', 
                fontWeight: 'bold' 
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IconUser size={16} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
