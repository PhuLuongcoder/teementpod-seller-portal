'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function RegisterPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '', phone: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/partner/auth/register', formData);
      if (response.data.status === 'success') {
        // Đăng ký xong tự động kích hoạt đăng nhập luôn
        login(response.data.token, response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Tạo Tài Khoản</h1>
          <p className="text-gray-500 font-medium">Trở thành đối tác cung cấp dịch vụ POD</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Họ</label>
              <input type="text" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500" placeholder="Nguyễn" onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tên</label>
              <input type="text" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500" placeholder="Văn A" onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
            <input type="tel" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500" placeholder="0912345678" onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên đăng nhập</label>
            <input type="text" required className="..." placeholder="teement_seller_01" onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500" placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition disabled:bg-gray-400 flex items-center justify-center">
            {isLoading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : "Đăng Ký Tài Khoản"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-gray-500">
          Đã có tài khoản? <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
}