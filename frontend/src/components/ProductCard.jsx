import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IconCart, IconHeart, IconPlus, IconMinus } from './Icons';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, wishlist, toggleWishlist, cartItems, updateQuantity } = useCart();
  const [qty, setQty] = useState(1);

  const isWishlisted = wishlist.some(p => p.id === product.id);
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const inStock = product.stockQuantity > 0;
  const isLowStock = inStock && product.stockQuantity <= (product.reorderLevel || 10);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, qty);
    setQty(1);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div 
      className="glass-card" 
      onClick={() => onSelectProduct(product)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      {/* Image Container with Badges */}
      <div style={{ position: 'relative', height: '180px', width: '100%', background: '#f1f5f9', overflow: 'hidden' }}>
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"} 
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Stock Status Badge */}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          {!inStock ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge badge-warning">Only {product.stockQuantity} Left!</span>
          ) : (
            <span className="badge badge-success">In Stock</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isWishlisted ? '#ef4444' : '#64748b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <IconHeart size={16} filled={isWishlisted} />
        </button>
      </div>

      {/* Product Content Details */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
            {product.category?.name || product.categoryName || 'Groceries'}
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)', lineHeight: 1.3 }}>
            {product.name}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        </div>

        <div>
          {/* Price & Unit */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
              Rs. {Number(product.price).toFixed(2)}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              / {product.unit || 'unit'}
            </span>
          </div>

          {/* Action Row */}
          {cartItem ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary-light)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}
            >
              <button 
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-hover)', fontWeight: 'bold' }}
              >
                <IconMinus size={14} />
              </button>
              <span style={{ fontWeight: '700', color: 'var(--primary-hover)', fontSize: '0.9rem' }}>
                {cartItem.quantity} in Cart
              </span>
              <button 
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-hover)', fontWeight: 'bold' }}
              >
                <IconPlus size={14} />
              </button>
            </div>
          ) : (
            <button
              disabled={!inStock}
              onClick={handleAdd}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.88rem', opacity: inStock ? 1 : 0.6 }}
            >
              <IconCart size={16} />
              <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
