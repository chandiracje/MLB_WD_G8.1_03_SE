import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IconCart, IconTrash, IconX, IconPlus, IconMinus, IconTruck } from './Icons';

export const CartDrawer = ({ isOpen, onClose, onProceedCheckout }) => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    discountAmount, 
    deliveryFee, 
    total, 
    promoCode, 
    applyPromo, 
    clearCart 
  } = useCart();

  const [inputCode, setInputCode] = useState('');

  if (!isOpen) return null;

  const freeDeliveryThreshold = 3000;
  const progressToFree = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content">
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCart size={22} className="text-primary" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Your Cart ({cartItems.length})</h2>
          </div>
          <button 
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div style={{ background: 'var(--primary-light)', padding: '12px 20px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-hover)', fontWeight: '600', marginBottom: '6px' }}>
            <IconTruck size={16} />
            {remainingForFree === 0 ? (
              <span>🎉 Congratulations! You have unlocked <strong>FREE Express Delivery</strong>!</span>
            ) : (
              <span>Add <strong>Rs. {remainingForFree.toFixed(2)}</strong> more to get <strong>FREE Express Delivery</strong>!</span>
            )}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressToFree}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '16px 20px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '6px' }}>Your cart is empty</h3>
              <p style={{ fontSize: '0.9rem' }}>Discover our fresh fruits, dairy and bakery items to fill it up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cartItems.map(item => (
                <div 
                  key={item.product.id}
                  style={{ display: 'flex', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}
                >
                  <img 
                    src={item.product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80"} 
                    alt={item.product.name}
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />

                  <div style={{ flex: '1' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                      {item.product.name}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '6px' }}>
                      Rs. {Number(item.product.price).toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-main)' }}>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ padding: '2px 8px' }}
                        >
                          <IconMinus size={12} />
                        </button>
                        <span style={{ padding: '0 8px', fontSize: '0.85rem', fontWeight: '700' }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ padding: '2px 8px' }}
                        >
                          <IconPlus size={12} />
                        </button>
                      </div>

                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        = Rs. {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    style={{ color: '#ef4444', padding: '6px' }}
                    title="Remove item"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartItems.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            {/* Promo Code Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input 
                type="text" 
                placeholder="Promo Code (e.g. WEEKEND15)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{ flex: '1', textTransform: 'uppercase', padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button 
                onClick={() => applyPromo(inputCode)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Apply
              </button>
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: '600' }}>
                  <span>Discount ({promoCode})</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `Rs. ${deliveryFee.toFixed(2)}`}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.15rem', color: 'var(--text-main)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary)' }}>Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              <span>Proceed to Checkout</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
