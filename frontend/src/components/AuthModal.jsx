import React, { useState } from 'react';
import { useAuth, staffAccounts } from '../context/AuthContext';
import { IconUser, IconX, IconCheck, IconTruck, IconHeart, IconShield } from './Icons';

export const AuthModal = ({ isOpen, onClose, onStaffLoginSuccess, onOpenTracker, onOpenWishlist }) => {
  const { user, login, register, logout, isStaff } = useAuth();
  
  // Tabs: 'customer_login', 'customer_register', 'staff_login'
  const [authTab, setAuthTab] = useState('customer_login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showStaffGuide, setShowStaffGuide] = useState(false);

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
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!/^(?:0|\+94)?7[0-9]{8}$/.test(cleanPhone)) {
        setError('Please enter a valid Sri Lankan mobile number (e.g. 0771234567).');
        return;
      }
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
        phone: phone.trim(),
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

  const autofillStaff = (staffEmail) => {
    setEmail(staffEmail);
    setPassword('password123');
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
                <>👤 {isStaff ? 'Staff Portal Profile' : 'My Customer Account'}</>
              ) : authTab === 'staff_login' ? (
                <>🔐 Staff Portal Access</>
              ) : authTab === 'customer_register' ? (
                <>✨ Create Customer Account</>
              ) : (
                <>🛒 Customer Sign In</>
              )}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {user 
                ? `Logged in as ${user.email}` 
                : authTab === 'staff_login'
                ? 'Sign in with your official staff credentials to access your personal dashboard'
                : 'Access order history, tracking, saved wishlist and express delivery'}
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
                {user.phone && <div><strong>📞 Phone:</strong> {user.phone}</div>}
                {user.address && <div><strong>📍 Delivery Address:</strong> {user.address}</div>}
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
                onClick={() => { setAuthTab('customer_login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: authTab === 'customer_login' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: authTab === 'customer_login' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Customer Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('customer_register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: authTab === 'customer_register' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: authTab === 'customer_register' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Register Account
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('staff_login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: authTab === 'staff_login' ? '3px solid #8b5cf6' : '3px solid transparent',
                  color: authTab === 'staff_login' ? '#8b5cf6' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🛡️ Staff Portal
              </button>
            </div>

            {/* TAB 1: CUSTOMER SIGN IN */}
            {authTab === 'customer_login' && (
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
                      placeholder="e.g. yourname@gmail.com"
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
                    {loading ? 'Authenticating...' : 'Sign In as Customer'}
                  </button>
                </form>

                {/* Switch to Register link */}
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Don't have an account yet?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthTab('customer_register'); setError(''); }}
                    style={{ color: 'var(--primary)', fontWeight: '700', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Create Customer Account
                  </button>
                </div>

                {/* Quick Hint for customer testing */}
                <div style={{ marginTop: '18px', padding: '10px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                  💡 <strong>Existing Customer Demo Account:</strong>{' '}
                  <span style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }} onClick={() => { setEmail('customer@gmail.com'); setPassword('password123'); }}>
                    customer@gmail.com / password123 (Click to fill)
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: CREATE CUSTOMER ACCOUNT */}
            {authTab === 'customer_register' && (
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
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="e.g. kasun@gmail.com"
                      style={{ width: '100%' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Password *
                    </label>
                    <input 
                      type="password" 
                      required 
                      minLength={6}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Choose a secure password (min 6 chars)"
                      style={{ width: '100%' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Phone Number *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="e.g. 0771234567"
                      style={{ width: '100%' }} 
                    />
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
                    onClick={() => { setAuthTab('customer_login'); setError(''); }}
                    style={{ color: 'var(--primary)', fontWeight: '700', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: STAFF PORTAL LOGIN */}
            {authTab === 'staff_login' && (
              <div>
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#6d28d9' }}>
                      Staff Email Address *
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="e.g. manager@lankafresh.com"
                      style={{ width: '100%', borderColor: '#c4b5fd' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#6d28d9' }}>
                      Staff Password *
                    </label>
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter staff security password"
                      style={{ width: '100%', borderColor: '#c4b5fd' }} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    style={{ 
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '12px', 
                      fontSize: '0.95rem', 
                      fontWeight: '700', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? 'Authenticating Staff...' : 'Login to Staff Workspace →'}
                  </button>
                </form>

                {/* Staff Credentials Directory Toggle */}
                <div style={{ marginTop: '18px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setShowStaffGuide(!showStaffGuide)}
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
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>📋 Staff Credentials Directory (Testing Reference)</span>
                    <span>{showStaffGuide ? '▲ Hide' : '▼ View Staff Accounts'}</span>
                  </button>

                  {showStaffGuide && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        All staff accounts use password: <strong style={{ color: 'var(--primary)' }}>password123</strong>
                      </div>
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
                            onClick={() => autofillStaff(staff.email)}
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
                            Fill & Sign In
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
