'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useShop } from '@/context/ShopContext'; 
import { useConfirm } from '@/context/ConfirmContext';

export default function StoresManagementPage() {
  const { confirm } = useConfirm();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy hàm đồng bộ Sidebar từ Context
  const { refreshShops, setSelectedShopId } = useShop();

  // STATE QUẢN LÝ MODAL CHỈNH SỬA
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '', name: '', logo_url: '', tax_id: ''
  });

  // STATE QUẢN LÝ MODAL TẠO MỚI
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newShopName, setNewShopName] = useState('');

  // GỌI API LẤY DANH SÁCH SHOP
  const fetchStores = async () => {
    try {
      const res = await api.get('/partner/shops');
      setStores(res.data.shops || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  // XỬ LÝ TẠO STORE MỚI
  const handleCreateShop = async () => {
    if (!newShopName.trim()) {
      alert("Tên cửa hàng không được để trống!");
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await api.post('/partner/shops', { name: newShopName });
      
      // Đồng bộ Sidebar & Chọn ngay shop vừa tạo
      await refreshShops(); 
      setSelectedShopId(response.data.shop.id); 
      
      // Đồng bộ bảng trên trang hiện tại
      fetchStores(); 
      
      setIsCreateModalOpen(false);
      setNewShopName('');
    } catch (error) {
      alert("Lỗi khi tạo Cửa hàng. Vui lòng thử lại!");
    } finally {
      setIsCreating(false);
    }
  };

  // MỞ MODAL SỬA
  const openEditModal = (shop: any) => {
    setEditForm({
      id: shop.id, name: shop.name || '', logo_url: shop.logo_url || '', tax_id: shop.tax_id || ''
    });
    setIsEditModalOpen(true);
  };

  // ĐÓNG MODAL SỬA
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditForm({ id: '', name: '', logo_url: '', tax_id: '' });
  };

  // LƯU CẬP NHẬT SHOP
  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      alert("Tên cửa hàng không được để trống!");
      return;
    }
    
    setIsSaving(true);
    try {
      await api.post(`/partner/shops/${editForm.id}`, { 
        name: editForm.name, logo_url: editForm.logo_url, tax_id: editForm.tax_id
      });
      fetchStores();
      await refreshShops(); // Đồng bộ lại tên shop ở Sidebar nếu có đổi tên
      closeEditModal();
    } catch (error) {
      alert("Lỗi khi cập nhật thông tin cửa hàng");
    } finally {
      setIsSaving(false);
    }
  };

  // KHÓA / MỞ KHÓA
  const handleToggleStatus = async (shop: any) => {
    const action = shop.is_active ? "Khóa" : "Mở khóa";
    
    // Thay thế window.confirm
    const isConfirmed = await confirm({
      title: "Xác nhận trạng thái",
      message: `Bạn có chắc muốn ${action.toLowerCase()} cửa hàng "${shop.name}"?`,
      confirmText: action,
      isDanger: shop.is_active // Nút màu đỏ nếu đang hành động khóa
    });

    if (!isConfirmed) return;

    try {
      await api.post(`/partner/shops/${shop.id}`, { is_active: !shop.is_active });
      fetchStores();
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  // XÓA STORE
  const handleDelete = async (id: string) => {
    // Thay thế window.confirm
    const isConfirmed = await confirm({
      title: "Cảnh báo hệ thống",
      message: "Xóa cửa hàng sẽ mất toàn bộ kết nối và dữ liệu liên quan. Bạn chắc chứ?",
      confirmText: "Xóa vĩnh viễn",
      isDanger: true
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/partner/shops/${id}`);
      window.location.reload(); 
    } catch (error) {
      alert("Lỗi khi xóa cửa hàng");
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Cửa hàng (Stores)</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách, trạng thái và cài đặt của các điểm bán hàng.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#C29017] text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:bg-[#a67b13] transition"
        >
          + Kết nối Store mới
        </button>
      </div>

      {/* DANH SÁCH CỬA HÀNG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th className="p-4 border-b w-16">Logo</th>
              <th className="p-4 border-b">Tên Cửa hàng</th>
              <th className="p-4 border-b">Mã hệ thống (ID)</th>
              <th className="p-4 border-b">Trạng thái</th>
              <th className="p-4 border-b text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
            ) : stores.map((shop) => {
              const isActive = shop.is_active !== false;

              return (
                <tr key={shop.id} className="border-b border-gray-50 hover:bg-gray-50 transition group">
                  <td className="p-4">
                    {shop.logo_url ? (
                      <img src={shop.logo_url} alt="logo" className="w-8 h-8 rounded border border-gray-200 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-200">
                        {shop.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{shop.name}</p>
                    {shop.tax_id && <p className="text-[10px] text-gray-400 font-medium">Tax: {shop.tax_id}</p>}
                  </td>
                  <td className="p-4 text-xs text-gray-400 font-mono">{shop.id}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isActive ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(shop)} className="text-[#C29017] hover:underline">Thiết lập</button>
                    <button onClick={() => handleToggleStatus({ ...shop, is_active: isActive })} className="text-gray-600 hover:underline">
                      {isActive ? 'Khóa' : 'Mở khóa'}
                    </button>
                    <button onClick={() => handleDelete(shop.id)} className="text-red-500 hover:underline">Xóa</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* POPUP TẠO CỬA HÀNG MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Tạo Cửa hàng mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl transition">&times;</button>
            </div>
            
            <div className="p-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={newShopName}
                onChange={e => setNewShopName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C29017] focus:ring-1 focus:ring-[#C29017] transition"
                placeholder="Vd: TikTok Shop US"
                autoFocus
              />
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleCreateShop}
                disabled={isCreating}
                className="bg-[#C29017] text-white px-6 py-2 text-sm font-bold rounded-lg shadow-md hover:bg-[#a67b13] transition disabled:opacity-50"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo cửa hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHỈNH SỬA THÔNG TIN */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Thiết lập Cửa hàng</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-red-500 font-bold text-xl transition">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C29017] focus:ring-1 focus:ring-[#C29017] transition"
                  placeholder="Vd: TikTok Shop US"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Link Logo (URL)
                </label>
                <input 
                  type="text" 
                  value={editForm.logo_url}
                  onChange={e => setEditForm({...editForm, logo_url: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C29017] focus:ring-1 focus:ring-[#C29017] transition"
                  placeholder="https://..."
                />
                <p className="text-[10px] text-gray-400 mt-1">Dùng để in lên packing slip (hóa đơn vận chuyển) nếu có.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Mã số thuế / IOSS / VAT
                </label>
                <input 
                  type="text" 
                  value={editForm.tax_id}
                  onChange={e => setEditForm({...editForm, tax_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C29017] focus:ring-1 focus:ring-[#C29017] transition"
                  placeholder="Vd: IM2760000742"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={closeEditModal}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="bg-[#C29017] text-white px-6 py-2 text-sm font-bold rounded-lg shadow-md hover:bg-[#a67b13] transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thiết lập'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}