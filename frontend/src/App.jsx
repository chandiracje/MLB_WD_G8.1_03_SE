import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { api, initialSampleProducts, initialCategories } from './services/api';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { WishlistModal } from './components/WishlistModal';
import { SupportModal } from './components/SupportModal';
import { AuthModal } from './components/AuthModal';

import { CustomerDashboard } from './components/CustomerDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { InventoryDashboard } from './components/InventoryDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { SupportDashboard } from './components/SupportDashboard';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ProcurementDashboard } from './components/ProcurementDashboard';

function MainApp() {
  const { user, isStaff } = useAuth();
  
  // Data states
  const [products, setProducts] = useState(initialSampleProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'price-low', 'price-high'

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('store'); // 'store' or 'dashboard'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeTrackingCode, setActiveTrackingCode] = useState('');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchTerm]);

  const loadCatalog = async () => {
    try {
      const p = await api.getProducts(selectedCategory, searchTerm);
      if (p && p.length > 0) setProducts(p);
      const c = await api.getCategories();
      if (c && c.length > 0) setCategories(c);
    } catch (e) {
      // Filter locally
      let filtered = [...initialSampleProducts];
      if (selectedCategory) {
        filtered = filtered.filter(item => item.categoryId === selectedCategory);
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q)
        );
      }
      setProducts(filtered);
    }
  };

  // Sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return b.stockQuantity - a.stockQuantity;
  });

  const handleOrderPlaced = (newOrder) => {
    setPlacedOrders(prev => [newOrder, ...prev]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main style={{ flex: '1' }}>
        {activeTab === 'store' ? (
          <div>
            {/* Promotional Hero Banner */}
            <HeroBanner 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Catalog Grid Section */}
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 60px 20px' }}>
              {/* Filter bar summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>
                    {selectedCategory 
                      ? categories.find(c => c.id === selectedCategory)?.name || 'Category Items'
                      : searchTerm 
                      ? `Search Results for "${searchTerm}"`
                      : 'Featured Supermarket Groceries'
                    }
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Showing {sortedProducts.length} fresh products
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="popular">🔥 Most Popular</option>
                    <option value="price-low">💵 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {sortedProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔍</div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '8px' }}>No products found</h3>
                  <p style={{ fontSize: '0.9rem' }}>Try searching with different keywords or browse all categories.</p>
                  <button 
                    onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                    className="btn-primary" 
                    style={{ marginTop: '16px' }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {sortedProducts.map(p => (
                    <ProductCard 
                      key={p.id}
                      product={p}
                      onSelectProduct={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Role Dashboard Area - Customer Account Portal or Staff Hub */
          <div style={{ background: 'var(--bg-main)', minHeight: 'calc(100vh - 120px)' }}>
            {!user ? (
              <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 24px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👤</div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '8px' }}>Sign In to View Your Account</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
                  Please sign in or register to access your personalized customer profile, live order tracking history, saved wishlist, and customer support tickets.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.95rem' }}
                  >
                    👤 Sign In / Register
                  </button>
                  <button 
                    onClick={() => setActiveTab('store')}
                    className="btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.95rem' }}
                  >
                    🛒 Back to Store
                  </button>
                </div>
              </div>
            ) : user.role === 'CUSTOMER' ? (
              <CustomerDashboard 
                onBackToStore={() => setActiveTab('store')}
                onOpenTracker={(trackingCode) => {
                  setActiveTrackingCode(trackingCode || '');
                  setIsTrackerOpen(true);
                }}
              />
            ) : user.role === 'INVENTORY_STAFF' ? (
              <div>
                <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 20px', fontSize: '0.85rem', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📦 <strong>Inventory Management Workspace</strong> | Controller: {user.name} ({user.email})</span>
                  <button onClick={() => setActiveTab('store')} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#92400e', cursor: 'pointer' }}>View Storefront →</button>
                </div>
                <InventoryDashboard />
              </div>
            ) : user.role === 'DELIVERY_STAFF' ? (
              <div>
                <div style={{ background: '#e0f2fe', borderBottom: '1px solid #bae6fd', padding: '10px 20px', fontSize: '0.85rem', color: '#0369a1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🚚 <strong>Delivery & Dispatch Operations Hub</strong> | Personnel: {user.name} ({user.email})</span>
                  <button onClick={() => setActiveTab('store')} style={{ background: 'white', border: '1px solid #bae6fd', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#0369a1', cursor: 'pointer' }}>View Storefront →</button>
                </div>
                <DeliveryDashboard />
              </div>
            ) : user.role === 'SUPPORT_STAFF' ? (
              <div>
                <div style={{ background: '#fce7f3', borderBottom: '1px solid #fbcfe8', padding: '10px 20px', fontSize: '0.85rem', color: '#be185d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🎧 <strong>Customer Support Desk</strong> | Support Agent: {user.name} ({user.email})</span>
                  <button onClick={() => setActiveTab('store')} style={{ background: 'white', border: '1px solid #fbcfe8', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#be185d', cursor: 'pointer' }}>View Storefront →</button>
                </div>
                <SupportDashboard />
              </div>
            ) : user.role === 'FINANCE_OFFICER' ? (
              <div>
                <div style={{ background: '#dcfce7', borderBottom: '1px solid #bbf7d0', padding: '10px 20px', fontSize: '0.85rem', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💰 <strong>Finance & Transaction Ledger</strong> | Officer: {user.name} ({user.email})</span>
                  <button onClick={() => setActiveTab('store')} style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#166534', cursor: 'pointer' }}>View Storefront →</button>
                </div>
                <FinanceDashboard />
              </div>
            ) : (
              /* Branch Manager (Full Admin Dashboard) */
              <div>
                <div style={{ background: '#ede9fe', borderBottom: '1px solid #ddd6fe', padding: '10px 20px', fontSize: '0.85rem', color: '#5b21b6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏢 <strong>Branch Executive Manager Workspace</strong> | Administrator: {user.name} ({user.email})</span>
                  <button onClick={() => setActiveTab('store')} style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#5b21b6', cursor: 'pointer' }}>View Storefront →</button>
                </div>
                <ManagerDashboard />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '40px 20px 24px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          <div>
            <div className="brand-font" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              Lanka<span style={{ color: 'var(--primary)' }}>Fresh</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Your trusted neighborhood online supermarket in Sri Lanka. Supplying farm fresh produce, milk, pantry staples and household essentials with guaranteed 60-minute express delivery.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '12px' }}>Quick Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li>Fresh Organic Fruits & Veggies</li>
              <li>Highland & Kotmale Dairy</li>
              <li>Pure Ceylon Teas & Juices</li>
              <li>Artisan Bakery & Daily Bread</li>
              <li>Pantry, Rice & Spices</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '12px' }}>Customer Support</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li>📞 Hotline: 011-2345678</li>
              <li>✉️ Email: support@lankafresh.lk</li>
              <li>⏰ Hours: 6:00 AM – 11:00 PM (Daily)</li>
              <li>📍 Logistics Hub: 45/2 Galle Road, Colombo</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '12px' }}>Academic Project Details</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div><strong>SLIIT Software Engineering</strong> (IT2030)</div>
              <div>Group: <strong>MLB-B8G1-03</strong> (Year 2, Semester 1)</div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#10b981' }}>
                ✓ Spring Security Role-Based Access Enabled
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © 2026 LankaFresh Supermarket (Pvt) Ltd. All rights reserved. Developed for SE2030 Software Engineering Assignment.
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        onProceedCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      <OrderTrackerModal 
        isOpen={isTrackerOpen}
        onClose={() => {
          setIsTrackerOpen(false);
          setActiveTrackingCode('');
        }}
        initialOrders={placedOrders}
        defaultTrackingCode={activeTrackingCode}
      />

      <WishlistModal 
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      <SupportModal 
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onStaffLoginSuccess={(role) => {
          setActiveTab('dashboard');
        }}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
