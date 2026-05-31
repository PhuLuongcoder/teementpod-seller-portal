// teemochi-seller-portal/src/app/dashboard/catalog/page.tsx
'use client';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/axios';
import { useShop } from '@/context/ShopContext';

type PodBlank = {
  id: string;
  sku: string;
  name: string;
  category?: string; // Bổ sung trường này
  material: string;
  image_url: string;
  display_price: number;
  in_stock: boolean;
  starting_price: number | null;
};

export default function CatalogPage() {
  const { selectedShopId } = useShop();
  const [blanks, setBlanks] = useState<PodBlank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // STATE BỘ LỌC VÀ TÌM KIẾM
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name_asc'>('newest');

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!selectedShopId) return;
      setLoading(true);
      try {
        const response = await api.get('/partner/pod-blanks');
        setBlanks(response.data.catalog || []);
      } catch (err: any) {
        setError('Không thể tải danh mục phôi.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [selectedShopId]);

  // Lấy ra danh sách các Category (Loại bỏ trùng lặp)
  const categories = useMemo(() => {
    const rawCategories = blanks.map(b => b.category || 'Khác');
    return ['all', ...Array.from(new Set(rawCategories))];
  }, [blanks]);

  // Logic Xử lý Lọc và Sắp xếp Client-side
  const processedBlanks = useMemo(() => {
    let result = [...blanks];

    // 1. Lọc theo Category
    if (activeCategory !== 'all') {
      result = result.filter(b => (b.category || 'Khác') === activeCategory);
    }

    // 2. Lọc theo Search (Tên hoặc SKU)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q)
      );
    }

    // 3. Sắp xếp
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.display_price - b.display_price;
      if (sortBy === 'price_desc') return b.display_price - a.display_price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0; // newest (giữ nguyên thứ tự từ API trả về)
    });

    return result;
  }, [blanks, activeCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER TỔNG QUAN */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-[#C29017]/20">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Danh mục Phôi sản phẩm (Base Catalog)</h2>
          <p className="text-sm text-gray-500 mt-1">Khám phá và tra cứu giá gốc (Base Cost) các mẫu phôi chuẩn từ xưởng.</p>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS (DANH MỤC) & BỘ LỌC TÌM KIẾM */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        
        {/* Hàng 1: Tabs Danh Mục */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-50">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {cat === 'all' ? 'Tất cả Phôi' : cat}
            </button>
          ))}
        </div>

        {/* Hàng 2: Thanh Tìm kiếm & Sắp xếp */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm theo mã SKU hoặc tên phôi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C29017] focus:ring-1 focus:ring-[#C29017] text-sm transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase hidden md:block">Sắp xếp:</span>
            <select 
              value={sortBy} 
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 font-medium"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="name_asc">Tên: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* TRẠNG THÁI HIỂN THỊ */}
      {loading && <p className="text-gray-500 animate-pulse font-medium text-center py-8">Đang đồng bộ dữ liệu từ kho xưởng...</p>}
      {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg font-medium">{error}</p>}

      {/* LƯỚI SẢN PHẨM */}
      {!loading && !error && (
        <>
          {processedBlanks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy kết quả</h3>
              <p className="text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác xem sao.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processedBlanks.map((blank) => (
                <div key={blank.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 group flex flex-col">
                  {/* IMAGE BOX */}
                  <div className="h-56 bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                    <img 
                      src={blank.image_url || 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image'} 
                      alt={blank.name} 
                      className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-500 ${blank.in_stock ? 'group-hover:scale-110' : 'opacity-40 grayscale'}`} 
                    />
                    {/* STOCK BADGE */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {blank.in_stock ? (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm tracking-wide">IN STOCK</span>
                      ) : (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm tracking-wide animate-pulse">OUT OF STOCK</span>
                      )}
                    </div>
                  </div>
                  
                  {/* CONTENT BOX */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex flex-col mb-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-max mb-2">{blank.category || 'Khác'}</span>
                      <h3 className="font-extrabold text-gray-900 text-lg leading-tight line-clamp-2" title={blank.name}>{blank.name}</h3>
                      <span className="text-xs font-bold text-gray-400 mt-1">SKU: {blank.sku}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Base Cost (Từ)</span>
                        <span className="font-black text-2xl text-[#C29017]">
                          ${blank.display_price?.toFixed(2)}
                        </span>
                      </div>
                      <Link 
                        href={`/dashboard/catalog/${blank.id}`} 
                        className="w-max mx-auto block text-center bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md active:scale-95"
                      >
                        Lên đơn →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}