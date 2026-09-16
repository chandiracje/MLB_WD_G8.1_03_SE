import React from 'react';
import { useCart } from '../context/CartContext';
import { IconClock, IconShield, IconTruck } from './Icons';

export const HeroBanner = ({ categories, selectedCategory, onSelectCategory }) => {
  const { applyPromo, activePromotions } = useCart();

  // Fallback if no promotions loaded yet
  const displayedPromos = activePromotions && activePromotions.length > 0
    ? activePromotions
    : [
        { id: 1, name: "Weekend Fresh Harvest Sale", code: "WEEKEND15", discountPercentage: 15 },
        { id: 2, name: "Dairy Super Saver", code: "DAIRY10", discountPercentage: 10 }
      ];

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Featured Banner Hero */}
      <div style={{ 
        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #10b981 100%)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '36px 40px', 
        color: 'white', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px', 
        alignItems: 'center',
        boxShadow: '0 20px 40px rgba(6, 95, 70, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Circle Background */}
        <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

        <div>
          <span style={{ background: '#f59e0b', color: '#78350f', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔥 WEEKEND SUPER SAVER
          </span>
          <h1 style={{ fontSize: '2.5rem', margin: '12px 0 8px 0', lineHeight: 1.15, fontWeight: '800' }}>
            Fresh Farm Groceries <br />Direct To Your Door.
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1rem', maxWidth: '440px', marginBottom: '20px' }}>
            100% Organic fruits, fresh daily dairy, quality meats and pantry essentials. Same-day 60 minute express delivery.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {displayedPromos.slice(0, 2).map((promo, idx) => (
              <button 
                key={promo.id || idx}
                onClick={() => applyPromo(promo.code || `PROMO${promo.id}`)}
                style={idx === 0 ? {
                  background: 'white', 
                  color: '#065f46', 
                  fontWeight: '700', 
                  padding: '10px 18px', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                } : {
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.4)', 
                  fontWeight: '600', 
                  padding: '10px 18px', 
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <span>Code: <strong>{promo.code || `PROMO${promo.id}`}</strong></span>
                <span style={{ background: idx === 0 ? '#d1fae5' : 'rgba(255,255,255,0.25)', color: idx === 0 ? '#047857' : 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  {promo.discountPercentage}% OFF
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Pill Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <IconTruck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Free Express Delivery</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>On all orders above Rs. 3,000</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <IconShield size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>100% Quality Guarantee</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Instant replacements or refunds</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <IconClock size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Flexible Delivery Slots</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Choose morning, afternoon or evening</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Storefront Promotional Campaigns Showcase */}
      {displayedPromos && displayedPromos.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                🏷️ Active Promotional Campaigns & Exclusive Deals
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click voucher code or apply button to activate savings</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {displayedPromos.map(promo => (
              <div 
                key={promo.id} 
                className="glass-card" 
                style={{ 
                  padding: '18px 20px', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                      {promo.name}
                    </h4>
                    <span style={{ 
                      background: '#dcfce7', 
                      color: '#15803d', 
                      fontSize: '0.8rem', 
                      fontWeight: '800', 
                      padding: '3px 10px', 
                      borderRadius: '20px',
                      whiteSpace: 'nowrap'
                    }}>
                      🔥 {promo.discountPercentage}% OFF
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    {promo.description || "Limited time promotional campaign discount across selected supermarket categories."}
                  </p>
                  {promo.endDate && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Valid until: <strong>{new Date(promo.endDate).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <div 
                    onClick={() => applyPromo(promo.code || `PROMO${promo.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    title="Click to apply"
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Voucher:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.9rem', color: 'var(--primary)', background: 'var(--bg-hover)', padding: '3px 8px', borderRadius: '4px', border: '1px dashed var(--primary)' }}>
                      {promo.code || `PROMO${promo.id}`}
                    </span>
                  </div>
                  <button
                    onClick={() => applyPromo(promo.code || `PROMO${promo.id}`)}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    Apply Code ✨
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Bar */}
      <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button
          onClick={() => onSelectCategory(null)}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            fontWeight: '600',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            background: selectedCategory === null ? 'var(--primary)' : 'var(--bg-card)',
            color: selectedCategory === null ? 'white' : 'var(--text-main)',
            border: `1px solid ${selectedCategory === null ? 'var(--primary)' : 'var(--border)'}`,
            boxShadow: selectedCategory === null ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)'
          }}
        >
          🌟 All Categories
        </button>

        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                fontWeight: '600',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                color: isSelected ? 'white' : 'var(--text-main)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)'
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
