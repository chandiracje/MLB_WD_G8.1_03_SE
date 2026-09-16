import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('lankafresh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('lankafresh_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [toast, setToast] = useState(null);
  const [activePromotions, setActivePromotions] = useState([]);

  const refreshPromotions = async () => {
    try {
      const res = await api.getPromotions();
      if (Array.isArray(res) && res.length > 0) {
        setActivePromotions(res);
      }
    } catch (e) {
      console.warn("Could not fetch active promotions:", e.message);
    }
  };

  useEffect(() => {
    refreshPromotions();
  }, []);

  useEffect(() => {
    localStorage.setItem('lankafresh_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('lankafresh_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (user?.id) {
      api.getWishlist(user.id).then(res => {
        if (res && res.length > 0) {
          const prods = res.map(w => w.product).filter(Boolean);
          setWishlist(prods);
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (product.stockQuantity < newQty) {
          showToast(`Only ${product.stockQuantity} items in stock!`, 'danger');
          return prev;
        }
        showToast(`Updated "${product.name}" quantity (${newQty})`);
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      } else {
        if (product.stockQuantity < quantity) {
          showToast(`Only ${product.stockQuantity} items in stock!`, 'danger');
          return prev;
        }
        showToast(`Added "${product.name}" to cart`);
        return [...prev, { id: Date.now(), product, quantity }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        if (item.product.stockQuantity < quantity) {
          showToast(`Maximum stock available: ${item.product.stockQuantity}`, 'danger');
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    setCartItems([]);
    setPromoCode('');
    setDiscountPercent(0);
  };

  const toggleWishlist = async (product) => {
    const exists = wishlist.some(p => p.id === product.id);
    if (exists) {
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      showToast(`Removed "${product.name}" from wishlist`);
      if (user?.id) {
        try { await api.removeFromWishlist(user.id, product.id); } catch (e) {}
      }
    } else {
      setWishlist(prev => [...prev, product]);
      showToast(`Added "${product.name}" to wishlist`);
      if (user?.id) {
        try { await api.addToWishlist(user.id, product.id); } catch (e) {}
      }
    }
  };

  const applyPromo = (code) => {
    if (!code) return false;
    const clean = code.trim().toUpperCase();

    // Check loaded active promotions from backend/database
    const found = activePromotions.find(p => p.code && p.code.trim().toUpperCase() === clean);
    if (found) {
      const discount = Number(found.discountPercentage) || 0;
      setPromoCode(clean);
      setDiscountPercent(discount);
      showToast(`Promo Code '${clean}' applied! ${discount}% OFF`);
      return true;
    }

    // Static fallback codes
    if (clean === 'WEEKEND15') {
      setPromoCode(clean);
      setDiscountPercent(15);
      showToast("Promo Code 'WEEKEND15' applied! 15% OFF");
      return true;
    } else if (clean === 'DAIRY10') {
      setPromoCode(clean);
      setDiscountPercent(10);
      showToast("Promo Code 'DAIRY10' applied! 10% OFF");
      return true;
    } else {
      showToast(`Invalid or expired Promo Code '${clean}'`, "danger");
      return false;
    }
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const deliveryFee = subtotal > 3000 || subtotal === 0 ? 0 : 250;
  const total = subtotal - discountAmount + deliveryFee;
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      wishlist,
      cartCount,
      subtotal,
      discountAmount,
      deliveryFee,
      total,
      promoCode,
      discountPercent,
      activePromotions,
      refreshPromotions,
      toast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      applyPromo,
      showToast
    }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'danger' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideUp 0.2s ease'
        }}>
          <span>{toast.message}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
