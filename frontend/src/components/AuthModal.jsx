import React, { useState } from 'react';
import { useAuth, staffAccounts } from '../context/AuthContext';
import { IconUser, IconX, IconCheck, IconTruck, IconHeart, IconShield } from './Icons';

export const AuthModal = ({ isOpen, onClose, onStaffLoginSuccess, onOpenTracker, onOpenWishlist }) => {
  const { user, login, register, logout, isStaff } = useAuth();
  
  // Tabs: 'login', 'register'
  const [authTab, setAuthTab] = useState('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      setSuccessMsg(`Welcome back, ${loggedUser.name}!`);
      setTimeout(() => {
        onClose();
        if (loggedUser.role !== 'CUSTOMER' && onStaffLoginSuccess) {
          onStaffLoginSuccess(loggedUser.role);
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Input Validations
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailPattern.test(email.trim())) {
      setError('Please enter a valid email address (e.g. yourname@example.com).');
      return;
    }
    if (!password || password.length <= 8) {
      setError('Password must be more than 8 characters long (at least 9 characters).');
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (!phone || !phone.trim()) {
      setError('Mobile number is required for order delivery updates and account verification.');
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const slMobilePattern = /^(?:0|\+94|94)?7[0-9]{8}$/;
    if (!slMobilePattern.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Sri Lankan mobile number starting with 07 (e.g. 0771234567 or +94771234567).');
      return;
    }

    let normalizedPhone = cleanPhone;
    if (cleanPhone.startsWith('+94')) {
      normalizedPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('94')) {
      normalizedPhone = '0' + cleanPhone.substring(2);
    } else if (!cleanPhone.startsWith('0')) {
      normalizedPhone = '0' + cleanPhone;
    }

    if (address && address.trim().length < 6) {
      setError('Delivery address must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: normalizedPhone,
        address: address.trim()
      });
      setSuccessMsg(`Account created successfully! Welcome to LankaFresh, ${newUser.name}.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const autofillCredentials = (accEmail, accPassword = 'password123') => {
    setEmail(accEmail);
    setPassword(accPassword);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: 'var(--radius-lg)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user ? (
                <><IconUser size={18} /> {isStaff ? `${user.name} (${user.role})` : 'Customer Account'}</>
              ) : authTab === 'register' ? (
                <>Register New Account</>
              ) : (
                <>Sign In to LankaFresh</>
              )}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {user 
                ? `Logged in as ${user.email}` 
                : authTab === 'register'
                ? 'Create a customer account for fast ordering and delivery tracking'
                : 'Enter your credentials to sign in to your customer or staff account'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <IconX size={20} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '14px', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '14px', border: '1px solid #86efac' }}>
            {successMsg}
          </div>
        )}

        {user ? (
          /* =================== LOGGED IN PROFILE HUB =================== */
          <div>
            <div style={{ background: 'var(--bg-main)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '50%', 
                  background: isStaff ? '#8b5cf6' : 'var(--primary)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold' 
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>{user.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${isStaff ? 'badge-primary' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-main)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                {user.phone && <div><strong>Contact Number:</strong> {user.phone}</div>}
                {user.address && <div><strong>Delivery Address:</strong> {user.address}</div>}
              </div>
            </div>

            {/* Customer Specific Action Buttons */}
            {!isStaff && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <button 
                  onClick={() => {
                    onClose();
                    if (onOpenTracker) onOpenTracker();
                  }}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
                >
                  <IconTruck size={16} /> Track My Orders
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    if (onOpenWishlist) onOpenWishlist();
                  }}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
                >
                  <IconHeart size={16} /> View Wishlist
                </button>
              </div>
            )}

            {/* Staff Quick Go to Workspace */}
            {isStaff && (
              <div style={{ marginBottom: '18px' }}>
                <button
                  onClick={() => {
                    onClose();
                    if (onStaffLoginSuccess) onStaffLoginSuccess(user.role);
                  }}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.9rem' }}
                >
                  Go to My Personal Staff Dashboard →
                </button>
              </div>
            )}

            {/* Sign Out Button */}
            <button 
              onClick={() => {
                logout();
                onClose();
              }}
              className="btn-danger" 
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.9rem' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* =================== AUTHENTICATION TABS & FORMS =================== */
          <div>
            {/* Tab Selection */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: authTab === 'login' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: authTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: authTab === 'register' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: authTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Register Account
              </button>
            </div>

            {/* TAB 1: UNIFIED SIGN IN */}
            {authTab === 'login' && (
              <div>
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="e.g. name@gmail.com"
                      style={{ width: '100%' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Password *
                    </label>
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter your account password"
                      style={{ width: '100%' }} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary" 
                    style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                {/* Switch to Register link */}
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Don't have an account yet?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthTab('register'); setError(''); }}
                    style={{ color: 'var(--primary)', fontWeight: '700', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Create Customer Account
                  </button>
                </div>

                {/* Demo Logins Directory Toggle */}
                <div style={{ marginTop: '18px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDemoLogins(!showDemoLogins)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>Quick-Fill Demo Accounts (Testing Reference)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{showDemoLogins ? 'Hide Accounts' : 'Show Test Logins'}</span>
                  </button>

                  {showDemoLogins && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Password for all accounts: <strong style={{ color: 'var(--primary)' }}>password123</strong>
                      </div>

                      {/* Customer demo account */}
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          background: 'var(--bg-card)',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div>
                          <strong>Sahan Silva</strong> (Customer)
                          <div style={{ color: 'var(--text-muted)' }}>customer@gmail.com</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => autofillCredentials('customer@gmail.com', 'password123')}
                          style={{
                            background: 'var(--primary-light, #ecfdf5)',
                            color: 'var(--primary, #059669)',
                            border: '1px solid var(--primary, #059669)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Fill Credentials
                        </button>
                      </div>

                      {/* Staff demo accounts */}
                      {staffAccounts.map(staff => (
                        <div 
                          key={staff.email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: 'var(--bg-card)',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            fontSize: '0.78rem'
                          }}
                        >
                          <div>
                            <strong>{staff.name}</strong> ({staff.roleLabel})
                            <div style={{ color: 'var(--text-muted)' }}>{staff.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => autofillCredentials(staff.email, 'password123')}
                            style={{
                              background: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #ddd6fe',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Fill Credentials
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CREATE CUSTOMER ACCOUNT */}
            {authTab === 'register' && (
              <div>
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. Kasun Chamara"
                      style={{ width: '100%' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                        Email Address *
                      </label>
                      {email.trim() && (
                        <span style={{ 
                          fontSize: '0.74rem', 
                          fontWeight: '600',
                          color: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()) ? '#10b981' : '#ef4444' 
                        }}>
                          {/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()) ? '✓ Valid Email' : '✗ Invalid Email Format'}
                        </span>
                      )}
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="e.g. kasun@gmail.com"
                      style={{ 
                        width: '100%',
                        borderColor: email.trim() && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()) ? '#ef4444' : undefined
                      }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                        Password *
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Must be &gt; 8 chars with 1 letter &amp; 1 number
                      </span>
                    </div>
                    <input 
                      type="password" 
                      required 
                      minLength={9}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter password (> 8 chars, 1 letter, 1 number)"
                      style={{ 
                        width: '100%',
                        borderColor: password && (password.length <= 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) ? '#ef4444' : undefined
                      }} 
                    />
                    {password && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.74rem' }}>
                        <span style={{ color: password.length > 8 ? '#15803d' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          {password.length > 8 ? '✓' : '✗'} &gt; 8 characters ({password.length})
                        </span>
                        <span style={{ color: /[a-zA-Z]/.test(password) ? '#15803d' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          {/[a-zA-Z]/.test(password) ? '✓' : '✗'} At least 1 letter
                        </span>
                        <span style={{ color: /[0-9]/.test(password) ? '#15803d' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          {/[0-9]/.test(password) ? '✓' : '✗'} At least 1 number
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                        Mobile Number *
                      </label>
                      {phone.trim() && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          color: /^(?:0|\+94|94)?7[0-9]{8}$/.test(phone.trim().replace(/[\s-]/g, '')) ? '#10b981' : '#ef4444' 
                        }}>
                          {/^(?:0|\+94|94)?7[0-9]{8}$/.test(phone.trim().replace(/[\s-]/g, '')) ? 'Valid Mobile Number' : 'Invalid Format (07X...)'}
                        </span>
                      )}
                    </div>
                    <input 
                      type="tel" 
                      required 
                      value={phone} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9+\s-]*$/.test(val)) {
                          setPhone(val);
                        }
                      }} 
                      placeholder="e.g. 0771234567 or +94771234567"
                      maxLength={12}
                      style={{ 
                        width: '100%',
                        borderColor: phone.trim() && !/^(?:0|\+94|94)?7[0-9]{8}$/.test(phone.trim().replace(/[\s-]/g, '')) ? '#ef4444' : undefined
                      }} 
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Enter a 10-digit Sri Lankan mobile number starting with 07 (e.g. 0771234567 or +94771234567)
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Default Delivery Address *
                    </label>
                    <textarea 
                      rows={2} 
                      required
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="Street, City, Landmark for express delivery..."
                      style={{ width: '100%', resize: 'vertical' }} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary" 
                    style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
                  >
                    {loading ? 'Creating Account...' : 'Register as Customer'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthTab('login'); setError(''); }}
                    style={{ color: 'var(--primary)', fontWeight: '700', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
