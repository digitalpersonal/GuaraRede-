import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('redeguara_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Simular login de empresa
    const companies = JSON.parse(localStorage.getItem('redeguara_companies') || '[]');
    const company = companies.find(c => c.email === userData.email);

    if (company) {
      const companyUser = {
        ...userData,
        id: company.id,
        name: company.name,
        type: 'company',
        plan: company.plan,
      };
      setUser(companyUser);
      localStorage.setItem('redeguara_user', JSON.stringify(companyUser));
    } else {
      // Login de usuário normal
      const regularUser = { ...userData, type: 'personal', plan: 'Grátis' };
      setUser(regularUser);
      localStorage.setItem('redeguara_user', JSON.stringify(regularUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('redeguara_user');
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('redeguara_user', JSON.stringify(newUser));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};