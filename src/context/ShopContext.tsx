'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/axios';

interface ShopContextType {
  shops: any[];
  selectedShopId: string;
  setSelectedShopId: (id: string) => void;
  isLoading: boolean;
  refreshShops: () => Promise<void>; // THÊM DÒNG NÀY
}

const ShopContext = createContext<ShopContextType>({} as ShopContextType);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Tách riêng hàm fetchShops ra để gọi lại được nhiều lần
  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/partner/shops');
      const shopList = response.data.shops;
      setShops(shopList);
      
      if (shopList.length > 0 && !selectedShopId) {
        setSelectedShopId(shopList[0].id);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách Shop", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return (
    // Truyền thêm refreshShops xuống
    <ShopContext.Provider value={{ shops, selectedShopId, setSelectedShopId, isLoading, refreshShops: fetchShops }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);