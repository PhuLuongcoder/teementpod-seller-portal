'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

// Định nghĩa kiểu dữ liệu cho Đơn thiết kế
type DesignOrder = {
  id: string;
  original_image: string;
  type: 'remake' | 'custom' | 'enhance';
  quantity: number;
  price: number;
  instructions: string;
  status: 'in_process' | 'waiting_approval' | 'completed';
  result_link?: string;
  created_at: string;
};

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;

  // ==========================================
  // STATE: THÔNG TIN DỊCH VỤ & TÀI CHÍNH
  // ==========================================
  const [unitPrice, setUnitPrice] = useState<number>(0); // Lấy từ Admin Backend
  const [totalServiceSpend, setTotalServiceSpend] = useState<number>(0); // Tổng chi tiêu dịch vụ
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // STATE: FORM TẠO YÊU CẦU MỚI
  // ==========================================
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceType, setServiceType] = useState<'remake' | 'custom' | 'enhance'>('remake');
  const [quantity, setQuantity] = useState<number>(1);
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // STATE: HÀNG CHỜ (QUEUE) & DUYỆT (REVISION)
  // ==========================================
  const [queue, setQueue] = useState<DesignOrder[]>([]);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Giả lập Fetch Data ban đầu
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        // Gọi API lấy giá unitPrice của dịch vụ này từ Admin và danh sách Queue của Seller
        // const res = await api.get(`/partner/services/${serviceId}`);
        // Giả lập dữ liệu:
        setUnitPrice(5.00); // 5$ / design
        setTotalServiceSpend(125.00);
        setQueue([
          {
            id: 'REQ-1001',
            original_image: 'https://placehold.co/150',
            type: 'remake',
            quantity: 1,
            price: 5.00,
            instructions: 'Bỏ background đen',
            status: 'waiting_approval',
            result_link: 'https://drive.google.com/file/...',
            created_at: new Date().toISOString()
          },
          {
            id: 'REQ-1002',
            original_image: 'https://placehold.co/150',
            type: 'enhance',
            quantity: 2,
            price: 10.00,
            instructions: 'Làm nét up lên 4K',
            status: 'in_process',
            created_at: new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setIsLoading(false); 
      }
    };
    fetchServiceData();
  }, [serviceId]);

  // ==========================================
  // XỬ LÝ ẢNH & PREVIEW
  // ==========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadMethod('file');
      setImageUrlInput('');
    }
  };

  const handleUrlBlur = () => {
    if (imageUrlInput.trim().startsWith('http')) {
      setPreviewUrl(imageUrlInput);
      setSelectedFile(null);
    }
  };

  // ==========================================
  // XỬ LÝ ACTIONS (SUBMIT, REVISION, APPROVE)
  // ==========================================
  const handleCreateRequest = async () => {
    if (!previewUrl) return alert('Vui lòng cung cấp hình ảnh thiết kế!');
    if (quantity < 1) return alert('Số lượng không hợp lệ!');

    setIsSubmitting(true);
    try {
      // payload = { serviceId, type, quantity, instructions, file / imageUrl }
      // Mock add to queue:
      const newReq: DesignOrder = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        original_image: previewUrl,
        type: serviceType,
        quantity,
        price: quantity * unitPrice,
        instructions,
        status: 'in_process',
        created_at: new Date().toISOString()
      };
      
      setQueue([newReq, ...queue]);
      
      // Reset Form
      setSelectedFile(null);
      setImageUrlInput('');
      setPreviewUrl(null);
      setQuantity(1);
      setInstructions('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      alert('Đã gửi yêu cầu thành công!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if(!confirm("Xác nhận mẫu thiết kế này đã đạt yêu cầu?")) return;
    // Cập nhật API...
    setQueue(queue.map(q => q.id === id ? { ...q, status: 'completed' } : q));
  };

  const submitRevision = async () => {
    if (!revisionNote.trim()) return alert("Vui lòng nhập nội dung cần chỉnh sửa!");
    // Cập nhật API...
    setQueue(queue.map(q => q.id === selectedOrderId ? { ...q, status: 'in_process' } : q));
    setIsRevisionModalOpen(false);
    setRevisionNote('');
    alert("Đã gửi yêu cầu chỉnh sửa lại cho Admin!");
  };

  const totalPrice = quantity * unitPrice;

  if (isLoading) return <div className="p-8 text-center animate-pulse">Đang tải cấu hình dịch vụ...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & CHỈ SỐ TÀI CHÍNH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <Link href="/dashboard/services" className="text-xs font-bold text-gray-400 hover:text-[#C29017] mb-1 inline-block">
            ← Quay lại danh sách
          </Link>
          <h1 className="text-xl font-black text-gray-900">Thiết kế & Xử lý đồ họa</h1>
        </div>
        
        <div className="bg-gray-900 text-white px-5 py-3 rounded-xl flex items-center gap-4 shadow-md">
          <div className="p-2 bg-white/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#C29017]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Tổng chi tiêu Dịch Vụ</div>
            <div className="text-lg font-black text-[#C29017]">${totalServiceSpend.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI: FORM YÊU CẦU */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-6">
          <h2 className="font-extrabold text-gray-800 uppercase tracking-wide border-b pb-3 text-sm">Tạo yêu cầu mới</h2>
          
          {/* 1. Upload Ảnh */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Hình ảnh thiết kế gốc *</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button type="button" onClick={() => setUploadMethod('file')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${uploadMethod === 'file' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Tải File</button>
              <button type="button" onClick={() => setUploadMethod('url')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${uploadMethod === 'url' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Dán Link</button>
            </div>
            
            {uploadMethod === 'file' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-6 text-center cursor-pointer hover:border-[#C29017] hover:bg-[#C29017]/5 transition"
              >
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <span className="text-2xl mb-2 block">📤</span>
                <span className="text-xs font-bold text-gray-600 block">Click để chọn ảnh từ máy</span>
              </div>
            ) : (
              <input 
                type="text" 
                placeholder="Dán link ảnh (http...)" 
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onBlur={handleUrlBlur}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-[#C29017]"
              />
            )}

            {previewUrl && (
              <div className="relative w-full h-40 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <button onClick={() => {setPreviewUrl(null); setSelectedFile(null); setImageUrlInput('');}} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            )}
          </div>

          {/* 2. Cấu hình Option */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Hình thức xử lý</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'remake', label: 'Remake (Vẽ lại y hệt)', desc: 'Đồ lại nét chuẩn Vector' },
                { id: 'custom', label: 'Custom (Tùy biến)', desc: 'Chỉnh sửa phong cách, text' },
                { id: 'enhance', label: 'Enhance/Clone', desc: 'Làm nét, tăng độ phân giải' },
              ].map(opt => (
                <label key={opt.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${serviceType === opt.id ? 'border-[#C29017] bg-[#C29017]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="type" checked={serviceType === opt.id} onChange={() => setServiceType(opt.id as any)} className="accent-[#C29017] w-4 h-4" />
                  <div>
                    <div className={`text-sm font-bold ${serviceType === opt.id ? 'text-[#C29017]' : 'text-gray-700'}`}>{opt.label}</div>
                    <div className="text-[10px] text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Số lượng & Ghi chú */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Số lượng Design</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value)||1)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-center outline-none focus:border-[#C29017]" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Chỉ dẫn chi tiết cho Designer</label>
              <textarea rows={3} placeholder="VD: Đổi text thành 'Hello 2026', đổi tông màu thành vintage..." value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-[#C29017] resize-none" />
            </div>
          </div>

          {/* 4. Tổng tiền & Submit */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">Tổng phí thanh toán</div>
              <div className="text-2xl font-black text-gray-900">${totalPrice.toFixed(2)}</div>
            </div>
            <button 
              onClick={handleCreateRequest}
              disabled={isSubmitting || !previewUrl}
              className="bg-[#C29017] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#a67b13] disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Yêu cầu'}
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: QUEUE BẢNG ĐIỀU KHIỂN */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-extrabold text-gray-800 uppercase tracking-wide text-sm">Hàng chờ & Tiến độ (Queue)</h2>
            <div className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{queue.length} đơn</div>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="p-4">Mã Đơn</th>
                  <th className="p-4">Hình gốc</th>
                  <th className="p-4">Phân loại</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-center">Thao tác duyệt</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {queue.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Chưa có yêu cầu nào.</td></tr>
                ) : queue.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono font-bold text-gray-900 text-xs">{req.id}</td>
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden">
                        <img src={req.original_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 uppercase text-[10px]">{req.type}</div>
                      <div className="text-[10px] text-gray-500">SL: {req.quantity} | ${req.price}</div>
                    </td>
                    <td className="p-4 text-center">
                      {req.status === 'in_process' && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-blue-100 shadow-sm">Đang Xử Lý</span>}
                      {req.status === 'waiting_approval' && <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-200 shadow-sm animate-pulse">Đợi Duyệt</span>}
                      {req.status === 'completed' && <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-green-100 shadow-sm">Hoàn Thành</span>}
                    </td>
                    <td className="p-4 text-center align-middle">
                      {req.status === 'waiting_approval' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setSelectedOrderId(req.id); setIsRevisionModalOpen(true); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                            Điều chỉnh
                          </button>
                          <button onClick={() => handleApprove(req.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">
                            Duyệt file
                          </button>
                          {req.result_link && (
                            <a href={req.result_link} target="_blank" className="text-blue-500 hover:underline text-[10px] font-bold ml-1">Xem File</a>
                          )}
                        </div>
                      ) : req.status === 'completed' ? (
                         <a href={req.result_link} target="_blank" className="text-blue-500 hover:underline text-xs font-bold flex items-center justify-center gap-1">
                           🔗 Tải File
                         </a>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Đợi Admin...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* REVISION MODAL */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-extrabold text-base text-gray-900">Yêu cầu điều chỉnh File</h3>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500">Bạn muốn Designer chỉnh sửa lại chi tiết nào cho đơn hàng <strong className="text-gray-800">{selectedOrderId}</strong>?</p>
              <textarea 
                rows={4} 
                value={revisionNote} 
                onChange={e => setRevisionNote(e.target.value)} 
                placeholder="Ví dụ: Đổi màu chữ sang đỏ tươi hơn, kéo bố cục logo dịch sang trái 2cm..." 
                className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" 
              />
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsRevisionModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition">Hủy</button>
              <button onClick={submitRevision} className="px-5 py-2 text-xs font-bold bg-[#C29017] text-white rounded-lg shadow-md hover:bg-[#a67b13] transition">Gửi Yêu Cầu</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
