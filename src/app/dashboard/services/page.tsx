'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';

type ExtraService = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  popular: boolean;
};

export default function ServicesPage() {
  const SUPPORT_LINK = "https://t.me/teementpod_support";
  
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/partner/services');
        setServices(response.data.services || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách dịch vụ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dịch Vụ Mở Rộng & Hỗ Trợ Seller</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-2xl leading-relaxed">
            Ngoài hệ thống in ấn Fulfillment mạnh mẽ, <strong className="text-gray-800">TeementPOD</strong> còn cung cấp hệ sinh thái dịch vụ đa dạng để giúp bạn dễ dàng mở rộng và scale quy mô kinh doanh POD trên toàn cầu.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <a 
            href={SUPPORT_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#C29017] hover:bg-[#a67b13] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#C29017]/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            💬 Liên hệ tư vấn ngay
          </a>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#C29017]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      {/* HIỂN THỊ TRẠNG THÁI LOADING HOẶC DỮ LIỆU */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 animate-pulse font-medium">
          Đang tải danh sách dịch vụ...
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-500">
          Hiện tại chưa có dịch vụ hỗ trợ nào trên hệ thống.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#C29017]/30 transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
            >
              {service.popular && (
                <div className="absolute top-4 right-4 bg-red-50 text-red-600 text-[10px] font-black px-2.5 py-1 rounded-md border border-red-100 uppercase tracking-widest z-10">
                  🔥 Hot
                </div>
              )}

              {/* Render mã SVG từ Database bằng dangerouslySetInnerHTML */}
              <div 
                className="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-all duration-300 border border-gray-100 shadow-sm group-hover:bg-[#C29017]/10 group-hover:text-[#C29017] group-hover:border-[#C29017]/20 [&>svg]:w-7 [&>svg]:h-7"
                dangerouslySetInnerHTML={{ __html: service.icon || '' }}
              />
              
              <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#C29017] transition-colors line-clamp-2">
                {service.title}
              </h3>
              
              <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                {service.description}
              </p>
              
              <div className="mt-auto pt-5 border-t border-gray-50 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {(service.tags || []).map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>

                <a 
                  href={SUPPORT_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-900 hover:text-white transition-colors border border-gray-200 hover:border-gray-900"
                >
                  Nhận Báo Giá
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BANNER ĐÁY */}
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between text-white mt-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#C29017]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-lg">Bảo mật & Uy tín</h4>
            <p className="text-gray-400 text-sm">Giao dịch an toàn, thông tin tài khoản được bảo mật tuyệt đối.</p>
          </div>
        </div>
        <a 
          href={SUPPORT_LINK} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap"
        >
          Chat với Admin
        </a>
      </div>
    </div>
  );
}