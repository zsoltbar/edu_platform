// Custom hook for authentication logic

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { User, UserRole } from '../types';
import { API_ENDPOINTS } from '../constants';

interface UseAuthReturn {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  getAuthHeader: () => { headers: { Authorization: string } } | {};
  logout: () => void;
}

export const useAuth = (requireAdmin: boolean = false): UseAuthReturn => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    router.replace("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
      return;
    }

    const authHeader = getAuthHeader();
    
    // Get current user info
    api.get(API_ENDPOINTS.auth.me, authHeader)
      .then(res => {
        setCurrentUser(res.data);
        
        // Check if admin access is required
        if (requireAdmin && res.data.role !== "admin") {
          alert("Hozzáférés megtagadva! Csak adminisztrátorok férhetnek hozzá.");
          router.replace("/dashboard");
          return;
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error("Auth error:", err);
        logout();
      });
  }, [router, requireAdmin]);

  return {
    currentUser,
    loading,
    isAdmin: currentUser?.role === 'admin',
    isTeacher: currentUser?.role === 'teacher',
    isStudent: currentUser?.role === 'student',
    getAuthHeader,
    logout
  };
};