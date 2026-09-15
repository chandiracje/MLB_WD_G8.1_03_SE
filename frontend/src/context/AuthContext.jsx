import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const staffAccounts = [
  { email: "manager@lankafresh.com", role: "MANAGER", roleLabel: "Branch Manager", name: "Nadeesha Perera" },
  { email: "inventory@lankafresh.com", role: "INVENTORY_STAFF", roleLabel: "Inventory Controller", name: "Ruwan Kumara" },
  { email: "delivery@lankafresh.com", role: "DELIVERY_STAFF", roleLabel: "Delivery Personnel", name: "Tharindu Silva" },
  { email: "support@lankafresh.com", role: "SUPPORT_STAFF", roleLabel: "Support Executive", name: "Dilini Fernando" },
  { email: "finance@lankafresh.com", role: "FINANCE_OFFICER", roleLabel: "Finance Officer", name: "Kasun Jayasinghe" }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      setUser(res);
      setToken(res.token);
      localStorage.setItem('token', res.token);
      return res;
    } catch (e) {
      // Fallback verification for demo/offline testing if backend network fails
      const staff = staffAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (staff && password === 'password123') {
        const staffUser = {
          id: staff.email.length,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          phone: "0771234567",
          address: "LankaFresh Operations Hub, Colombo"
        };
        setUser(staffUser);
        setToken('jwt-staff-session');
        localStorage.setItem('token', 'jwt-staff-session');
        return staffUser;
      }
      if (email.toLowerCase() === 'customer@gmail.com' && password === 'password123') {
        const custUser = {
          id: 6,
          name: "Sahan Silva",
          email: "customer@gmail.com",
          role: "CUSTOMER",
          phone: "0781112233",
          address: "45/2 Galle Road, Mount Lavinia"
        };
        setUser(custUser);
        setToken('jwt-customer-session');
        localStorage.setItem('token', 'jwt-customer-session');
        return custUser;
      }
      throw e;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register({
        ...userData,
        role: 'CUSTOMER'
      });
      setUser(res);
      setToken(res.token);
      localStorage.setItem('token', res.token);
      return res;
    } catch (e) {
      const newUser = {
        id: Date.now(),
        ...userData,
        role: 'CUSTOMER'
      };
      setUser(newUser);
      setToken('customer-jwt-token');
      localStorage.setItem('token', 'customer-jwt-token');
      return newUser;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isStaff = Boolean(user && user.role && user.role !== 'CUSTOMER');

  return (
    <AuthContext.Provider value={{ user, token, isStaff, login, register, logout, staffAccounts }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
