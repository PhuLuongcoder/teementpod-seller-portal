'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useShop } from '@/context/ShopContext';

export default function TopbarTotalSpend() {
  const { selectedShopId } = useShop();
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTotalSpend = async () => {
      if (!selectedShopId) return;
      try {
        const res = await api.get('/partner/dashboard', {
          params: { shop_id: selectedShopId, range: 'all' } 
        });
        setTotalSpent(res.data.stats?.total_revenue || 0);
      } catch (error) {
        console.error("Lỗi khi tải tổng chi tiêu Topbar:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalSpend();
    const interval = setInterval(fetchTotalSpend, 15000);
    window.addEventListener('refresh_total_spend', fetchTotalSpend);

    // Dọn dẹp sự kiện khi component unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh_total_spend', fetchTotalSpend);
    };
  }, [selectedShopId]);

  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 bg-[#C29017]/10 border border-[#C29017]/20 rounded-full mr-2 transition-all hover:bg-[#C29017]/20 cursor-default">
      <div className="w-7 h-7 bg-[#C29017] rounded-full flex items-center justify-center text-white shadow-sm">
        {/* Icon Dollar */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-[#C29017] uppercase tracking-wider leading-none mb-0.5">
          Tổng chi tiêu
        </span>
        {isLoading ? (
          <div className="h-4 w-16 bg-[#C29017]/20 animate-pulse rounded"></div>
        ) : (
          <span className="text-sm font-black text-gray-900 leading-none">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}