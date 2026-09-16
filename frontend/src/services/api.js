const API_BASE_URL = '/api';

// Initial local sample data used as instant fallback or seeding
export const initialSampleProducts = [
  { id: 1, name: "Organic Fresh Bananas", description: "Farm-fresh sweet Cavendish bananas, rich in potassium and energy.", price: 350.00, unit: "kg", stockQuantity: 50, reorderLevel: 15, categoryId: 1, categoryName: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80" },
  { id: 2, name: "Fresh Red Apples", description: "Crisp and juicy Royal Gala apples imported directly from orchards.", price: 780.00, unit: "kg", stockQuantity: 30, reorderLevel: 10, categoryId: 1, categoryName: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80" },
  { id: 3, name: "Highland Fresh Pasteurized Milk", description: "1L pure whole dairy milk rich in calcium and vitamin D.", price: 480.00, unit: "1L Bottle", stockQuantity: 40, reorderLevel: 12, categoryId: 2, categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80" },
  { id: 4, name: "Kotmale Cheddar Cheese 200g", description: "Premium aged natural cheddar cheese block with rich creamy texture.", price: 890.00, unit: "Pack", stockQuantity: 25, reorderLevel: 8, categoryId: 2, categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80" },
  { id: 5, name: "Farm Fresh Brown Eggs (10-pack)", description: "Grade A farm fresh cage-free eggs with guaranteed quality.", price: 560.00, unit: "Pack", stockQuantity: 35, reorderLevel: 10, categoryId: 2, categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=600&q=80" },
  { id: 6, name: "Ceylon Pure Green Tea 100g", description: "Hand-picked premium loose-leaf Ceylon green tea with natural antioxidants.", price: 650.00, unit: "Box", stockQuantity: 45, reorderLevel: 15, categoryId: 3, categoryName: "Beverages", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80" },
  { id: 7, name: "Fresh Orange Juice 1L", description: "100% natural cold pressed orange juice with no added sugar.", price: 720.00, unit: "Bottle", stockQuantity: 8, reorderLevel: 10, categoryId: 3, categoryName: "Beverages", imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80" },
  { id: 8, name: "Artisan Sourdough Bread 450g", description: "Naturally fermented crusty artisan sourdough bread baked fresh daily.", price: 420.00, unit: "Loaf", stockQuantity: 18, reorderLevel: 5, categoryId: 4, categoryName: "Bakery & Snacks", imageUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80" },
  { id: 9, name: "Fresh Chicken Breast Boneless 500g", description: "Tender and skinless fresh chicken breast cuts, antibiotic free.", price: 1150.00, unit: "500g Pack", stockQuantity: 20, reorderLevel: 6, categoryId: 5, categoryName: "Meat & Seafood", imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80" },
  { id: 10, name: "Premium Basmati Rice 5kg", description: "Long-grain fragrant aged royal basmati rice for festive meals.", price: 2350.00, unit: "5kg Bag", stockQuantity: 60, reorderLevel: 20, categoryId: 6, categoryName: "Pantry & Staples", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80" }
];

export const initialCategories = [
  { id: 1, name: "Fresh Produce" },
  { id: 2, name: "Dairy & Eggs" },
  { id: 3, name: "Beverages" },
  { id: 4, name: "Bakery & Snacks" },
  { id: 5, name: "Meat & Seafood" },
  { id: 6, name: "Pantry & Staples" }
];

export const initialPromotions = [
  { id: 1, name: "Weekend Fresh Harvest Sale", description: "Get 15% OFF on organic fruits and vegetables!", discountPercentage: 15, code: "WEEKEND15" },
  { id: 2, name: "Dairy Saver Week", description: "Save 10% on artisan cheeses and pasteurized milk", discountPercentage: 10, code: "DAIRY10" }
];

// Helper to handle API requests with fallback
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'API error' }));
      throw new Error(err.message || 'Request failed');
    }
    return await res.json();
  } catch (error) {
    console.warn(`Backend endpoint ${endpoint} unavailable, using local mock state:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (userData) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Products & Categories
  getProducts: async (categoryId, search) => {
    let url = '/products';
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return request(url);
  },

  getProductById: async (id) => request(`/products/${id}`),

  createProduct: async (productData, categoryId) => {
    return request(`/products${categoryId ? `?categoryId=${categoryId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct: async (id, productData, categoryId) => {
    return request(`/products/${id}${categoryId ? `?categoryId=${categoryId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  deleteProduct: async (id) => {
    return request(`/products/${id}`, { method: 'DELETE' });
  },

  getCategories: async () => request('/categories'),

  createCategory: async ({ name, parentId }) => {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, parentId: parentId || null })
    });
  },

  updateCategory: async (id, { name, parentId }) => {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, parentId: parentId || null })
    });
  },

  deleteCategory: async (id) => {
    return request(`/categories/${id}`, { method: 'DELETE' });
  },

  // Promotions
  getPromotions: async () => request('/promotions'),
  getAllPromotions: async () => request('/promotions/all'),
  createPromotion: async (promo) => {
    return request('/promotions', {
      method: 'POST',
      body: JSON.stringify(promo)
    });
  },
  updatePromotion: async (id, promo) => {
    return request(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promo)
    });
  },
  deletePromotion: async (id) => {
    return request(`/promotions/${id}`, { method: 'DELETE' });
  },

  // Inventory
  getLowStock: async () => request('/inventory/low-stock'),
  adjustStock: async (productId, userId, quantityChange, reason, userEmail) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('email', userEmail);
    const qs = params.toString();
    return request(`/inventory/adjust/${productId}${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify({ quantityChange, reason })
    });
  },
  getAdjustmentHistory: async (productId) => {
    return request(`/inventory/history${productId ? `?productId=${productId}` : ''}`);
  },

  // Cart
  getCart: async (userId) => request(`/cart/${userId}`),
  addToCart: async (userId, productId, quantity) => {
    return request(`/cart/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },
  updateCartItem: async (itemId, quantity) => {
    return request(`/cart/item/${itemId}?quantity=${quantity}`, { method: 'PUT' });
  },
  removeCartItem: async (itemId) => {
    return request(`/cart/item/${itemId}`, { method: 'DELETE' });
  },
  clearCart: async (userId) => {
    return request(`/cart/${userId}/clear`, { method: 'DELETE' });
  },

  // Orders
  checkout: async (userId, orderData) => {
    return request(`/orders/checkout/${userId}`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  checkoutGuest: async (orderData) => {
    return request('/orders/checkout/guest', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  getUserProfile: async (userId) => request(`/auth/profile/${userId}`),
  updateUserProfile: async (userId, profileData) => {
    return request(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },
  getUserOrders: async (userId) => request(`/orders/user/${userId}`),
  getOrderByTracking: async (trackingNumber) => request(`/orders/track/${encodeURIComponent(trackingNumber)}`),
  getAllOrders: async () => request('/orders'),
  getOrderItems: async (orderId) => request(`/orders/${orderId}/items`),
  updateOrderStatus: async (orderId, status) => {
    return request(`/orders/${orderId}/status?status=${status}`, { method: 'PUT' });
  },

  // Wishlist
  getWishlist: async (userId) => request(`/wishlist/${userId}`),
  addToWishlist: async (userId, productId) => request(`/wishlist/${userId}/${productId}`, { method: 'POST' }),
  removeFromWishlist: async (userId, productId) => request(`/wishlist/${userId}/${productId}`, { method: 'DELETE' }),

  // Deliveries
  getAllDeliveries: async () => request('/deliveries'),
  getStaffDeliveries: async (staffId) => request(`/deliveries/staff/${staffId}`),
  assignDeliveryStaff: async (deliveryId, staffId, estimatedTime) => {
    return request(`/deliveries/${deliveryId}/assign?staffId=${staffId}${estimatedTime ? `&estimatedTime=${estimatedTime}` : ''}`, { method: 'PUT' });
  },
  updateDeliveryStatus: async (deliveryId, status, notes) => {
    return request(`/deliveries/${deliveryId}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`, { method: 'PUT' });
  },

  // Support
  createTicket: async (userId, ticketData) => {
    return request(`/support/${userId}`, {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  },
  getUserTickets: async (userId) => request(`/support/user/${userId}`),
  getAllTickets: async () => request('/support'),
  getTicketById: async (ticketId) => request(`/support/${ticketId}`),
  updateTicketStatus: async (ticketId, status) => {
    return request(`/support/${ticketId}/status?status=${status}`, { method: 'PUT' });
  },
  addTicketReply: async (ticketId, replyData) => {
    return request(`/support/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify(replyData)
    });
  },
  deleteTicket: async (ticketId) => {
    return request(`/support/${ticketId}`, { method: 'DELETE' });
  },

  // Procurement
  getSuppliers: async () => request('/procurement/suppliers'),
  getSupplierById: async (id) => request(`/procurement/suppliers/${id}`),
  createSupplier: async (supplierData) => {
    return request('/procurement/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  },
  updateSupplier: async (id, supplierData) => {
    return request(`/procurement/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData)
    });
  },
  deleteSupplier: async (id) => {
    return request(`/procurement/suppliers/${id}`, {
      method: 'DELETE'
    });
  },
  getPurchaseOrders: async () => request('/procurement/orders'),
  createPurchaseOrder: async (supplierId, userId, totalCost) => {
    return request(`/procurement/orders?supplierId=${supplierId}&userId=${userId}&totalCost=${totalCost}`, { method: 'POST' });
  },
  updatePoStatus: async (poId, status) => {
    return request(`/procurement/orders/${poId}/status?status=${status}`, { method: 'PUT' });
  },

  // Analytics
  getDashboardStats: async () => request('/analytics/stats')
};
