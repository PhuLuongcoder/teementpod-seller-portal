"use client"

import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { 
  CurrencyDollar, 
  ShoppingCart, 
  ArrowTurnUp, 
  Tag, 
  ArrowUpRightMini, 
  ArrowDownRightMini 
} from "@medusajs/icons";
import { Container, Heading, Text, clx } from "@medusajs/ui";
import { 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import api from '@/lib/axios';

export default function SellerDashboardPage() {
  const { selectedShopId } = useShop(); 
  
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi duy nhất 1 API Dashboard sạch sẽ
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ range: timeRange });
        if (selectedShopId) params.append('shop_id', selectedShopId);

        const response = await api.get(`/partner/dashboard?${params.toString()}`);
        setData(response.data);
      } catch (error) {
        console.error("Lỗi fetch dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedShopId, timeRange]);

  // Component phụ: Thẻ KPI
  const KPICard = ({ title, value, subValue, icon: Icon, trend }: any) => (
    <Container className="p-6 bg-white shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <Text className="text-gray-500 font-semibold text-sm mb-1">{title}</Text>
        <Heading level="h2" className="text-2xl text-gray-900">{value}</Heading>
        <div className={clx("flex items-center text-xs mt-2 font-medium", trend === 'up' ? "text-green-600" : "text-red-500")}>
          {trend === 'up' ? <ArrowUpRightMini /> : <ArrowDownRightMini />}
          <span className="ml-1">{subValue} so với kỳ trước</span>
        </div>
      </div>
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
        <Icon className="w-6 h-6" />
      </div>
    </Container>
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 animate-pulse font-medium">Đang đồng bộ số liệu thống kê...</div>
      </div>
    );
  }
  
  const stats = data?.stats || { total_revenue: 0, total_orders: 0, avg_order_value: 0 };
  const charts = data?.charts || { revenue: [], status: [] };
  
  // Lấy thẳng cục dữ liệu tăng trưởng siêu chuẩn từ Backend trả về
  const supportStats = stats.support_stats || { orders: 0, amount: 0 };

  return (
    <div className="flex flex-col gap-y-8 min-h-screen">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading level="h1" className="text-2xl text-gray-900">Tổng quan cửa hàng</Heading>
          <Text className="text-gray-500 text-sm mt-1">Theo dõi hiệu suất kinh doanh và trạng thái đơn hàng của bạn.</Text>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-max">
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clx(
                "px-4 py-1.5 text-sm font-semibold rounded-md transition-colors",
                timeRange === range ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {range === 'month' ? 'Tháng này' : range === 'quarter' ? 'Quý này' : 'Năm nay'}
            </button>
          ))}
        </div>
      </div>

      {/* DÒNG 1: THỂ KPI (Đã mở rộng thành 5 cột) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Tổng Chi Tiêu" value={`$${stats.total_revenue.toLocaleString('en-US')}`} subValue="+12.5%" trend="up" icon={CurrencyDollar} />
        <KPICard title="Đơn Hàng Mới" value={stats.total_orders.toLocaleString('en-US')} subValue="+5.2%" trend="up" icon={ShoppingCart} />
        <KPICard title="Giá Trị Đơn Trung Bình" value={`$${stats.avg_order_value.toFixed(2)}`} subValue="-1.1%" trend="down" icon={Tag} />
        
        {/* HIỂN THỊ TĂNG TRƯỞNG CHUẨN XÁC TỪ DATABASE */}
        <KPICard 
          title="Đơn Hàng Được Hỗ Trợ" 
          value={`${supportStats.orders} đơn`} 
          subValue={`Tiết kiệm $${supportStats.amount.toFixed(2)}`} 
          trend="up" 
          icon={(props: any) => (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )} 
        />

        {/* THẺ MỚI: CHIẾT KHẤU ƯU ĐÃI TỪ ADMIN */}
        <KPICard 
          title="Mức Chiết Khấu" 
          value={stats.special_discount || "$0"} 
          subValue={stats.discount_note || "Hạng thành viên tiêu chuẩn"} 
          trend="up" 
          icon={(props: any) => (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )} 
        />
      </div>

      {/* DÒNG 2: BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BIỂU ĐỒ ĐƯỜNG (DOANH THU) */}
        <Container className="p-6 bg-white shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
          <Heading level="h2" className="text-base text-gray-800 mb-6">Biến động Doanh Thu & Lượng Đơn</Heading>
          <div className="flex-1 min-h-[300px] w-full">
            {charts.revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.revenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => [name === 'revenue' ? `$${value}` : value, name === 'revenue' ? 'Doanh thu' : 'Đơn hàng']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </Container>

        {/* BIỂU ĐỒ TRÒN (TRẠNG THÁI ĐƠN) */}
        <Container className="p-6 bg-white shadow-sm border border-gray-100 flex flex-col">
          <Heading level="h2" className="text-base text-gray-800 mb-6">Tỷ trọng trạng thái đơn hàng</Heading>
          <div className="flex-1 min-h-[300px] w-full flex items-center justify-center relative">
            {charts.status.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.status}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {charts.status.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Text className="text-gray-400 text-xs font-bold uppercase">Tổng đơn</Text>
                  <Heading className="text-3xl text-gray-900 mt-1">
                    {charts.status.reduce((a: number, b: any) => a + b.value, 0)}
                  </Heading>
                </div>
              </>
            ) : (
               <div className="text-gray-400 text-sm">Chưa có đơn hàng nào</div>
            )}
          </div>
        </Container>
      </div>

    </div>
  );
}
