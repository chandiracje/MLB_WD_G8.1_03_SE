import React from 'react';
import { useCart } from '../context/CartContext';
import { IconHeart, IconTrash, IconCart, IconX } from './Icons';

export const WishlistModal = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconHeart size={22} className="text-danger" filled={true} />
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>Your Wishlist ({wishlist.length})</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <IconX size={20} />
          </button>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❤️</div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>Your wishlist is empty</h3>
            <p style={{ fontSize: '0.85rem' }}>Save items you love by tapping the heart icon on any product.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
            {wishlist.map(product => (
              <div 
                key={product.id}
                style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              >
                <img 
                  src={product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80"} 
                  alt={product.name}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
                <div style={{ flex: '1' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {product.name}
                  </h4>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '800' }}>
                    Rs. {Number(product.price).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <IconCart size={14} /> Add
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    style={{ color: '#ef4444', padding: '6px' }}
                    title="Remove from wishlist"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
