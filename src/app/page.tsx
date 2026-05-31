'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function IntegratedAuthPage() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/partner/auth/login', {
          username: formData.username,
          password: formData.password,
        });

        if (response.data.status === 'success') {
          login(response.data.token, response.data.user);
        }
      } else {
        const response = await api.post('/partner/auth/register', formData);
        
        if (response.data.status === 'success') {
          login(response.data.token, response.data.user);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xử lý thất bại. Vui lòng kiểm tra lại thông tin cung cấp.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Ép font chữ toàn bộ trang thành vietnam_one_pro hoặc Be Vietnam Pro
    <div 
      className="flex min-h-screen w-full bg-white" 
      style={{ fontFamily: "'vietnam_one_pro', 'Be Vietnam Pro', sans-serif" }}
    >
      
      {/* CỘT TRÁI: KHU VỰC FORM ĐĂNG NHẬP */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50/50">
        
        {/* NỀN FORM: Mở rộng kích thước với max-w-[540px] (thay vì max-w-md) */}
        <div className="w-full max-w-[540px] bg-gradient-to-br from-white/95 via-amber-50/30 to-stone-100/95 p-10 rounded-3xl border border-amber-100/50 shadow-xl backdrop-blur-md">
          
          <div className="text-center mb-8">
            <div className="mb-5 flex justify-center">
              <img 
                src="https://mya3bussinessbucket.s3.ap-southeast-2.amazonaws.com/myTeementProductsBucket/Teement_logo.png" 
                alt="Teement Logo" 
                className="h-16 w-auto object-contain drop-shadow-sm"
              />
            </div>
            
            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-wide">
              {isLogin ? 'Đăng nhập' : 'Teemochi POD'}
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              {isLogin ? 'Truy cập vào hệ thống quản lý chuỗi cung ứng' : 'Đăng ký trở thành Đối tác Bán hàng'}
            </p>
          </div>

          <div className="flex bg-gray-200/60 p-1.5 rounded-xl mb-8 shadow-inner">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white shadow-sm text-[#DBBA2A]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng nhập
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white shadow-sm text-[#DBBA2A]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.last_name}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 outline-none focus:bg-white focus:border-[#DBBA2A] focus:ring-4 focus:ring-[#DBBA2A]/10 text-sm transition-all" 
                      placeholder="Nguyễn" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.first_name}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 outline-none focus:bg-white focus:border-[#DBBA2A] focus:ring-4 focus:ring-[#DBBA2A]/10 text-sm transition-all" 
                      placeholder="Văn A" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 outline-none focus:bg-white focus:border-[#DBBA2A] focus:ring-4 focus:ring-[#DBBA2A]/10 text-sm transition-all" 
                    placeholder="0912345678" 
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên Đăng Nhập</label>
              <input 
                type="text" 
                required 
                autoComplete="off"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 outline-none focus:bg-white focus:border-[#DBBA2A] focus:ring-4 focus:ring-[#DBBA2A]/10 text-sm transition-all" 
                placeholder="hello@teemochi.com" 
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu</label>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                autoComplete="new-password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/70 outline-none focus:bg-white focus:border-[#DBBA2A] focus:ring-4 focus:ring-[#DBBA2A]/10 text-sm transition-all" 
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[36px] p-1 text-gray-400 hover:text-[#DBBA2A] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full mt-4 bg-[#DBBA2A] hover:bg-[#c4a425] text-white font-bold py-3.5 rounded-xl transition-all duration-200 disabled:bg-amber-300 flex items-center justify-center gap-2 shadow-lg shadow-[#DBBA2A]/20 hover:shadow-[#DBBA2A]/40 text-base cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
              ) : isLogin ? "Đăng Nhập" : "Tạo Tài Khoản"}
            </button>
          </form>
          
        </div>
      </div>

      {/* CỘT PHẢI: ẢNH NỀN */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1920&q=80')" }}
      >
        <div className="absolute inset-0 bg-stone-900/35 mix-blend-multiply"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
          <h2 className="text-4xl font-bold mb-4 tracking-wide">Hệ thống Print On Demand</h2>
          <p className="text-base text-stone-200 max-w-md leading-relaxed font-medium">
            Tối ưu hóa chuỗi cung ứng, quản lý đơn hàng và đối tác sản xuất một cách toàn diện.
          </p>
        </div>
      </div>

    </div>
  );
}