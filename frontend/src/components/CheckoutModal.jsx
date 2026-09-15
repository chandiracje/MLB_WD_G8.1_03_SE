import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { IconX, IconCheck, IconTruck, IconShield, IconUser } from './Icons';

// Sri Lankan phone regex (e.g. 0771234567, +94771234567, 771234567)
const SL_PHONE_REGEX = /^(?:0|\+94)?7[0-9]{8}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Luhn algorithm check for credit cards
function isValidLuhn(numStr) {
  const digits = numStr.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export const CheckoutModal = ({ isOpen, onClose, onOrderPlaced }) => {
  const { user } = useAuth();
  const { cartItems, total, clearCart, showToast } = useCart();

  // Guest vs Authenticated details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Delivery & Common details
  const [address, setAddress] = useState(user?.address || '45/2 Galle Road, Mount Lavinia');
  const [phone, setPhone] = useState(user?.phone || '0771234567');
  const [slot, setSlot] = useState('Express Delivery (Within 60 Mins)');
  
  // Payment methods: 'CARD', 'COD', 'WALLET', 'BANK'
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // COD details
  const [codChange, setCodChange] = useState('EXACT');

  // Digital Wallet details
  const [walletProvider, setWalletProvider] = useState('FriMi');
  const [walletPhone, setWalletPhone] = useState(user?.phone || '');

  // Bank Transfer details
  const [bankRef, setBankRef] = useState('');

  // Field validation errors
  const [errors, setErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  if (!isOpen) return null;

  // Format Card Number (#### #### #### ####)
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = val.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : val);
    if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: null }));
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
    if (errors.cardExpiry) setErrors(prev => ({ ...prev, cardExpiry: null }));
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'CARD': return 'Credit / Debit Card';
      case 'COD': return 'Cash on Delivery';
      case 'WALLET': return `${walletProvider} Mobile Pay`;
      case 'BANK': return 'Direct Bank Transfer';
      default: return method;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Guest Validations if not logged in
    if (!user) {
      if (!guestName.trim() || guestName.trim().length < 2) {
        newErrors.guestName = "Full name must be at least 2 characters.";
      }
      if (!guestEmail.trim() || !EMAIL_REGEX.test(guestEmail.trim())) {
        newErrors.guestEmail = "Please enter a valid email address.";
      }
      const rawGuestPhone = guestPhone.replace(/[\s-]/g, '');
      if (!rawGuestPhone || !SL_PHONE_REGEX.test(rawGuestPhone)) {
        newErrors.guestPhone = "Enter a valid Sri Lankan mobile number (e.g., 0771234567).";
      }
    }

    // 2. Delivery Validations
    if (!address.trim() || address.trim().length < 8) {
      newErrors.address = "Please provide a complete street address (min 8 characters).";
    }

    if (user) {
      const rawUserPhone = phone.replace(/[\s-]/g, '');
      if (!rawUserPhone || !SL_PHONE_REGEX.test(rawUserPhone)) {
        newErrors.phone = "Enter a valid Sri Lankan contact number (e.g., 0771234567).";
      }
    }

    // 3. Payment Method Validations
    if (paymentMethod === 'CARD') {
      if (!cardName.trim() || cardName.trim().length < 2) {
        newErrors.cardName = "Enter cardholder name as printed on card.";
      }
      const rawCard = cardNumber.replace(/\s/g, '');
      if (rawCard.length !== 16 || !isValidLuhn(rawCard)) {
        newErrors.cardNumber = "Enter a valid 16-digit card number passing checksum.";
      }
      
      // Expiry validation
      if (!cardExpiry || cardExpiry.length !== 5) {
        newErrors.cardExpiry = "Expiry must be in MM/YY format.";
      } else {
        const [monthStr, yearStr] = cardExpiry.split('/');
        const month = parseInt(monthStr, 10);
        const year = parseInt(`20${yearStr}`, 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (month < 1 || month > 12) {
          newErrors.cardExpiry = "Invalid month (01-12).";
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          newErrors.cardExpiry = "Card has already expired.";
        }
      }

      if (!cardCvv || cardCvv.length < 3 || cardCvv.length > 4) {
        newErrors.cardCvv = "CVV must be 3 or 4 digits.";
      }
    } else if (paymentMethod === 'WALLET') {
      const rawWalletPhone = walletPhone.replace(/[\s-]/g, '');
      if (!rawWalletPhone || !SL_PHONE_REGEX.test(rawWalletPhone)) {
        newErrors.walletPhone = `Enter a valid mobile number for ${walletProvider}.`;
      }
    } else if (paymentMethod === 'BANK') {
      if (!bankRef.trim() || bankRef.trim().length < 4) {
        newErrors.bankRef = "Enter a deposit slip or online transfer reference (min 4 chars).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please correct the highlighted validation errors.", "danger");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      showToast("Your cart is empty. Add items before checking out.", "danger");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedMethod = getMethodLabel(paymentMethod);
      const orderPayload = {
        deliveryAddress: address.trim(),
        deliverySlot: slot,
        paymentMethod: formattedMethod,
        customerName: user ? user.name : guestName.trim(),
        customerEmail: user ? user.email : guestEmail.trim(),
        customerPhone: user ? phone.trim() : guestPhone.trim(),
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      let placedOrder;
      if (user && user.id) {
        placedOrder = await api.checkout(user.id, orderPayload);
      } else {
        placedOrder = await api.checkoutGuest(orderPayload);
      }

      setOrderSuccess(placedOrder);
      clearCart();
      showToast("Order placed successfully! Check your tracking code.", "success");
      if (onOrderPlaced) onOrderPlaced(placedOrder);
    } catch (err) {
      showToast(err.message || "Failed to process order", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)' }}
      >
        {!orderSuccess ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <span>🛒</span> Secure LankaFresh Checkout
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {user ? `Logged in as ${user.name} (${user.email})` : 'Guest Checkout • No registration required!'}
                </p>
              </div>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <IconX size={20} />
              </button>
            </div>

            {/* Guest Banner if not logged in */}
            {!user && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <div style={{ fontSize: '0.84rem', color: '#166534' }}>
                  <strong>Instant Guest Checkout:</strong> You can place this order right now without registering. An order tracking code will be generated instantly for you!
                </div>
              </div>
            )}

            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Section 1: Customer & Contact Details */}
              {!user ? (
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconUser size={17} /> 1. Guest Contact Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Your Full Name *
                      </label>
                      <input 
                        type="text"
                        value={guestName}
                        onChange={(e) => {
                          setGuestName(e.target.value);
                          if (errors.guestName) setErrors(prev => ({ ...prev, guestName: null }));
                        }}
                        placeholder="e.g. Kasun Perera"
                        style={{ width: '100%', borderColor: errors.guestName ? '#ef4444' : undefined }}
                      />
                      {errors.guestName && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.guestName}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                          Email Address * (For Receipt & Tracking)
                        </label>
                        <input 
                          type="email"
                          value={guestEmail}
                          onChange={(e) => {
                            setGuestEmail(e.target.value);
                            if (errors.guestEmail) setErrors(prev => ({ ...prev, guestEmail: null }));
                          }}
                          placeholder="kasun@example.com"
                          style={{ width: '100%', borderColor: errors.guestEmail ? '#ef4444' : undefined }}
                        />
                        {errors.guestEmail && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.guestEmail}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                          Mobile Number * (For Delivery Call)
                        </label>
                        <input 
                          type="text"
                          value={guestPhone}
                          onChange={(e) => {
                            setGuestPhone(e.target.value);
                            if (errors.guestPhone) setErrors(prev => ({ ...prev, guestPhone: null }));
                          }}
                          placeholder="077 123 4567"
                          style={{ width: '100%', borderColor: errors.guestPhone ? '#ef4444' : undefined }}
                        />
                        {errors.guestPhone && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.guestPhone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Section 2: Delivery Address & Slot */}
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconTruck size={17} /> {user ? '1.' : '2.'} Delivery Destination & Schedule
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      Delivery Address *
                    </label>
                    <textarea 
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address) setErrors(prev => ({ ...prev, address: null }));
                      }}
                      placeholder="House/Apt No, Street Name, City, Landmark..."
                      style={{ width: '100%', resize: 'vertical', borderColor: errors.address ? '#ef4444' : undefined }}
                    />
                    {errors.address && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.address}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: user ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    {user && (
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                          Contact Phone *
                        </label>
                        <input 
                          type="text"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                          }}
                          placeholder="e.g. 0771234567"
                          style={{ width: '100%', borderColor: errors.phone ? '#ef4444' : undefined }}
                        />
                        {errors.phone && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.phone}</span>}
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        Delivery Time Slot
                      </label>
                      <select 
                        value={slot} 
                        onChange={(e) => setSlot(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="Express Delivery (Within 60 Mins)">⚡ Express (Within 60 Mins)</option>
                        <option value="Today Morning (09:00 AM - 12:00 PM)">🌅 Morning (9 AM - 12 PM)</option>
                        <option value="Today Afternoon (01:00 PM - 04:00 PM)">☀️ Afternoon (1 PM - 4 PM)</option>
                        <option value="Today Evening (05:00 PM - 08:00 PM)">🌙 Evening (5 PM - 8 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Methods */}
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconShield size={17} /> {user ? '2.' : '3.'} Payment Method
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔒 256-Bit SSL Encrypted
                  </span>
                </div>

                {/* 4 Payment Option Radio Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {/* Option 1: Credit / Debit Card */}
                  <div 
                    onClick={() => setPaymentMethod('CARD')}
                    style={{ 
                      border: `2px solid ${paymentMethod === 'CARD' ? 'var(--primary)' : 'var(--border)'}`, 
                      background: paymentMethod === 'CARD' ? 'var(--primary-light)' : 'var(--bg-card)', 
                      padding: '12px', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>💳</span>
                    <div>
                      <div>Credit / Debit Card</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Visa, Mastercard, Amex</div>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div 
                    onClick={() => setPaymentMethod('COD')}
                    style={{ 
                      border: `2px solid ${paymentMethod === 'COD' ? 'var(--primary)' : 'var(--border)'}`, 
                      background: paymentMethod === 'COD' ? 'var(--primary-light)' : 'var(--bg-card)', 
                      padding: '12px', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                    <div>
                      <div>Cash on Delivery</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Pay cash or card at door</div>
                    </div>
                  </div>

                  {/* Option 3: Sri Lankan Mobile Wallets */}
                  <div 
                    onClick={() => setPaymentMethod('WALLET')}
                    style={{ 
                      border: `2px solid ${paymentMethod === 'WALLET' ? 'var(--primary)' : 'var(--border)'}`, 
                      background: paymentMethod === 'WALLET' ? 'var(--primary-light)' : 'var(--bg-card)', 
                      padding: '12px', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                    <div>
                      <div>FriMi / Genie / Koko</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>QR, BNPL & digital wallets</div>
                    </div>
                  </div>

                  {/* Option 4: Direct Bank Transfer */}
                  <div 
                    onClick={() => setPaymentMethod('BANK')}
                    style={{ 
                      border: `2px solid ${paymentMethod === 'BANK' ? 'var(--primary)' : 'var(--border)'}`, 
                      background: paymentMethod === 'BANK' ? 'var(--primary-light)' : 'var(--bg-card)', 
                      padding: '12px', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                    <div>
                      <div>Bank Transfer</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Commercial Bank / BOC</div>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC PAYMENT FORM DETAILS */}
                {/* 1. Card Form */}
                {paymentMethod === 'CARD' && (
                  <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>CARD DETAILS</span>
                      <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>VISA</span> • <span>Mastercard</span> • <span>Amex</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Cardholder Name *</label>
                      <input 
                        type="text" 
                        value={cardName} 
                        onChange={(e) => {
                          setCardName(e.target.value);
                          if (errors.cardName) setErrors(prev => ({ ...prev, cardName: null }));
                        }} 
                        placeholder="e.g. Sahan Silva" 
                        style={{ width: '100%', borderColor: errors.cardName ? '#ef4444' : undefined }} 
                      />
                      {errors.cardName && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.cardName}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Card Number (16 Digits) *</label>
                      <input 
                        type="text" 
                        value={cardNumber} 
                        onChange={handleCardNumberChange} 
                        placeholder="4111 2222 3333 4444" 
                        maxLength={19} 
                        style={{ width: '100%', fontFamily: 'monospace', letterSpacing: '1px', borderColor: errors.cardNumber ? '#ef4444' : undefined }} 
                      />
                      {errors.cardNumber && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.cardNumber}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Expiry (MM/YY) *</label>
                        <input 
                          type="text" 
                          value={cardExpiry} 
                          onChange={handleExpiryChange} 
                          placeholder="12/28" 
                          maxLength={5} 
                          style={{ width: '100%', fontFamily: 'monospace', borderColor: errors.cardExpiry ? '#ef4444' : undefined }} 
                        />
                        {errors.cardExpiry && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.cardExpiry}</span>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Security CVV *</label>
                        <input 
                          type="password" 
                          value={cardCvv} 
                          onChange={(e) => {
                            setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4));
                            if (errors.cardCvv) setErrors(prev => ({ ...prev, cardCvv: null }));
                          }} 
                          placeholder="123" 
                          maxLength={4} 
                          style={{ width: '100%', fontFamily: 'monospace', borderColor: errors.cardCvv ? '#ef4444' : undefined }} 
                        />
                        {errors.cardCvv && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.cardCvv}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. COD Form */}
                {paymentMethod === 'COD' && (
                  <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                      🤝 <strong>Cash or Card On Delivery:</strong> Please have the payment ready when our driver arrives. Our riders also carry portable POS machines for contactless card swipe.
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Need change for large notes?
                      </label>
                      <select 
                        value={codChange} 
                        onChange={(e) => setCodChange(e.target.value)} 
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      >
                        <option value="EXACT">Exact amount / Will pay with Card</option>
                        <option value="5000">Need change for Rs. 5,000 note</option>
                        <option value="10000">Need change for Rs. 10,000 note</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 3. Mobile Wallets Form */}
                {paymentMethod === 'WALLET' && (
                  <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Select Digital Wallet / Service</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {['FriMi', 'Genie', 'Koko Pay', 'iPay'].map(provider => (
                          <button
                            key={provider}
                            type="button"
                            onClick={() => setWalletProvider(provider)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              background: walletProvider === provider ? 'var(--primary)' : 'var(--bg-main)',
                              color: walletProvider === provider ? 'white' : 'var(--text-main)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer'
                            }}
                          >
                            {provider}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                        {walletProvider} Registered Mobile Number *
                      </label>
                      <input 
                        type="text" 
                        value={walletPhone} 
                        onChange={(e) => {
                          setWalletPhone(e.target.value);
                          if (errors.walletPhone) setErrors(prev => ({ ...prev, walletPhone: null }));
                        }} 
                        placeholder="e.g. 0771234567" 
                        style={{ width: '100%', borderColor: errors.walletPhone ? '#ef4444' : undefined }} 
                      />
                      {errors.walletPhone && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.walletPhone}</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                        A payment prompt of Rs. {total.toFixed(2)} will be pushed to your {walletProvider} app.
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Direct Bank Transfer Form */}
                {paymentMethod === 'BANK' && (
                  <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                      <div><strong>Bank:</strong> Commercial Bank of Ceylon</div>
                      <div><strong>Account Name:</strong> LankaFresh Supermarkets (Pvt) Ltd</div>
                      <div><strong>Account No:</strong> 1000 8947 2891 (Kollupitiya Branch)</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '3px' }}>
                        Bank Transfer Reference / Deposit Slip No. *
                      </label>
                      <input 
                        type="text" 
                        value={bankRef} 
                        onChange={(e) => {
                          setBankRef(e.target.value);
                          if (errors.bankRef) setErrors(prev => ({ ...prev, bankRef: null }));
                        }} 
                        placeholder="e.g. TXN-998821 or Online Transfer Reference" 
                        style={{ width: '100%', borderColor: errors.bankRef ? '#ef4444' : undefined }} 
                      />
                      {errors.bankRef && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.bankRef}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Total Breakdown */}
              <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>Total Payable Amount:</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes all taxes and packaging ({cartItems.length} items)</div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                  Rs. {total.toFixed(2)}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Processing Payment...' : `Confirm & Pay Rs. ${total.toFixed(2)} (${getMethodLabel(paymentMethod)})`}
              </button>
            </form>
          </>
        ) : (
          /* =================== ORDER & PAYMENT SUCCESS CONFIRMATION =================== */
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)' }}>
              <IconCheck size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '6px' }}>
              Order & Payment Confirmed!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Thank you for shopping at LankaFresh! Your groceries have been scheduled for dispatch.
            </p>

            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                <strong>#{orderSuccess.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tracking Code:</span>
                <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1.05rem' }}>{orderSuccess.trackingNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <span>{orderSuccess.user ? orderSuccess.user.name : (guestName || 'Guest Customer')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <strong>{orderSuccess.paymentMethod || getMethodLabel(paymentMethod)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                <span className={`badge ${orderSuccess.paymentStatus === 'PENDING_COD' ? 'badge-warning' : 'badge-success'}`}>
                  {orderSuccess.paymentStatus === 'PENDING_COD' ? 'Pay upon delivery' : 'Verified & Paid'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Delivery Slot:</span>
                <span>{orderSuccess.deliverySlot}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <span style={{ fontWeight: '700' }}>Total Amount:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>Rs. {Number(orderSuccess.totalAmount).toFixed(2)}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setOrderSuccess(null);
                onClose();
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', cursor: 'pointer' }}
            >
              Done & Return to Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
