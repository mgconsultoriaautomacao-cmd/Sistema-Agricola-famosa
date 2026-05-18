import React, { createContext, useContext, useState } from 'react';
import { loginOperator, loginAdmin } from '../services/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('agricola_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (credentials) => {
    // Determine if it's admin or operator login based on provided fields
    let authUser = null;
    if (credentials.pin) {
      authUser = await loginOperator(credentials.pin);
    } else if (credentials.username && credentials.password) {
      authUser = await loginAdmin(credentials.username, credentials.password);
    }

    if (authUser) {
      setUser(authUser);
      localStorage.setItem('agricola_auth_user', JSON.stringify(authUser));
      return { success: true, role: authUser.role };
    }
    return { success: false, message: "Credenciais inválidas" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agricola_auth_user');
    localStorage.removeItem('agricola_selected_farm');
    localStorage.removeItem('agricola_selected_sector');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
