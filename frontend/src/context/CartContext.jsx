import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Clean legacy shared storage keys once on load
  useEffect(() => {
    try {
      localStorage.removeItem('lankafresh_cart');
      localStorage.removeItem('lankafresh_wishlist');
    } catch (e) {}
  }, []);

  const activeUserIdRef = useRef(user?.id);
  const activeWishlistUserIdRef = useRef(user?.id);

  // Helper to get storage keys
  const getCartKey = (userId) => userId ? `lankafresh_cart_user_${userId}` : 'lankafresh_cart_guest';
  const getWishlistKey = (userId) => userId ? `lankafresh_wishlist_user_${userId}` : 'lankafresh_wishlist_guest';

  // Initialize cart state strictly for the initial user (or guest)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const initialUser = savedUser ? JSON.parse(savedUser) : null;
      const key = getCartKey(initialUser?.id);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initialize wishlist state strictly for the initial user (or guest)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const initialUser = savedUser ? JSON.parse(savedUser) : null;
      const key = getWishlistKey(initialUser?.id);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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

  // When active user changes (Login, Logout, or Account Switch):
  useEffect(() => {
    const currentUserId = user?.id;
    activeUserIdRef.current = currentUserId;
    activeWishlistUserIdRef.current = currentUserId;

    if (currentUserId) {
      // 1. Load user-specific local cache immediately so UI doesn't lag
      const userCartKey = getCartKey(currentUserId);
      let localCart = [];
      try {
        const saved = localStorage.getItem(userCartKey);
        localCart = saved ? JSON.parse(saved) : [];
      } catch {
        localCart = [];
      }

      // Check if there was an active guest cart to merge upon login
      try {
        const guestSaved = localStorage.getItem('lankafresh_cart_guest');
        if (guestSaved) {
          const guestItems = JSON.parse(guestSaved);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            guestItems.forEach(gItem => {
              const existing = localCart.find(i => i.product.id === gItem.product.id);
              if (existing) {
                existing.quantity += gItem.quantity;
              } else {
                localCart.push(gItem);
              }
              // Sync merged items to backend database
              api.addToCart(currentUserId, gItem.product.id, gItem.quantity).catch(() => {});
            });
            localStorage.removeItem('lankafresh_cart_guest');
          }
        }
      } catch (e) {}

      setCartItems(localCart);

      // 2. Fetch authoritative database cart for this user
      api.getCart(currentUserId).then(dbItems => {
        if (activeUserIdRef.current !== currentUserId) return; // Discard if user changed
        if (Array.isArray(dbItems) && dbItems.length > 0) {
          const formatted = dbItems.map(item => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity
          }));
          setCartItems(formatted);
          localStorage.setItem(userCartKey, JSON.stringify(formatted));
        } else if (localCart.length > 0) {
          // If DB had no items but local had items, push to DB
          localCart.forEach(item => {
            api.addToCart(currentUserId, item.product.id, item.quantity).then(saved => {
              if (saved?.id) {
                setCartItems(curr => curr.map(ci => ci.product.id === item.product.id ? { ...ci, id: saved.id } : ci));
              }
            }).catch(() => {});
          });
        }
      }).catch(() => {});

      // Wishlist synchronization
      const userWishlistKey = getWishlistKey(currentUserId);
      let localWishlist = [];
      try {
        const saved = localStorage.getItem(userWishlistKey);
        localWishlist = saved ? JSON.parse(saved) : [];
      } catch {
        localWishlist = [];
      }
      setWishlist(localWishlist);

      api.getWishlist(currentUserId).then(res => {
        if (activeWishlistUserIdRef.current !== currentUserId) return;
        if (Array.isArray(res) && res.length > 0) {
          const prods = res.map(w => w.product).filter(Boolean);
          setWishlist(prods);
          localStorage.setItem(userWishlistKey, JSON.stringify(prods));
        }
      }).catch(() => {});

    } else {
      // User logged out or guest: Load guest cart and wishlist
      const guestCartKey = getCartKey(null);
      try {
        const saved = localStorage.getItem(guestCartKey);
        setCartItems(saved ? JSON.parse(saved) : []);
      } catch {
        setCartItems([]);
      }

      const guestWishlistKey = getWishlistKey(null);
      try {
        const saved = localStorage.getItem(guestWishlistKey);
        setWishlist(saved ? JSON.parse(saved) : []);
      } catch {
        setWishlist([]);
      }
    }
  }, [user?.id]);

  // Persist cartItems to the active user's dedicated storage key
  useEffect(() => {
    if (activeUserIdRef.current === user?.id) {
      const key = getCartKey(user?.id);
      localStorage.setItem(key, JSON.stringify(cartItems));
    }
  }, [cartItems, user?.id]);

  // Persist wishlist to the active user's dedicated storage key
  useEffect(() => {
    if (activeWishlistUserIdRef.current === user?.id) {
      const key = getWishlistKey(user?.id);
      localStorage.setItem(key, JSON.stringify(wishlist));
    }
  }, [wishlist, user?.id]);

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

        // Sync with backend if user is logged in
        if (user?.id) {
          api.addToCart(user.id, product.id, quantity).then(savedItem => {
            if (savedItem?.id) {
              setCartItems(curr => curr.map(item => item.product.id === product.id ? { ...item, id: savedItem.id } : item));
            }
          }).catch(e => {
            console.warn("Failed to sync addToCart to backend:", e.message);
          });
        }

        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      } else {
        if (product.stockQuantity < quantity) {
          showToast(`Only ${product.stockQuantity} items in stock!`, 'danger');
          return prev;
        }
        showToast(`Added "${product.name}" to cart`);

        // Sync with backend if user is logged in
        if (user?.id) {
          api.addToCart(user.id, product.id, quantity).then(savedItem => {
            if (savedItem?.id) {
              setCartItems(curr => curr.map(item => item.product.id === product.id ? { ...item, id: savedItem.id } : item));
            }
          }).catch(e => {
            console.warn("Failed to sync addToCart to backend:", e.message);
          });
        }

        return [...prev, { id: Date.now(), product, quantity }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => {
      const itemToUpdate = prev.find(i => i.product.id === productId);
      if (itemToUpdate && user?.id && itemToUpdate.id) {
        api.updateCartItem(itemToUpdate.id, quantity).catch(e => {
          console.warn("Failed to sync updateCartItem to backend:", e.message);
        });
      }
      return prev.map(item => {
        if (item.product.id === productId) {
          if (item.product.stockQuantity < quantity) {
            showToast(`Maximum stock available: ${item.product.stockQuantity}`, 'danger');
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => {
      const itemToRemove = prev.find(i => i.product.id === productId);
      if (itemToRemove && user?.id && itemToRemove.id) {
        api.removeCartItem(itemToRemove.id).catch(e => {
          console.warn("Failed to sync removeCartItem to backend:", e.message);
        });
      }
      return prev.filter(item => item.product.id !== productId);
    });
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    if (user?.id) {
      api.clearCart(user.id).catch(e => {
        console.warn("Failed to clear cart on backend:", e.message);
      });
    }
    const key = getCartKey(user?.id);
    localStorage.removeItem(key);
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

  const removeFromWishlist = async (productId) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
    showToast("Item removed from wishlist");
    if (user?.id) {
      try { await api.removeFromWishlist(user.id, productId); } catch (e) {}
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
      removeFromWishlist,
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
