'use client';

import Link from 'next/link';
import api from '@/lib/axios';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ShopProvider, useShop } from '@/context/ShopContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext'; 
import TopbarTotalSpend from '@/components/TopbarTotalSpend';
// =========================================================
// 1. SHOP SWITCHER (Tối ưu cho cả 2 trạng thái Đóng/Mở)
// =========================================================
function ShopSwitcher({ isCollapsed }: { isCollapsed: boolean }) {
  const { shops, selectedShopId, setSelectedShopId, isLoading } = useShop();

  if (isLoading) return <div className="p-4 text-sm text-gray-400 animate-pulse">...</div>;

  if (isCollapsed) {
    const currentShop = shops.find(s => s.id === selectedShopId);
    return (
      <div className="px-3 py-4 border-b border-gray-800 flex justify-center">
        <div 
          className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-black text-[#C29017] cursor-pointer shadow-inner border border-gray-700"
          title={currentShop?.name || 'Chưa chọn cửa hàng'}
        >
          {currentShop?.name?.charAt(0).toUpperCase() || 'S'}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-b border-gray-800 relative">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Cửa hàng
        </label>
      </div>

      <select
        value={selectedShopId}
        onChange={(e) => setSelectedShopId(e.target.value)}
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-[#C29017] font-medium text-sm transition appearance-none"
      >
        {shops.length === 0 && <option value="">-- Chưa có Cửa hàng --</option>}
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name || `Cửa hàng: ${shop.id.substring(0, 8)}`}
          </option>
        ))}
      </select>
    </div>
  );
}

