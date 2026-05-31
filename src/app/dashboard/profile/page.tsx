'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import api from '@/lib/axios';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { shops, isLoading: isShopsLoading } = useShop();
  
  // State quản lý form cập nhật hồ sơ
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State quản lý tài chính toàn cục (All time)
  const [financials, setFinancials] = useState({ 
    totalSpent: 0, 
    currentDebt: 0, 
    totalPaid: 0, 
    orderCount: 0,
    paymentHistory: [] as any[]
  });

  // State quản lý tài chính chi tiết từng shop trong tháng hiện tại
  const [shopMonthlyStats, setShopMonthlyStats] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsDataLoading(true);
      try {
        // 1. Lấy dữ liệu tài chính tổng quan toàn thời gian
        const globalRes = await api.get('/partner/dashboard', { params: { range: 'all' } });
        setFinancials({
          totalSpent: globalRes.data.stats?.total_revenue || 0,
          currentDebt: globalRes.data.stats?.current_debt || 0,
          totalPaid: globalRes.data.stats?.total_paid || 0,
          orderCount: globalRes.data.stats?.total_orders || 0,
          paymentHistory: globalRes.data.payment_history || []
        });

        // 2. Lấy dữ liệu chi tiêu & công nợ trong tháng hiện tại của từng shop riêng lẻ
        if (shops && shops.length > 0) {
          const statsPromises = shops.map(async (shop) => {
            try {
              const res = await api.get('/partner/dashboard', { 
                params: { shop_id: shop.id, range: 'month' } 
              });
              return {
                id: shop.id,
                name: shop.name,
                logo_url: shop.logo_url,
                tax_id: shop.tax_id,
                totalSpent: res.data.stats?.total_revenue || 0,
                currentDebt: res.data.stats?.current_debt || 0,
                orderCount: res.data.stats?.total_orders || 0
              };
            } catch (err) {
              console.error(`Lỗi lấy dữ liệu shop ${shop.name}:`, err);
              return {
                id: shop.id,
                name: shop.name,
                logo_url: shop.logo_url,
                tax_id: shop.tax_id,
                totalSpent: 0,
                currentDebt: 0,
                orderCount: 0
              };
            }
          });

          const resolvedStats = await Promise.all(statsPromises);
          setShopMonthlyStats(resolvedStats);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu tài chính hồ sơ:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (!isShopsLoading) {
      fetchFinancialData();
    }
  }, [shops, isShopsLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' });
        setIsSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp!' });
        setIsSaving(false);
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Mật khẩu mới phải dài ít nhất 6 ký tự.' });
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload: any = { first_name: firstName, last_name: lastName, phone, username };
      if (currentPassword && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await api.put('/partner/profile', payload);
      setMessage({ type: 'success', text: 'Cập nhật thông tin hồ sơ cá nhân thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Không thể lưu thông tin mới.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn yêu cầu vô hiệu hóa và xóa tài khoản Seller này không? Hành động này sẽ khóa toàn bộ quyền truy cập.");
    if (!confirmDelete) return;

    try {
      await api.delete('/partner/profile');
      alert("Tài khoản của bạn đã được vô hiệu hóa thành công trên hệ thống.");
      logout(); 
    } catch (err) {
      alert("Xảy ra lỗi trong quá trình xử lý yêu cầu xóa tài khoản.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Quản lý hồ sơ tài khoản</h1>
        <p className="text-gray-500 text-sm mt-1">Cập nhật thông tin định danh và theo dõi sức khỏe tài chính.</p>
      </div>

      {/* KHỐI 1: THỐNG KÊ TÀI CHÍNH TỔNG QUAN (ALL TIME) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-sm border border-gray-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng chi tiêu sản xuất</p>
          <p className="text-3xl font-black">${financials.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">Tính trên {financials.orderCount} đơn hàng thành công</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Công nợ tích lũy</p>
          <p className="text-3xl font-black text-red-600">${financials.currentDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">Số tiền cần thanh toán cho xưởng</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng đã thanh toán</p>
          <p className="text-3xl font-black text-green-600">${financials.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">Lịch sử tín dụng và thanh toán</p>
        </div>
      </div>

      {/* KHỐI MỚI: BẢNG KÊ CHI TIÊU & CÔNG NỢ THEO TỪNG SHOP (TRONG THÁNG) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
            Phân rã chi tiêu & Công nợ theo Shop
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Theo dõi nhanh chi phí sản xuất tích lũy, cước vận chuyển và trạng thái dư nợ phát sinh riêng biệt trong tháng của từng chi nhánh.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b">
              <tr>
                <th className="p-4 font-bold">Cửa hàng</th>
                <th className="p-4 font-bold text-center">Đơn trong tháng</th>
                <th className="p-4 font-bold text-right">Chi tiêu trong tháng</th>
                <th className="p-4 font-bold text-right">Dư nợ hiện tại</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isDataLoading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 animate-pulse font-medium">
                    Đang bóc tách số liệu đối soát cho từng shop...
                  </td>
                </tr>
              ) : shopMonthlyStats.length > 0 ? (
                shopMonthlyStats.map((shop: any) => (
                  <tr key={shop.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="p-4 flex items-center gap-3">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 rounded border object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-200">
                          {shop.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-gray-900">{shop.name}</span>
                        {shop.tax_id && <p className="text-[10px] text-gray-400 font-medium">Tax: {shop.tax_id}</p>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {shop.orderCount} đơn
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-gray-800">
                      ${shop.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                      {shop.currentDebt > 0 ? (
                        <span className="text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1 text-xs font-black">
                          ${shop.currentDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1 text-xs font-bold">
                          Sạch
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 italic">
                    Chưa liên kết hệ thống cửa hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHỐI 3: DANH SÁCH LỊCH SỬ THANH TOÁN (SỔ CÁI CHUNG) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              Lịch sử thanh toán & Khớp nợ
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Thống kê lịch sử kế toán các lần nạp tiền, chốt kỳ và gạch nợ thủ công từ Admin xưởng.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 font-bold">Kỳ thanh toán</th>
                <th className="p-4 font-bold">Ngày ghi nhận</th>
                <th className="p-4 font-bold text-center">Đơn thành công</th>
                <th className="p-4 font-bold text-right">Số tiền đã trả</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {financials.paymentHistory.length > 0 ? (
                financials.paymentHistory.map((pay: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition duration-150">
                    <td className="p-4">
                      <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md">
                        {pay.billing_cycle || `Kỳ ${idx + 1}`}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-gray-500">
                      {new Date(pay.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {pay.total_successful_orders || 0} đơn
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-black text-green-600 text-base">
                        ${pay.amount?.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center">
                    <div className="text-gray-400 font-medium text-sm">Chưa có dữ liệu lịch sử thanh toán nào.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHỐI 4: FORM CHỈNH SỬA THÔNG TIN CÁ NHÂN & MẬT KHẨU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-800 border-b pb-2 mb-4">Thông tin cá nhân</h2>
            {message.text && (
              <div className={`p-4 mb-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại liên hệ</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên đăng nhập hệ thống</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 border-b pb-2 mb-4">Đổi mật khẩu bảo mật</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu hiện tại</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Để trống nếu không muốn đổi mật khẩu" className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu mới</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={!currentPassword} className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium disabled:bg-gray-50 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Xác nhận mật khẩu mới</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={!currentPassword} className="w-full border p-2.5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium disabled:bg-gray-50 disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={isSaving} className="bg-gray-900 text-white px-8 py-3 font-bold rounded-xl text-sm transition hover:bg-gray-800 disabled:bg-gray-300 shadow-md">
              {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </form>

        <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-red-700">Vùng nguy hiểm (Danger Zone)</h2>
            <p className="text-xs text-gray-500 mt-1">Khi bạn yêu cầu vô hiệu hóa tài khoản, toàn bộ cửa hàng, dữ liệu đơn và cổng import CSV của bạn sẽ bị tạm ngưng hoạt động ngay lập tức.</p>
          </div>
          <button type="button" onClick={handleDeleteAccount} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm">
            Đóng & vô hiệu hóa tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}