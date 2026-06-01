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
    router.push('/dashboard');
  };

  const logout = () => {
    // 1. Xóa Token đăng nhập
    localStorage.removeItem('seller_token');
    
    // 2. DỌN DẸP SẠCH TÀN DƯ CỦA SELLER CŨ
    localStorage.removeItem('selectedShopId'); // Tên key thường dùng trong ShopContext
    localStorage.removeItem('selected_shop_id'); // Dự phòng nếu bạn dùng tên key này
    localStorage.removeItem('seller_info'); // Xóa thông tin cá nhân (nếu có lưu)
    
    // Lưu ý: Nếu trang seller-portal của bạn chạy độc lập trên 1 tên miền phụ (ví dụ: seller.domain.com), 
    // cách an toàn và triệt để nhất là dùng lệnh: localStorage.clear(); để xóa sạch 100%.
    
    // 3. Gỡ header API và Reset state
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // 4. Chuyển hướng
    router.push('/'); // Đăng xuất trả thẳng về trang chủ gốc mới
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