// =========================================================
// 2. LAYOUT CHÍNH (Đã tích hợp chức năng thu gọn Sidebar)
// =========================================================
export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // GỌI AuthContext ĐỂ LẤY THÔNG TIN USER VÀ HÀM LOGOUT
  const { user, logout } = useAuth(); 

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
    { name: 'Danh mục phôi', href: '/dashboard/catalog', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg> },
    { name: 'Thiết kế của tôi', href: '/dashboard/designs', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
    { name: 'Đơn hàng', href: '/dashboard/orders', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg> },
    { name: 'Quản lý Cửa hàng', href: '/dashboard/stores', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg> },
    { name: 'Dịch vụ hỗ trợ', href: '/dashboard/services', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M15.42 11.17l1.41-1.41a2.652 2.652 0 00-3.75-3.75l-1.41 1.41m-5.83 5.83l-1.41 1.41a2.652 2.652 0 003.75 3.75l1.41-1.41" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5l-3.75 3.75a2.652 2.652 0 003.75 3.75l3.75-3.75m3.75-3.75L19.5 6.75A2.652 2.652 0 0015.75 3L12 6.75" /></svg> },
  ];

  // Tính toán Tên và Chữ cái đầu Avatar từ dữ liệu User thật
  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Đang tải...';
  const initial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'S';

  return (
    <ShopProvider>
      <ConfirmProvider>
        <div className="flex h-screen bg-gray-50 font-sans antialiased overflow-hidden">
          
          <div 
            className={`md:hidden fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMobileOpen(false)}
          />

          <aside 
            className={`fixed md:relative inset-y-0 left-0 bg-gray-900 text-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-90 transition-all duration-300 ease-in-out transform 
              ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
              ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
          >
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex absolute -right-3 top-6 bg-gray-900 border border-gray-700 text-gray-400 w-6 h-6 rounded-full hover:bg-[#C29017] hover:text-white hover:border-[#C29017] items-center justify-center transition-all z-50 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <div className="h-16 flex items-center justify-center border-b border-gray-800 shrink-0">
              <h1 className="text-xl font-black tracking-wider transition-all duration-300 overflow-hidden">
                {isSidebarCollapsed && !isMobileOpen ? (
                  <span className="text-[#C29017] text-2xl">TP</span>
                ) : (
                  <>TEEMENT<span className="text-[#C29017]">.POD</span></>
                )}
              </h1>
            </div>
            
            <ShopSwitcher isCollapsed={isSidebarCollapsed && !isMobileOpen} />
            
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isTextHidden = isSidebarCollapsed && !isMobileOpen;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    title={isTextHidden ? item.name : ""}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-[#C29017] text-white font-bold shadow-[0_4px_12px_rgba(194,144,23,0.3)]' 
                        : 'text-gray-400 font-medium hover:bg-gray-800 hover:text-white'
                    } ${isTextHidden ? 'justify-center' : 'justify-start gap-3'}`}
                  >
                    <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                      {item.icon}
                    </div>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isTextHidden ? 'opacity-0 hidden w-0' : 'opacity-100 block'}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
            
            {(!isSidebarCollapsed || isMobileOpen) && (
              <div className="p-4 border-t border-gray-800 text-[11px] text-gray-500 text-center font-bold tracking-widest uppercase shrink-0">
                Seller Portal v1.2
              </div>
            )}
          </aside>

          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen overflow-hidden">
            
            <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shadow-sm z-40 shrink-0">
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileOpen(true)}
                  className="md:hidden p-2 -ml-2 text-gray-600 hover:text-[#C29017] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>
                
                <h2 className="md:hidden text-lg font-black tracking-wider text-gray-900">
                  TP<span className="text-[#C29017]">.</span>
                </h2>
              </div>
              <div className="flex items-center justify-end gap-5 ml-auto">
                <TopbarTotalSpend />
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 md:gap-3 focus:outline-none hover:bg-gray-50 px-2 md:px-3 py-1.5 rounded-xl transition duration-200 border border-transparent hover:border-gray-100"
                  >
                    <div className="text-right hidden sm:block">
                      {/* Dữ liệu lấy trực tiếp từ AuthContext */}
                      <p className="text-sm font-bold text-gray-900 leading-tight">{fullName}</p>
                      <p className="text-[11px] font-medium text-gray-400 mt-0.5">{user?.username || 'Đang tải...'}</p>
                    </div>
                    
                    {/* Avatar tạo từ chữ cái đầu của Tên thật */}
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-[#C29017]/10 text-[#C29017] border border-[#C29017]/30 rounded-full flex items-center justify-center font-black text-sm shadow-sm">
                      {initial}
                    </div>
                    
                    <span className={`text-xs text-gray-400 transition-transform duration-200 hidden xs:inline ${isProfileOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 md:w-60 bg-white rounded-2xl shadow-xl border border-gray-100/80 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="p-4 border-b border-gray-50 bg-gray-50/50 sm:hidden">
                        <p className="text-sm font-bold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user?.username || 'Đang tải...'}</p>
                      </div>

                      <div className="px-2 py-1.5 space-y-0.5">
                        <Link href="/dashboard/profile" onClick={() => setIsProfileOpen(false)} className="flex w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#C29017]/10 hover:text-[#C29017] rounded-xl transition font-bold">
                          Cập nhật thông tin hồ sơ
                        </Link>
                        <Link href="/dashboard/stores" onClick={() => setIsProfileOpen(false)} className="flex w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#C29017]/10 hover:text-[#C29017] rounded-xl transition font-bold">
                          Quản lý liên kết Stores
                        </Link>
                        <Link href="/dashboard/services" onClick={() => setIsProfileOpen(false)} className="flex w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#C29017]/10 hover:text-[#C29017] rounded-xl transition font-bold">
                          Dịch vụ mở rộng
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 mt-1 pt-1 px-2 pb-1">
                        <button 
                          // Gọi hàm logic Đăng xuất thực tế
                          onClick={() => { logout(); setIsProfileOpen(false); }} 
                          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition font-black"
                        >
                          Đăng xuất tài khoản
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
              {children}
            </main>
          </div>
        </div>
      </ConfirmProvider>
    </ShopProvider>
  );
}