'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useShop } from '@/context/ShopContext';

export default function PodBlankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedShopId } = useShop();
  
  const [blank, setBlank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    const fetchDetail = async () => {
      // SỬA: Chặn ngay lập tức nếu Next.js chưa kịp load xong params.id trên URL
      if (!selectedShopId || !params?.id) return; 
      
      try {
        const res = await api.get(`/partner/pod-blanks/${params.id}`, {
          params: { shop_id: selectedShopId }
        });
        const fetchedBlank = res.data.blank;
        setBlank(fetchedBlank);
        
        if (fetchedBlank.sizes?.length > 0) setSelectedSize(fetchedBlank.sizes[0]);
        if (fetchedBlank.colors?.length > 0) setSelectedColor(fetchedBlank.colors[0]);

      } catch (error) {
        console.error("Lỗi khi tải chi tiết phôi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params?.id, selectedShopId]);

  // LOGIC TRÍCH XUẤT GIÁ BAO GỒM SHIP VÀ EXTRA PRINT THEO SIZE
  const currentPricing = useMemo(() => {
    if (!blank) return { base_price: 0, extra_print: 0 };
    
    if (blank.size_prices && selectedSize && blank.size_prices[selectedSize]) {
      return blank.size_prices[selectedSize];
    }
    
    return { base_price: blank.display_price || 0, extra_print: 0 };
  }, [blank, selectedSize]);

  const isVariantOutOfStock = useMemo(() => {
    if (!blank) return false;
    if (blank.in_stock === false) return true; 
    
    if (blank.out_of_stock_variants && Array.isArray(blank.out_of_stock_variants)) {
      return blank.out_of_stock_variants.some(
        (v: any) => v.color?.toLowerCase() === selectedColor?.toLowerCase() && 
                    v.size?.toLowerCase() === selectedSize?.toLowerCase()
      );
    }
    return false;
  }, [blank, selectedColor, selectedSize]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải thông tin phôi...</div>;
  if (!blank) return <div className="p-8 text-center text-red-500">Không tìm thấy sản phẩm.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2 transition">
        &larr; Quay lại danh mục phôi
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* KHỐI ẢNH BÊN TRÁI */}
        <div className="w-full md:w-5/12 bg-gray-50 p-6 flex items-center justify-center border-r border-gray-100 relative">
            <img 
                src={blank.image_url || "https://placehold.co/600x600/f3f4f6/a1a1aa?text=No+Image"} 
                alt={blank.name} 
                className="w-full h-auto object-contain mix-blend-multiply drop-shadow-xl"
            />
            
            <div className={`absolute top-4 left-4 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
              isVariantOutOfStock 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
                {isVariantOutOfStock ? 'Hết hàng tại xưởng' : 'Sẵn sàng sản xuất'}
            </div>
        </div>

        {/* KHỐI TÙY CHỌN BÊN PHẢI */}
        <div className="w-full md:w-7/12 p-8 lg:p-10 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{blank.name}</h1>
            <p className="text-sm text-gray-500 font-medium">Mã Phôi Gốc: <span className="text-gray-800 font-mono font-bold">{blank.sku}</span></p>
          </div>

          {/* ========================================================= */}
          {/* KHỐI HIỂN THỊ GIÁ & CHI TIẾT DỊCH VỤ MỚI */}
          {/* ========================================================= */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Base Cost (Size <span className="text-gray-900 font-extrabold">{selectedSize}</span>)
              </p>
            </div>
            
            <div className="flex items-end gap-3 mb-5">
              <span className="text-5xl font-black text-[#C29017] tracking-tight transition-all duration-300">
                ${currentPricing.base_price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 font-bold mb-2">/ sản phẩm hoàn thiện</span>
            </div>

            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Giá đã bao gồm <strong className="text-gray-900">phí vận chuyển tiêu chuẩn nội địa (USPS)</strong>.</span>
              </div>
              
              <div className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Giá đã bao gồm <strong className="text-gray-900">in 01 mặt tiêu chuẩn</strong> (Mặt trước hoặc mặt sau).</span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-gray-700 font-medium pt-3 border-t border-gray-200 mt-1">
                <svg className="w-5 h-5 text-[#C29017] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Phí in mặt phụ / tay áo (Extra Print Area):</span>
                <span className="font-black text-gray-900 ml-auto bg-white px-2 py-1 rounded border border-gray-200">
                  +${currentPricing.extra_print.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          {/* ========================================================= */}

          {/* CHỌN MÀU SẮC */}
          {blank.colors && blank.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                1. Chọn Màu sắc: <span className="text-gray-900 font-black normal-case">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {blank.colors.map((color: string) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-xl text-xs font-black transition-all ${
                      selectedColor === color 
                        ? 'border-gray-900 bg-gray-900 text-white shadow-md shadow-gray-900/10' 
                        : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHỌN KÍCH THƯỚC */}
          {blank.sizes && blank.sizes.length > 0 && (
            <div className="mb-8">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                2. Chọn Kích thước: <span className="text-gray-900 font-black normal-case">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {blank.sizes.map((size: string) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl text-xs font-black transition-all ${
                      selectedSize === size 
                        ? 'border-[#C29017] bg-[#C29017]/5 text-[#C29017]' 
                        : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* THÔNG BÁO OUT OF STOCK */}
          {isVariantOutOfStock && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-pulse">
              <span>Phân loại (Màu: {selectedColor} - Size: {selectedSize}) hiện đã hết phôi tại xưởng. Vui lòng chọn phối hợp phân loại khác.</span>
            </div>
          )}

          {/* NÚT ĐIỀU HƯỚNG */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button 
              type="button"
              disabled={isVariantOutOfStock}
              onClick={() => router.push(`/dashboard/orders?action=manual_create&sku=${blank.sku}&size=${selectedSize}&color=${selectedColor}`)}
              className={`w-full font-black py-4 rounded-xl transition-all duration-200 text-sm flex justify-center items-center gap-2 ${
                isVariantOutOfStock 
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                  : 'bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-900/10 active:scale-[0.98]'
              }`}
            >
              {isVariantOutOfStock ? 'BIẾN THỂ NÀY HIỆN ĐANG HẾT HÀNG' : 'LÊN ĐƠN MẪU THAM KHẢO VỚI PHÂN LOẠI NÀY'}
            </button>
          </div>
        </div>
      </div>

      {/* MÔ TẢ CHI TIẾT */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">
          Mô tả thông số chi tiết phôi sản phẩm
        </h3>
        
        {blank.description ? (
          <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {blank.description}
          </div>
        ) : (
          <div className="text-gray-400 text-xs italic py-4 bg-gray-50/50 rounded-xl text-center border border-dashed border-gray-200">
            Sản phẩm này hiện chưa được cập nhật thông số mô tả từ nhà cung cấp.
          </div>
        )}
      </div>
    </div>
  );
}