import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IconCart, IconHeart, IconX, IconPlus, IconMinus, IconShield, IconTruck } from './Icons';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isWishlisted = wishlist.some(p => p.id === product.id);
  const inStock = product.stockQuantity > 0;

  const handleAdd = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', padding: '0', overflow: 'hidden' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Product Image */}
          <div style={{ height: '320px', background: '#f8fafc', position: 'relative' }}>
            <img 
              src={product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"} 
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconX size={18} />
            </button>
          </div>

          {/* Details */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-success">
                  {product.category?.name || product.categoryName || 'Supermarket Fresh'}
                </span>
                <button
                  onClick={() => toggleWishlist(product)}
                  style={{ color: isWishlisted ? '#ef4444' : '#94a3b8' }}
                >
                  <IconHeart size={20} filled={isWishlisted} />
                </button>
              </div>

              <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                {product.name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
                  Rs. {Number(product.price).toFixed(2)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  per {product.unit || 'unit'}
                </span>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '18px' }}>
                {product.description}
              </p>

              {/* Guarantees */}
              <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', marginBottom: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconTruck size={16} /> 60 Min Express Delivery
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconShield size={16} /> Freshness Guaranteed
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ padding: '6px 12px', background: 'var(--bg-main)' }}
                  >
                    <IconMinus size={14} />
                  </button>
                  <span style={{ padding: '0 16px', fontWeight: '700' }}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ padding: '6px 12px', background: 'var(--bg-main)' }}
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ({product.stockQuantity} in stock)
                </span>
              </div>

              <button
                disabled={!inStock}
                onClick={handleAdd}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
              >
                <IconCart size={20} />
                <span>Add {quantity} to Cart (Rs. {(product.price * quantity).toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
