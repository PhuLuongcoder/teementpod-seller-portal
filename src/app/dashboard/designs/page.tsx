'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useShop } from '@/context/ShopContext';
import api from '@/lib/axios';
import { useConfirm } from '@/context/ConfirmContext';

type Design = {
  id: string;
  sku: string;
  design_front_url: string;
  design_back_url: string;
  mockup_url: string;
  extra_print_areas?: { name: string; url: string }[];
  created_at: string;
};

export default function DesignsPage() {
  const { confirm } = useConfirm();
  const { selectedShopId } = useShop();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State phân trang & tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State điều khiển Modal Form & CSV
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<Partial<Design> | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Gọi API lấy danh sách thiết kế
  const fetchDesigns = useCallback(async () => {
    if (!selectedShopId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/partner/designs', {
        params: { 
          shop_id: selectedShopId,
          search: searchQuery,
          page: currentPage
        }
      });
      setDesigns(response.data.designs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.count || 0);
    } catch (err: any) {
      setError('Không thể kết nối API tải thư viện thiết kế.');
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, searchQuery, currentPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDesigns();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchDesigns]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const openModal = (design: Partial<Design> | null = null) => {
    setCurrentDesign(design || { 
      sku: '', 
      design_front_url: '', 
      design_back_url: '', 
      mockup_url: '',
      extra_print_areas: [] 
    });
    setIsModalOpen(true);
  };

  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDesign?.sku?.trim() || !selectedShopId) return;
    setFormSaving(true);

    try {
      await api.post('/partner/designs', {
        ...currentDesign,
        // Lọc bỏ các vùng in rỗng trước khi gửi
        extra_print_areas: currentDesign.extra_print_areas?.filter(a => a.name || a.url) || [],
        shop_id: selectedShopId
      });
      setIsModalOpen(false);
      fetchDesigns(); 
    } catch (err: any) {
      alert('Gặp lỗi khi lưu trữ thiết kế. SKU có thể không hợp lệ.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xóa thiết kế",
      message: "Bạn có chắc chắn muốn xóa thiết kế này khỏi thư viện? Các đơn hàng cũ có thể bị ảnh hưởng link ảnh.",
      confirmText: "Xóa thiết kế",
      isDanger: true
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/partner/designs/${id}`);
      fetchDesigns();
    } catch (err) {
      alert('Không thể xóa thiết kế.');
    }
  };

  // ==========================================
  // HÀM XỬ LÝ XUẤT FILE CSV
  // ==========================================
  const handleExportCSV = async () => {
    if (!selectedShopId) return;
    setIsExporting(true);
    try {
      const response = await api.get('/partner/designs/csv', {
        params: { shop_id: selectedShopId }
      });
      
      const csvContent = response.data.csvData; 
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `designs_export_${selectedShopId}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Hệ thống gặp sự cố trong quá trình xuất file CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // HÀM XỬ LÝ NHẬP FILE CSV (IMPORT)
  // ==========================================
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedShopId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      setIsImporting(true);
      try {
        const response = await api.post('/partner/designs/csv', {
          csvData: csvText,
          shop_id: selectedShopId
        });
        
        if (response.data.status === "success") {
          alert(response.data.message);
          fetchDesigns(); 
        }
      } catch (error: any) {
        alert("Lỗi nhập CSV: " + (error.response?.data?.error || "Không xác định"));
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="space-y-6">
      {/* KHỐI TIÊU ĐỀ & THANH CÔNG CỤ NÂNG CẤP */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Thư viện Thiết kế & SKU</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý kho tài nguyên in ấn. Hệ thống tự động đối chiếu dữ liệu khi nạp CSV.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 md:w-56 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Tìm theo mã SKU..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm"
            />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || !selectedShopId}
            className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isImporting ? <span className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></span> : 'Nhập CSV'}
          </button>

          <button 
            onClick={handleExportCSV}
            disabled={isExporting || !selectedShopId}
            className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isExporting ? <span className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></span> : 'Xuất CSV'}
          </button>

          <button 
            onClick={() => openModal(null)}
            disabled={!selectedShopId}
            className="bg-gray-900 text-white font-bold text-sm px-5 py-2 rounded-lg shadow hover:bg-black transition active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            + Thêm Mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 animate-pulse font-medium">Đang truy xuất thư viện ảnh...</p>}
      {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg text-sm font-semibold">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest border-b">
                  <th className="p-4 font-bold">Mã Định Danh (SKU)</th>
                  <th className="p-4 font-bold">Mặt Trước</th>
                  <th className="p-4 font-bold">Mặt Sau</th>
                  <th className="p-4 font-bold">Mockup</th>
                  <th className="p-4 font-bold">Vùng In Phụ</th>
                  <th className="p-4 font-bold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {designs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 italic">
                      {searchQuery ? 'Không tìm thấy SKU nào phù hợp.' : 'Cửa hàng hiện tại chưa có dữ liệu thiết kế.'}
                    </td>
                  </tr>
                ) : (
                  designs.map((design) => (
                    <tr key={design.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-900">{design.sku}</td>
                      <td className="p-4">
                        {design.design_front_url ? (
                          <a href={design.design_front_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs block truncate max-w-[150px]">Front Design</a>
                        ) : <span className="text-gray-400 italic">Không có</span>}
                      </td>
                      <td className="p-4">
                        {design.design_back_url ? (
                          <a href={design.design_back_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs block truncate max-w-[150px]">Back Design</a>
                        ) : <span className="text-gray-400 italic">Không có</span>}
                      </td>
                      <td className="p-4">
                        {design.mockup_url ? (
                          <a href={design.mockup_url} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline text-xs block truncate max-w-[150px]">Mockup</a>
                        ) : <span className="text-gray-400 italic">Không có</span>}
                      </td>
                      {/* Cột hiển thị Vùng in phụ dạng Tooltip */}
                      <td className="p-4 relative group/ext">
                        {design.extra_print_areas && design.extra_print_areas.length > 0 ? (
                          <div className="cursor-help w-max">
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-purple-200">
                              +{design.extra_print_areas.length} vùng in
                            </span>
                            {/* Popup Tooltip Hover */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/ext:flex flex-col gap-2 z-[99] bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 w-max min-w-[200px] animate-in fade-in zoom-in duration-200">
                              {design.extra_print_areas.map((ep, i) => (
                                <div key={i} className="flex justify-between items-center gap-4 text-xs">
                                  <span className="font-semibold text-purple-300">{ep.name}:</span>
                                  <a href={ep.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline max-w-[180px] truncate">
                                    {ep.url}
                                  </a>
                                </div>
                              ))}
                              {/* Mũi tên nhỏ trỏ xuống */}
                              <div className="w-3 h-3 bg-gray-900 border-b border-r border-gray-700 rotate-45 absolute -bottom-1.5 left-6"></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Không có</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button onClick={() => openModal(design)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                        <button onClick={() => handleDeleteDesign(design.id)} className="text-red-500 font-bold hover:underline">Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-sm text-gray-500 font-medium">
                Hiển thị trang <span className="font-bold text-gray-900">{currentPage}</span> / <span className="font-bold text-gray-900">{totalPages}</span> (Tổng {totalCount} thiết kế)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL THÊM / SỬA THIẾT KẾ */}
      {isModalOpen && currentDesign && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveDesign} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gray-50 border-b flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-800">{currentDesign.id ? '🛠️ Cập nhật thông số SKU' : '🎨 Thêm thiết kế gốc vào hệ thống'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl font-light text-gray-400 hover:text-black">&times;</button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mã Định Danh (Design SKU) *</label>
                <input 
                  type="text" 
                  required 
                  disabled={!!currentDesign.id}
                  value={currentDesign.sku || ''} 
                  onChange={(e) => setCurrentDesign({...currentDesign, sku: e.target.value})}
                  className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
                  placeholder="Vd: TS-MEDUSA-FRONT-01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">URL file thiết kế mặt trước (Front URL)</label>
                <input 
                  type="url" 
                  value={currentDesign.design_front_url || ''} 
                  onChange={(e) => setCurrentDesign({...currentDesign, design_front_url: e.target.value})}
                  className="w-full border p-2.5 rounded-lg text-xs outline-none focus:border-blue-500 text-blue-600"
                  placeholder="https://link-driver-or-s3/design_front.png"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">URL file thiết kế mặt sau (Back URL)</label>
                <input 
                  type="url" 
                  value={currentDesign.design_back_url || ''} 
                  onChange={(e) => setCurrentDesign({...currentDesign, design_back_url: e.target.value})}
                  className="w-full border p-2.5 rounded-lg text-xs outline-none focus:border-blue-500 text-blue-600"
                  placeholder="https://link-driver-or-s3/design_back.png"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">URL ảnh Mockup sản phẩm</label>
                <input 
                  type="url" 
                  value={currentDesign.mockup_url || ''} 
                  onChange={(e) => setCurrentDesign({...currentDesign, mockup_url: e.target.value})}
                  className="w-full border p-2.5 rounded-lg text-xs outline-none focus:border-teal-500 text-teal-700"
                  placeholder="https://link-img/mockup.jpg"
                />
              </div>

              {/* VÙNG IN PHỤ (EXTRA PRINT AREAS) ĐƯỢC BỔ SUNG */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Các vùng in tùy chọn (Tay áo, Cổ...)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const areas = currentDesign.extra_print_areas || [];
                      setCurrentDesign({ ...currentDesign, extra_print_areas: [...areas, { name: '', url: '' }] });
                    }}
                    className="text-[10px] bg-purple-50 px-3 py-1.5 rounded-lg text-purple-700 font-bold hover:bg-purple-100 transition shadow-sm border border-purple-100"
                  >
                    + Thêm vùng in
                  </button>
                </div>
                
                <div className="space-y-2">
                  {currentDesign.extra_print_areas && currentDesign.extra_print_areas.length > 0 ? (
                    currentDesign.extra_print_areas.map((area, aIdx) => (
                      <div key={aIdx} className="flex gap-2 items-center bg-gray-50/50 p-2 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          placeholder="Vị trí (vd: Tay trái)"
                          value={area.name || ''}
                          onChange={(e) => {
                            const newAreas = [...(currentDesign.extra_print_areas || [])];
                            newAreas[aIdx] = { ...newAreas[aIdx], name: e.target.value };
                            setCurrentDesign({ ...currentDesign, extra_print_areas: newAreas });
                          }}
                          className="w-1/3 border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-purple-500 bg-white"
                        />
                        <input
                          type="url"
                          placeholder="Link thiết kế URL"
                          value={area.url || ''}
                          onChange={(e) => {
                            const newAreas = [...(currentDesign.extra_print_areas || [])];
                            newAreas[aIdx] = { ...newAreas[aIdx], url: e.target.value };
                            setCurrentDesign({ ...currentDesign, extra_print_areas: newAreas });
                          }}
                          className="flex-1 border border-gray-200 p-2 rounded-md text-xs text-purple-600 outline-none focus:border-purple-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newAreas = (currentDesign.extra_print_areas || []).filter((_, i) => i !== aIdx);
                            setCurrentDesign({ ...currentDesign, extra_print_areas: newAreas });
                          }}
                          className="text-red-400 hover:text-red-600 text-xs font-bold px-2"
                        >✕</button>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-gray-400 italic p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                      Thiết kế này chưa có khu vực in phụ.
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 font-bold text-gray-400 hover:text-gray-600">Hủy</button>
              <button type="submit" disabled={formSaving} className="bg-gray-900 text-white px-8 py-2 rounded-xl font-bold shadow hover:bg-black transition">
                {formSaving ? 'Đang lưu trữ...' : 'Xác nhận lưu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}