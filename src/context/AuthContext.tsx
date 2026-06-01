'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('seller_token');
      
      if (!token) {
        setIsLoading(false);
        // Cho phép ở lại trang chủ gốc '/' tự do không bị đá sang trang cũ nữa
        if (pathname && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
          router.push('/');
        }
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get('/partner/auth/me');
        setUser(res.data.user);
        
        // Nếu đã có phiên đăng nhập, tự chuyển vào dashboard khi cố vào trang chủ
        if (pathname === '/' || pathname === '/login' || pathname === '/register') {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Xác thực thất bại:", error);
        localStorage.removeItem('seller_token');
        delete api.defaults.headers.common['Authorization'];
        if (pathname && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
          router.push('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('seller_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    
    // THAY ĐỔI TẠI ĐÂY: Dùng window.location.href để ép tải lại toàn bộ app mới
    window.location.href = '/dashboard'; 
  };

  const logout = () => {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('selectedShopId'); 
    localStorage.removeItem('selected_shop_id'); 
    localStorage.removeItem('seller_info'); 
    
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // THAY ĐỔI TẠI ĐÂY: Quét sạch RAM bằng cách ép tải lại trang chủ
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
