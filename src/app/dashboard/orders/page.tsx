'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import Papa from 'papaparse';
import api from '@/lib/axios';
import { useShop } from '@/context/ShopContext';
import { SquareTwoStack } from "@medusajs/icons"
import { useConfirm } from '@/context/ConfirmContext';

// Helper kiểm tra URL hợp lệ khắt khe để tránh lỗi 404 relative path
const isValidImageUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith('http')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Giao diện Search + Dropdownbox
interface SearchableDropdownProps {
  value: string;
  options: any[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SearchableDropdown = ({ value, options, onChange, disabled, placeholder }: SearchableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => {
    const name = (opt.name || '').toLowerCase();
    const sku  = (opt.sku  || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  const handleSelect = (name: string) => {
    onChange(name);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 flex items-center gap-2 h-9 px-2.5 border rounded-lg transition-all
            ${disabled
              ? 'bg-gray-100 opacity-60 pointer-events-none border-gray-200'
              : 'bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={searchTerm}
            placeholder={value ? `Đang chọn: ${value}` : (placeholder || 'Nhập tên phôi hoặc SKU...')}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
            className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
          />
          {searchTerm && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {value && (
          <div className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-500 shrink-0 max-w-[160px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="truncate">{value}</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[999] w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {searchTerm
              ? `${filteredOptions.length} kết quả cho "${searchTerm}"`
              : 'Tất cả sản phẩm'}
          </div>
          <div className="overflow-y-auto max-h-52 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: any) => (
                <div
                  key={opt.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.name); }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors
                    ${value === opt.name
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <div>
                    <div className="text-sm font-medium leading-tight">{opt.name}</div>
                    {opt.sku && (
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{opt.sku}</div>
                    )}
                  </div>
                  {value === opt.name && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-xs text-gray-400 italic">
                Không tìm thấy phôi phù hợp.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
interface SkuComboboxProps {
  value: string;
  options: any[];
  disabled?: boolean;
  onChange?: (newSku: string) => void;
  onBlur?: (newSku: string) => void;
  onSelect: (design: any) => void;
}

const SkuCombobox = ({ value, options, disabled, onChange, onBlur, onSelect }: SkuComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    (opt.sku || '').toLowerCase().includes((localValue || '').toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        disabled={disabled}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value); 
          setIsOpen(true);
          if (onChange) onChange(e.target.value); // Cập nhật tức thời cho Popup
        }}
        onBlur={() => {
          if (onBlur && localValue !== value) {
            onBlur(localValue); // Chỉ gọi lưu API khi gõ xong cho Inline
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
            setIsOpen(false);
          }
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Nhập mã mới hoặc tìm SKU có sẵn..."
        className="w-full border p-1.5 px-3 rounded-lg text-xs bg-gray-50 outline-none focus:border-[#C29017] disabled:bg-gray-100 transition-colors"
      />
      
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div className="absolute z-[999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <div
              key={opt.id}
              onMouseDown={(e) => {
                e.preventDefault(); 
                onSelect(opt);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
            >
              <div className="font-bold text-gray-800">{opt.sku}</div>
              {(opt.design_front_url || opt.design_back_url) && (
                <div className="text-[9px] text-gray-400 mt-0.5 truncate">
                  Đã có dữ liệu in {opt.extra_print_areas?.length > 0 ? `+ ${opt.extra_print_areas.length} vùng phụ` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function OrdersPage() {
  const { confirm, notify } = useConfirm();
  const { selectedShopId } = useShop();
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');

  // ==========================================
  // 1. STATE QUẢN LÝ
  // ==========================================
  const [sellerDesigns, setSellerDesigns] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [importOrders, setImportOrders] = useState<any[]>([]);
  const [podBlanks, setPodBlanks] = useState<any[]>([]);
  
  const isOrderStrictlyValid = (order: any) => {
    // 1. Phân tích an toàn danh sách items
    let items: any[] = [];
    try {
      if (Array.isArray(order.items) && order.items.length > 0) {
        items = order.items;
      } else if (order.product_detail) {
        const pd = typeof order.product_detail === 'string' ? JSON.parse(order.product_detail) : order.product_detail;
        if (Array.isArray(pd)) items = pd;
        else if (pd && Array.isArray(pd.items)) items = pd.items;
        else items = [pd];
      }
    } catch (e) {}

    if (items.length === 0) return false;

    let calculatedPrice = 0;

    const itemsValid = items.every((it: any) => {
      // ĐIỀU KIỆN 1: Phải có Type, Color, Size
      if (!it.type || !it.color || !it.size) return false;
      
      // ĐIỀU KIỆN 2: Bắt buộc phải có ít nhất 1 link thiết kế (Mặt trước hoặc mặt sau)
      const hasFront = !!(it.design_front && it.design_front.trim());
      const hasBack = !!(it.design_back && it.design_back.trim());
      const hasMockup = !!(it.mockup && it.mockup.trim());
      if (!hasFront && !hasBack && !hasMockup) return false;

      const blank = podBlanks.find(b => b.name === it.type);
      if (!blank) return false;
      const priceToUse = Number(blank.display_price || blank.price || blank.base_price || 0);
      if (priceToUse > 0) {
        calculatedPrice += (priceToUse * (it.quantity || 1));
      }

      // ĐIỀU KIỆN 4: Size phải khớp với bảng Size của Phôi
      let validSizes: string[] = [];

      if (Array.isArray(blank.sizes)) {
        validSizes = blank.sizes;
      } else if (typeof blank.sizes === 'string') {
        try {
          validSizes = JSON.parse(blank.sizes || '[]');
          if (!Array.isArray(validSizes)) validSizes = [];
        } catch (e) {
          validSizes = blank.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      const safeItemSize = (it.size || '').trim().toLowerCase();
      const sizeMatch = validSizes.some((s: string) => s.toLowerCase() === safeItemSize);
      
      if (!sizeMatch) return false;
      
      return true;
    });

    // ĐIỀU KIỆN TỐI THƯỢNG: Tổng giá trị đơn hàng phải LỚN HƠN $0
    const finalPrice = calculatedPrice >= 0 ? calculatedPrice : (order.order_price || 0);
    return itemsValid && finalPrice > 0;
  };

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingToPay, setIsAddingToPay] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const getStandardColor = (colorName?: string) => {
    if (!colorName) return '#f9fafb';
    const name = colorName.toLowerCase().trim();
    const colorMap: Record<string, string> = {
      'sport grey': '#d1d5db', 'dark heather': '#374151', 'heather navy': '#312e81',
      'light pink': '#fbcfe8', 'light blue': '#bfdbfe', 'navy': '#1e3a8a',
      'royal': '#1d4ed8', 'maroon': '#7f1d1d', 'forest green': '#064e3b',
      'charcoal': '#3f3f46', 'sand': '#e5e5cb', 'ash': '#e2e8f0',
      'irish green': '#16a34a', 'carolina blue': '#7dd3fc', 'heliconia': '#d946ef',
      'sapphire': '#0284c7', 'kelly green': '#22c55e', 'daisy': '#fde047',
      'mineral black': '#363636', 'mineral navy': '#2c3e50', 'mineral silver': '#b0b3b8', 
      'mineral gray': '#696969', 'mineral purple': '#6d5b7b'
    };
    return colorMap[name] || colorName;
  };

  const [importCurrentPage, setImportCurrentPage] = useState(1);
  // === STATE CHO CHỨC NĂNG LÊN ĐƠN LẺ ===
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const IMPORT_PAGE_SIZE = 20;
  const [isExporting, setIsExporting] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSource, setEditSource] = useState<'db' | 'import'>('import');
  const [editForm, setEditForm] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  // const [specialPrintsForm, setSpecialPrintsForm] = useState<{name: string, url: string}[]>([]);
  // const [mockupsForm, setMockupsForm] = useState<{name: string, url: string}[]>([]);
  
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportType, setSupportType] = useState<'resent' | 'refund'>('resent');
  const [supportReason, setSupportReason] = useState('');
  const [supportImage, setSupportImage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [isSyncingSKU, setIsSyncingSKU] = useState<number | null>(null);

  // ==========================================
  // 2. LOGIC DỮ LIỆU & BỘ LỌC
  // ==========================================
  useEffect(() => {
    setSelectedRows([]);
  }, [activeTab]);
  
  useEffect(() => {
    const fetchPodBlanks = async () => {
      try {
        const res = await api.get('/partner/pod-blanks');
        const fetchedData = res.data?.catalog || res.data?.pod_blanks || res.data?.podBlanks || res.data?.data;
        setPodBlanks(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (error) {
        console.error("Lỗi lấy danh sách Phôi:", error);
        setPodBlanks([]); 
      }
    };
    if (selectedShopId) fetchPodBlanks();
  }, [selectedShopId]);

  const fetchDesigns = useCallback(async () => {
    if (!selectedShopId) return;
    try {
      const res = await api.get('/partner/designs', { 
        params: { shop_id: selectedShopId, limit: 2000 } 
      });
      setSellerDesigns(res.data.designs || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách Design:", error);
    }
  }, [selectedShopId]);

  // 2. Chạy hàm lấy dữ liệu khi màn hình vừa load
  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  // 3. THÊM MỚI: Hàm bắn dữ liệu thẳng vào API thư viện
  const handleUpdateSKULibrary = async (item: any) => {
    if (!item.sku || !item.sku.trim()) {
      alert("Vui lòng nhập mã SKU trước khi lưu vào thư viện!");
      return;
    }
    try {
      await api.post('/partner/designs', {
        sku: item.sku,
        design_front_url: item.design_front,
        design_back_url: item.design_back,
        mockup_url: item.mockup,
        extra_print_areas: item.extra_print_areas,
        shop_id: selectedShopId
      });
      notify(`Đã đồng bộ thiết kế cho SKU: ${item.sku} vào thư viện!`);
      
      // Load lại dữ liệu ngay lập tức để Dropdown cập nhật mẫu mới
      fetchDesigns(); 
    } catch (error: any) {
      alert(error.response?.data?.error || "Đã xảy ra lỗi khi lưu vào thư viện.");
    }
  };

  const handleBulkDeleteImport = async () => {
    const isConfirmed = await confirm({
      title: "Xóa danh sách Import",
      message: `Bạn chắc chắn muốn xóa ${selectedRows.length} đơn hàng khỏi danh sách chờ tải lên?`,
      confirmText: "Xóa danh sách",
      isDanger: true
    });
    if(!isConfirmed) return;
    const selectedIndices = new Set(selectedRows.map(Number));
    const remaining = importOrders.filter((_, idx) => !selectedIndices.has(idx));
    setImportOrders(remaining);
    setSelectedRows([]);
    const newTotalPages = Math.max(1, Math.ceil(remaining.length / IMPORT_PAGE_SIZE));
    setImportCurrentPage(prev => Math.min(prev, newTotalPages));
  };
  // === HÀM XỬ LÝ LÊN ĐƠN LẺ ===
  const handleOpenCreateModal = () => {
    setCreateForm({
      customer_name: '', customer_email: '', customer_phone: '',
      shipping_address: { line_1: '', line_2: '', city: '', region: '', zip: '', country: 'US' },
      items: [{ type: '', color: '', size: '', quantity: 1, sku: '', design_front: '', design_back: '', mockup: '', note: '', extra_print_areas: [] }],
      order_note: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return alert("Vui lòng chọn Shop!");

    // 1. Validate các trường bắt buộc
    if (!createForm.customer_name.trim()) return alert("Vui lòng nhập Tên khách hàng!");
    const addr = createForm.shipping_address;
    if (!addr.line_1 || !addr.city || !addr.region || !addr.zip || !addr.country) {
      return alert("Vui lòng nhập đầy đủ: Địa chỉ 1, Thành phố, Bang/Vùng, Zipcode và Quốc gia!");
    }

    const items = createForm.items;
    if (!items || items.length === 0) return alert("Phải có ít nhất 1 sản phẩm!");

    let tempOrderPrice = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.type) return alert(`Sản phẩm #${i + 1}: Vui lòng chọn Loại sản phẩm (Phôi)!`);
      if (!it.quantity || it.quantity < 1) return alert(`Sản phẩm #${i + 1}: Số lượng phải lớn hơn 0!`);
      // Ghi chú: Color và Size được phép bỏ trống theo yêu cầu.

      const blank = podBlanks.find(b => b.name === it.type);
      if (blank && blank.display_price) {
        tempOrderPrice += blank.display_price * (it.quantity || 1);
      }
    }

    setIsSubmittingCreate(true);
    try {
      const product_type = items.length > 1 ? `${items[0].type} (+${items.length - 1} món khác)` : items[0].type;
      
      const payload = {
        external_order_id: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customer_name: createForm.customer_name.trim(),
        customer_email: createForm.customer_email.trim(),
        customer_phone: createForm.customer_phone.trim(),
        shipping_address: createForm.shipping_address,
        order_note: createForm.order_note,
        product_type: product_type,
        order_price: tempOrderPrice,
        product_detail: JSON.stringify(items),
        items: items,
        status: 'pending' // Đơn mới luôn vào trạng thái Chờ thanh toán
      };

      await api.post('/partner/orders', {
        orders: [payload],
        target_shop_id: selectedShopId
      });

      notify("Tạo đơn hàng lẻ thành công!");
      setIsCreateModalOpen(false);
      if (activeTab !== 'list') setActiveTab('list');
      fetchOrdersFromDB();
    } catch (error: any) {
      alert(error.response?.data?.error || "Đã xảy ra lỗi khi tạo đơn hàng.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };
  const handleConfirmSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReason) return alert("Vui lòng nhập lý do khiếu nại.");
    
    setIsSubmittingSupport(true);
    try {
      await api.post('/partner/orders/support', {
        order_ids: selectedRows,
        type: supportType,
        reason: supportReason,
        proof_image: supportImage || "https://placehold.co/150?text=No+Image"
      });
      
      notify("Đã chuyển các đơn hàng chọn sang trạng thái Hỗ trợ xử lý.");
      setIsSupportModalOpen(false);
      setSupportReason('');
      setSupportImage('');
      setSelectedRows([]);
      fetchOrdersFromDB();
    } catch (error: any) {
      alert(error.response?.data?.error || "Gặp sự cố khi gửi yêu cầu.");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`Đã sao chép: ${text}`); 
    } catch (err) {
      console.error('Lỗi khi sao chép: ', err);
    }
  };

  const handleBulkActionDB = async (action: 'cancel' | 'archive') => {
    const invalidOrders = selectedRows.filter(id => {
      const order = dbOrders.find(o => o.id === id);
      return order && ['processing', 'in_transit', 'done', 'cancelled'].includes(order.status);
    });

    if (invalidOrders.length > 0) {
      notify("Lỗi: Có đơn hàng đã được Admin duyệt (processing) hoặc đang giao. Không thể hủy để tránh sai lệch công nợ!");
      return;
    }

    const isConfirmed = await confirm({
      title: "Xác nhận hủy đơn hàng",
      message: `Bạn có chắc muốn hủy ${selectedRows.length} đơn hàng đã chọn? Đơn bị hủy sẽ được giữ lại trong lịch sử để đối soát nhưng KHÔNG THỂ chỉnh sửa. Nếu muốn thay đổi, bạn phải lên đơn mới.`,
      confirmText: "Đồng ý Hủy",
      isDanger: true
    });
    
    if(!isConfirmed) return;
    try {
      await api.post('/partner/orders/bulk', { ids: selectedRows, action });
      notify(`Đã hủy thành công!`); 
      setSelectedRows([]);
      fetchOrdersFromDB();
    } catch (error) {
      notify(`Lỗi xử lý hàng loạt. Vui lòng thử lại.`);
    }
  };

  const handlePayOrders = async () => {
    if (selectedRows.length === 0) return;

    const selectedOrderDetails = dbOrders.filter(order => selectedRows.includes(order.id));
    const validOrders = selectedOrderDetails.filter((order: any) => isOrderStrictlyValid(order));
    const invalidCount = selectedRows.length - validOrders.length;

    if (validOrders.length === 0) {
      await confirm({
        title: "Không có đơn hàng hợp lệ",
        message: (
          <div className="flex flex-col gap-3 text-sm text-gray-700 mt-2">
            <p className="font-bold text-gray-900 text-base">Tất cả các đơn bạn vừa tick chọn đều bị lỗi thiếu thông tin!</p>
            <p className="font-medium">Vui lòng kiểm tra và đảm bảo các đơn này đã được:</p>
            <ul className="list-disc pl-5 space-y-1 font-bold text-red-600">
              <li>Cài đặt Phôi / Màu / Size</li>
              <li>Dán Link thiết kế</li>
            </ul>
          </div>
        ),
        confirmText: "Tôi sẽ kiểm tra lại",
      });
      return;
    }

    let confirmMessage = `Tiến hành thanh toán chi phí sản xuất cho ${validOrders.length} đơn hàng hợp lệ?`;
    if (invalidCount > 0) {
      confirmMessage += `\n\n(Hệ thống sẽ tự động bỏ qua ${invalidCount} đơn bị thiếu thông tin Phôi/Màu/Size mà bạn đã chọn)`;
    }

    const isConfirmed = await confirm({
      title: "Thanh toán đơn hàng",
      message: confirmMessage,
      confirmText: "Thanh toán ngay",
    });

    if (!isConfirmed) return;
    setIsAddingToPay(true);
    try {
      const validIds = validOrders.map(o => o.id);
      const res = await api.post('/partner/orders/pay', { order_ids: validIds });
      
      notify(res.data?.message || "Đã xử lý thanh toán đơn hàng thành công!");
      window.dispatchEvent(new Event('refresh_total_spend'));
      setSelectedRows([]);
      fetchOrdersFromDB();
    } catch (error: any) {
      alert(error.response?.data?.error || "Gặp sự cố trong quá trình xử lý thanh toán.");
    } finally {
      setIsAddingToPay(false);
    }
  };

  const handlePayAllPendingOrders = async () => {
    const isConfirmed = await confirm({
      title: "Thanh toán toàn bộ đơn",
      message: "Tiến hành thanh toán chi phí sản xuất cho TẤT CẢ đơn hàng hợp lệ (đã cài đặt phôi) đang chờ thanh toán?",
      confirmText: "Thanh toán tất cả",
    });

    if (!isConfirmed) return;
    setIsAddingToPay(true);
    try {
      const res = await api.get('/partner/orders/export', { 
        params: { shop_id: selectedShopId, status: 'pending' } 
      });
      const pendingOrders = res.data.orders || [];
      
      if (pendingOrders.length === 0) {
        notify("Không có đơn hàng nào đang chờ thanh toán.");
        setIsAddingToPay(false);
        return;
      }

      const validPendingOrders = pendingOrders.filter((order: any) => isOrderStrictlyValid(order));
      const invalidCount = pendingOrders.length - validPendingOrders.length;

      if (validPendingOrders.length === 0) {
        await confirm({
          title: "Giao dịch bị tạm dừng",
          message: (
            <div className="flex flex-col gap-3 text-sm text-gray-700 mt-2">
              <p className="font-medium leading-relaxed">
                Hệ thống ghi nhận có <span className="font-extrabold text-red-600 text-base">{invalidCount}</span> đơn đang chờ thanh toán, nhưng <span className="font-bold text-red-600 uppercase">Tất cả đều chưa điền đủ thông tin</span>.
              </p>
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl font-medium text-xs">
                Vui lòng điền đủ Phôi, Size và Link Design cho các đơn hàng này trước khi dùng tính năng thanh toán hàng loạt nhé!
              </div>
            </div>
          ),
          confirmText: "Tôi sẽ kiểm tra lại",
        });
        setIsAddingToPay(false);
        return;
      }

      if (invalidCount > 0) {
        notify(`Tiến hành thanh toán ${validPendingOrders.length} đơn hợp lệ. Đã tự động bỏ qua ${invalidCount} đơn chưa có thông tin phôi.`);
      }

      const validPendingIds = validPendingOrders.map((o: any) => o.id);
      const payRes = await api.post('/partner/orders/pay', { order_ids: validPendingIds });
      
      notify(payRes.data?.message || "Đã thanh toán thành công tất cả đơn hàng hợp lệ!");
      window.dispatchEvent(new Event('refresh_total_spend'));
      setSelectedRows([]);
      fetchOrdersFromDB();
    } catch (error: any) {
      alert(error.response?.data?.error || "Gặp sự cố trong quá trình xử lý thanh toán.");
    } finally {
      setIsAddingToPay(false);
    }
  };

  const convertGoogleDriveUrl = (url?: string): string => {
    if (!url) return '';
    const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (fileMatch?.[1]) {
      return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
    }
    const openMatch = url.match(/[?&]id=([^&]+)/);
    if (openMatch?.[1]) {
      return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w1000`;
    }
    return url;
  };

  const fetchOrdersFromDB = useCallback(async () => {
    if (!selectedShopId) return;
    setIsLoadingList(true);
    try {
      const params: any = { 
        shop_id: selectedShopId, 
        page: currentPage, 
        startDate, 
        endDate 
      };
      
      if (statusFilter === 'reship') {
        params.search = searchQuery ? `${searchQuery} RS-` : 'RS-';
      } else {
        if (searchQuery) params.search = searchQuery;
        if (statusFilter !== 'all') params.status = statusFilter;
      }

      const response = await api.get('/partner/orders', { params });
      setDbOrders(response.data?.orders || []);
      setTotalPages(response.data?.totalPages || 1);
      setTotalCount(response.data?.count || 0);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedShopId, currentPage, searchQuery, startDate, endDate, statusFilter]);

  useEffect(() => {
    if (activeTab === 'list' && selectedShopId) fetchOrdersFromDB();
  }, [fetchOrdersFromDB, activeTab, selectedShopId]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };
  
  const handleExportCSV = async () => {
    if (!selectedShopId) return;
    setIsExporting(true);
    try {
      // >>> THÊM limit: 999999 để tải toàn bộ đơn hàng thỏa mãn bộ lọc, vượt rào phân trang 10 đơn
      const params: any = { 
        shop_id: selectedShopId,
        limit: 999999 
      };
      
      if (statusFilter === 'reship') {
        params.search = searchQuery ? `${searchQuery} RS-` : 'RS-';
      } else {
        if (statusFilter !== 'all') params.status = statusFilter;
        if (searchQuery) params.search = searchQuery;
      }
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/partner/orders/export', { params });
      const ordersToExport = response.data.orders || [];

      if (ordersToExport.length === 0) {
        alert("Không tìm thấy đơn hàng nào trong khoảng bộ lọc này để xuất file!");
        return;
      }

      const headers = [
        "Order ID", "Date", "Name", "Address line 1", "Address line 2", 
        "City", "Region", "Zip", "Country", 
        "Type", "Color", "Size", "Quantity", "SKU",
        "Print area front", "Print area back", "Mockup Front", "Extra Print Areas", "Tracking", "Status", "Total Price"
      ];
      
      const csvRows: string[] = [];

      ordersToExport.forEach((order: any) => {
        const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
        
        let addr: any = {};
        if (typeof order.shipping_address === 'string') {
           try { addr = JSON.parse(order.shipping_address); } catch(e){}
        } else if (order.shipping_address) {
           addr = order.shipping_address.raw || order.shipping_address;
        }
        
        const addr1 = addr.line_1 || addr.address_1 || '';
        const addr2 = addr.line_2 || addr.address_2 || '';
        const city = addr.city || '';
        const region = addr.region || addr.province || addr.state || '';
        const zip = addr.zip || addr.postal_code || '';
        const country = addr.country || addr.country_code || 'US';

        const statusText = 
          order.status === 'pending' ? 'Chờ thanh toán' :
          order.status === 'complete' ? 'Đã thanh toán' :
          order.status === 'processing' ? 'Đang sản xuất' :
          order.status === 'in_transit' ? 'Đang giao' :
          order.status === 'done' ? 'Hoàn thành' :
          order.status === 'cancelled' ? 'Đã hủy' : order.status || '---';

        let items: any[] = [];
        try {
          if (Array.isArray(order.items) && order.items.length > 0) {
            items = order.items;
          } else if (order.product_detail) {
            const pd = typeof order.product_detail === 'string' ? JSON.parse(order.product_detail) : order.product_detail;
            if (Array.isArray(pd)) items = pd;
            else if (pd && Array.isArray(pd.items)) items = pd.items;
            else items = [pd];
          }
        } catch (e) {}
        if (items.length === 0) {
          items = [{
            type: order.product_type || "", color: "", size: "", quantity: 1, sku: "",
            design_front: order.design_front_url || "", design_back: order.design_back_url || "", mockup: "", extra_print_areas: []
          }];
        }
        items.forEach(item => {
          const extraPrintStr = (item.extra_print_areas || [])
            .filter((a: any) => a.name || a.url)
            .map((a: any) => `${a.name}: ${a.url}`)
            .join(" | ");

          const row = [
            `"${(order.external_order_id || '').replace(/"/g, '""')}"`,
            `"${orderDate}"`,
            `"${(order.customer_name || '').replace(/"/g, '""')}"`,
            `"${addr1.replace(/"/g, '""')}"`,
            `"${addr2.replace(/"/g, '""')}"`,
            `"${city.replace(/"/g, '""')}"`,
            `"${region.replace(/"/g, '""')}"`,
            `="${zip}"`, 
            `"${country.replace(/"/g, '""')}"`,
            `"${(item.type || order.product_type || '').replace(/"/g, '""')}"`,
            `"${(item.color || '').replace(/"/g, '""')}"`,
            `"${(item.size || '').replace(/"/g, '""')}"`,
            item.quantity || 1,
            `"${(item.sku || '').replace(/"/g, '""')}"`,
            `"${(item.design_front || '').replace(/"/g, '""')}"`,
            `"${(item.design_back || '').replace(/"/g, '""')}"`,
            `"${(item.mockup || '').replace(/"/g, '""')}"`,
            `"${extraPrintStr.replace(/"/g, '""')}"`,
            
            // >>> XỬ LÝ TRACKING: Đổ mã tracking, nếu null hoặc undefined thì sẽ là khoảng trắng rỗng ""
            `"${(order.tracking_number || '').replace(/"/g, '""')}"`,
            
            `"${statusText}"`,
            `"${order.order_price || 0}"`
          ];
          csvRows.push(row.join(","));
        });
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_export_${selectedShopId}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi xuất CSV đơn hàng:", error);
      alert("Hệ thống gặp sự cố trong quá trình kết xuất dữ liệu file CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const sanitizeText = (text: string | number | null | undefined) => {
    if (!text) return '';
    return text
      .toString()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedShopId) return;
    
    setMessage('Đang phân tích định dạng và gộp các đơn hàng...');
    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: (results) => {
        const ordersMap = new Map();
        const parsedData = results.data as any[];
        const isEtsyFormat = parsedData.length > 0 && parsedData[0].hasOwnProperty('Ship Name');

        // Hàm hỗ trợ tìm kiếm cột thông minh (bỏ qua khoảng trắng, xuống dòng, viết hoa/thường)
        const findValue = (row: any, targetKeys: string[]) => {
          const keys = Object.keys(row);
          for (const target of targetKeys) {
            const cleanTarget = target.toLowerCase().replace(/[\n\r\s]+/g, '');
            const foundKey = keys.find(k => k.toLowerCase().replace(/[\n\r\s]+/g, '').includes(cleanTarget));
            if (foundKey) return row[foundKey];
          }
          return '';
        };

        parsedData.forEach((row: any) => {
          // Bắt thông minh Order ID
          const orderId = sanitizeText(findValue(row, ['Order ID', 'OrderID']));
          if (!orderId) return;

          // Bắt Date
          const rawDate = findValue(row, ['Date', 'Order Date', 'Sale Date']);
          let parsedDate = null;
          if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) parsedDate = d.toISOString();
          }

          let rawType = '', rawColor = '', rawSize = '', rawQuantity = 1, rawSku = '';
          let name = '', line1 = '', line2 = '', city = '', region = '', zip = '', country = 'US';
          let designFront = '', designBack = '', mockup = '', note = '';
          let tracking = '';
          let originalString = '';

          if (isEtsyFormat) {
            // === LUỒNG ETSY GIỮ NGUYÊN ===
            name = row['Ship Name']?.trim() || '';
            line1 = row['Ship Address1']?.trim() || '';
            line2 = row['Ship Address2']?.trim() || '';
            city = row['Ship City']?.trim() || '';
            region = row['Ship State']?.trim() || '';
            zip = row['Ship Zipcode']?.trim() || '';
            country = row['Ship Country']?.trim() || 'US';
            
            rawQuantity = parseInt(row['Quantity']) || 1;
            rawSku = row['SKU'] || '';
            tracking = row['Tracking']?.trim() || '';

            const buyerEmail = row['Buyer Email'] || row['Email'] || '';
            const variations = row['Variations'] || '';
            const varParts = variations.split(',');
            
            varParts.forEach((part: string) => {
              const cleanPart = part.replace(/"/g, '').trim();
              const lowerPart = cleanPart.toLowerCase();
              
              if (lowerPart.includes('size') || lowerPart.includes('type') || lowerPart.includes('style')) {
                let tempSize = cleanPart.split(':')[1]?.trim() || '';
                if (tempSize.includes('-')) {
                  tempSize = tempSize.split('-').pop()?.trim() || tempSize;
                } else if (tempSize.includes(' ')) {
                  tempSize = tempSize.split(' ').pop()?.trim() || tempSize;
                }
                
                if (tempSize) {
                  const finalSize = tempSize.toUpperCase();
                  rawSize = finalSize;
                }
              }
              
              if (lowerPart.includes('color') || lowerPart.includes('colour')) {
                const tempColor = cleanPart.split(':')[1]?.trim();
                if (tempColor) rawColor = tempColor;
              }
            });
            
            rawType = ''; 
            designFront = ''; designBack = ''; mockup = '';
            
            let itemName = row['Item Name'] || '';
            itemName = itemName.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            const shortItemName = itemName.split(',')[0].trim();
            
            let cleanVariations = variations.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            originalString = cleanVariations ? cleanVariations.trim() : shortItemName;
            
          } else {
            // === LUỒNG NORMAL (CẢI TIẾN) ===
            name = findValue(row, ['Name'])?.trim() || '';
            line1 = findValue(row, ['Address line 1'])?.trim() || '';
            line2 = findValue(row, ['Address line 2'])?.trim() || '';
            city = findValue(row, ['City'])?.trim() || '';
            region = findValue(row, ['Region', 'State', 'Province'])?.trim() || '';
            zip = findValue(row, ['Zip'])?.trim() || '';
            country = findValue(row, ['Country'])?.trim() || 'US';
            
            // Bắt cột Type có chứa text lạ hoặc xuống dòng
            rawType = findValue(row, ['Type(ĐiềnĐúng', 'Type']); 
            rawColor = findValue(row, ['Color']);
            rawSize = findValue(row, ['Size']);
            rawQuantity = parseInt(findValue(row, ['Quantity'])) || 1;
            rawSku = findValue(row, ['SKU', 'Design SKU']);
            
            // Bắt cột Track có khoảng trắng
            tracking = findValue(row, ['Track', 'Tracking']);
            // Bắt cả cột Note nếu có
            note = findValue(row, ['Note'])?.trim() || '';
            
            designFront = findValue(row, ['Print area front'])?.trim() || '';
            designBack = findValue(row, ['Print area back'])?.trim() || '';
            mockup = findValue(row, ['Mockup Front', 'Mockup'])?.trim() || '';
            
            const fullType = findValue(row, ['Full Type']);
            originalString = fullType 
              ? `Hệ thống: ${fullType}` 
              : `Loại: ${rawType}, Màu: ${rawColor}, Size: ${rawSize}`;
          }
          
          const newItem = {
            sku: sanitizeText(rawSku),
            type: sanitizeText(rawType),  
            color: sanitizeText(rawColor), 
            size: sanitizeText(rawSize),
            quantity: rawQuantity,
            design_front: designFront,
            design_back: designBack,
            mockup: mockup,
            note: note, 
            extra_print_areas: [],
            original_string: originalString
          };

          if (ordersMap.has(orderId)) {
            const existingOrder = ordersMap.get(orderId);
            existingOrder.items.push(newItem);
          } else {
            ordersMap.set(orderId, {
              external_order_id: orderId,
              tracking_number: sanitizeText(tracking),
              order_date: parsedDate,
              customer_name: sanitizeText(name),
              customer_email: sanitizeText(buyerEmail), customer_phone: '',
              shipping_address: {
                line_1: line1, line_2: line2, city: city, region: region, zip: zip, country: country
              },
              items: [newItem],
              product_type: sanitizeText(rawType), 
              order_price: 0, 
              order_note: '', 
              status: 'pending'
            });
          }
        });

        const finalOrders = Array.from(ordersMap.values()).map((order: any) => {
          let tempPrice = 0;
          if (order.items) {
            order.items.forEach((it: any) => {
              const blank = podBlanks.find(b => b.name === it.type);
              if (blank && blank.display_price) {
                tempPrice += blank.display_price * (it.quantity || 1);
              }
            });
          }
          
          return {
            ...order,
            order_price: tempPrice,
            product_type: order.items && order.items.length > 1 
              ? `${order.items[0].type} (+${order.items.length - 1} món khác)` 
              : (order.items?.[0]?.type || '')
          };
        });

        setImportOrders(finalOrders);
        setImportCurrentPage(1);
        setMessage(`Đã chuẩn bị ${finalOrders.length} đơn hàng từ file CSV (đã gộp các đơn trùng ID).`);
      }
    });
    event.target.value = '';
  };

  const handleSyncSKU = async (itemIndex: number, sku: string) => {
    if (!sku.trim() || !selectedShopId) return;
    setIsSyncingSKU(itemIndex);
    
    try {
      const res = await api.get('/partner/designs', {
        params: { shop_id: selectedShopId, search: sku.trim() }
      });
      
      const designs = res.data.designs || [];
      const exactMatch = designs.find((d: any) => d.sku.toLowerCase() === sku.trim().toLowerCase());

      if (exactMatch) {
        const newItems = [...editForm.items];
        const libraryExtraAreas = exactMatch.extra_print_areas || [];

        newItems[itemIndex] = {
          ...newItems[itemIndex],
          design_front: exactMatch.design_front_url || newItems[itemIndex].design_front,
          design_back: exactMatch.design_back_url || newItems[itemIndex].design_back,
          mockup: exactMatch.mockup_url || newItems[itemIndex].mockup,
          extra_print_areas: libraryExtraAreas.length > 0 ? libraryExtraAreas : newItems[itemIndex].extra_print_areas
        };
        setEditForm({ ...editForm, items: newItems });
        notify(`Đã đồng bộ thiết kế thành công cho SKU: ${sku}`);
      } else {
        alert(`Không tìm thấy mã SKU "${sku}" trong thư viện thiết kế của bạn. Vui lòng kiểm tra lại!`);
      }
    } catch (error) {
      alert('Xảy ra lỗi khi truy xuất thư viện thiết kế.');
    } finally {
      setIsSyncingSKU(null);
    }
  };

  // ==========================================
  // 3. HÀM HIỂN THỊ (RENDERER)
  // ==========================================

  const renderJsonObject = (data: any, type: 'address' | 'link' = 'address') => {
    if (!data) return '---';
    try {
      let obj = typeof data === 'string' ? JSON.parse(data) : data;
      if (typeof obj === 'string') return obj;

      if (type === 'address') {
        const targetObj = (obj.raw && typeof obj.raw === 'object') ? obj.raw : obj;
        if (obj.raw && typeof obj.raw === 'string') return obj.raw;
        const parts = [
          targetObj.line_1, targetObj.line_2, targetObj.city, 
          targetObj.region, targetObj.zip, targetObj.country
        ].filter(Boolean);

        if (parts.length > 0) return parts.join(', ');
        return JSON.stringify(targetObj);
      }
      return Object.entries(obj).map(([name, url]: any) => (
        <a key={name} href={typeof url === 'string' ? url : '#'} target="_blank" rel="noreferrer" className="block text-blue-500 hover:underline text-[10px]">
          🔗 {name}
        </a>
      ));

    } catch {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  };

  const openEditModal = (index: number, source: 'db' | 'import') => {
    setEditingIndex(index);
    setEditSource(source);
    const order = source === 'import' ? importOrders[index] : dbOrders[index];
    
    const isLocked = source === 'db' && !['pending', 'complete'].includes(order.status);
    setIsReadOnly(isLocked);

    const parseField = (f: any) => {
      try { return typeof f === 'string' ? JSON.parse(f) : (f || {}); } catch { return {}; }
    };

    let parsedAddress = parseField(order.shipping_address);
    if (parsedAddress.raw && typeof parsedAddress.raw === 'object') {
      parsedAddress = parsedAddress.raw;
    } else if (typeof parsedAddress === 'string') {
      parsedAddress = { line_1: parsedAddress };
    }

    const parseField2 = (f: any) => {
      try { return typeof f === 'string' ? JSON.parse(f) : (f ?? null); } catch { return null; }
    };
    let parsedProductDetail = parseField2(order.product_detail);
    
    let legacyExtraAreas: any[] = [];
    try {
      const parsedSp = typeof order.special_print_areas === 'string' 
        ? JSON.parse(order.special_print_areas) 
        : order.special_print_areas;
      if (parsedSp) {
        legacyExtraAreas = Object.entries(parsedSp).map(([n, u]) => ({ name: n, url: u as string }));
      }
    } catch { }

    // 2. Chèn tham số 'idx' vào normalizeItem để biết đang map item thứ mấy
    const normalizeItem = (item: any, idx: number) => ({
      sku: item.sku || '',
      type: item.type || '',
      color: item.color || '',
      size: item.size || '',
      quantity: item.quantity || 1,
      design_front: item.design_front || '',
      design_back: item.design_back || '',
      mockup: item.mockup || '',
      note: item.note || '',
      
      // 3. LOGIC CỨU DỮ LIỆU: 
      // Ưu tiên dữ liệu chuẩn của item. Nếu item trống VÀ là item đầu tiên (idx === 0), 
      // thì đổ toàn bộ vùng in cũ của Order vào đây!
      extra_print_areas: (Array.isArray(item.extra_print_areas) && item.extra_print_areas.length > 0)
        ? item.extra_print_areas 
        : (idx === 0 ? legacyExtraAreas : []),
        
      original_string: item.original_string || '',
    });

    let itemsArray: any[] = [];

    if (source === 'import') {
      // Nhớ truyền thêm tham số index vào vòng lặp map nhé bác
      itemsArray = Array.isArray(order.items) ? order.items.map((it, i) => normalizeItem(it, i)) : [];
    } else {
      if (Array.isArray(order.items) && order.items.length > 0) {
        itemsArray = order.items.map((it, i) => normalizeItem(it, i));
      } else if (Array.isArray(parsedProductDetail)) {
        itemsArray = parsedProductDetail.map((it, i) => normalizeItem(it, i));
      } else if (parsedProductDetail && Array.isArray(parsedProductDetail.items)) {
        itemsArray = parsedProductDetail.items.map((it, i) => normalizeItem(it, i));
      } else {
        const pt = parsedProductDetail && typeof parsedProductDetail === 'object' ? parsedProductDetail : {};
        // Với trường hợp rơi vào đây, nó mặc định là item đầu tiên (idx = 0)
        itemsArray = [normalizeItem({
          sku: pt.sku || order.sku || '',
          type: pt.type || order.product_type || '',
          color: pt.color || '',
          size: pt.size || '',
          quantity: pt.quantity || 1,
          design_front: pt.design_front || order.design_front_url || '',
          design_back: pt.design_back || order.design_back_url || '',
          mockup: pt.mockup || '',
          extra_print_areas: [],
        }, 0)];
      }
    }

    const safeOrder = {
      ...order,
      shipping_address: parsedAddress,
      items: itemsArray,
    };
    
    setEditForm(safeOrder);

    // const parseToList = (f: any) => {
    //   try {
    //     const obj = typeof f === 'string' ? JSON.parse(f) : f;
    //     return obj ? Object.entries(obj).map(([n, u]) => ({ name: n, url: u as string })) : [];
    //   } catch { return []; }
    // };
    // setSpecialPrintsForm(parseToList(order.special_print_areas));
    // setMockupsForm(parseToList(order.mockup_urls));
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;

    const items = editForm.items || [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.type) {
        alert(`Sản phẩm #${i + 1}: Vui lòng chọn Loại sản phẩm (Phôi)!`);
        return;
      }
      const blank = podBlanks.find(b => b.name === it.type);
      if (!blank) {
        alert(`Sản phẩm #${i + 1}: Phôi "${it.type}" không tồn tại trên hệ thống.`);
        return;
      }

      const parseArraySafe = (data: any) => { 
        if (Array.isArray(data)) return data; 
        if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } } 
        return []; 
      };
      
      const validColors = parseArraySafe(blank.colors);
      const validSizes = parseArraySafe(blank.sizes);

      const isColorValid = validColors.some((c: string) => c.toLowerCase() === (it.color || '').trim().toLowerCase());
      if (!isColorValid) {
        alert(`Sản phẩm #${i + 1}: Màu "${it.color || 'Trống'}" không được hỗ trợ cho phôi "${it.type}". Vui lòng chọn màu khác!`);
        return;
      }

      const isSizeValid = validSizes.some((s: string) => s.toLowerCase() === (it.size || '').trim().toLowerCase());
      if (!isSizeValid) {
        alert(`Sản phẩm #${i + 1}: Size "${it.size || 'Trống'}" không được hỗ trợ cho phôi "${it.type}". Vui lòng chọn size khác!`);
        return;
      }

      if (blank.in_stock === false) {
        alert(`Sản phẩm #${i + 1}: Phôi "${it.type}" hiện đang HẾT HÀNG toàn bộ. Không thể lên đơn!`);
        return;
      }

      const oosVariants = parseArraySafe(blank.out_of_stock_variants); 
      if (oosVariants.length > 0) {
        const isVariantOos = oosVariants.some((v: any) => 
          (v.color || '').toLowerCase() === (it.color || '').trim().toLowerCase() && 
          (v.size || '').toLowerCase() === (it.size || '').trim().toLowerCase()
        );
        if (isVariantOos) {
          alert(`Sản phẩm #${i + 1}: Tổ hợp Phôi "${it.type}" - Màu "${it.color}" - Size "${it.size}" hiện đang HẾT HÀNG!`);
          return;
        }
      }

      it.color = validColors.find((c: string) => c.toLowerCase() === (it.color || '').trim().toLowerCase()) || it.color;
      it.size = validSizes.find((s: string) => s.toLowerCase() === (it.size || '').trim().toLowerCase()) || it.size;
    }

    // const spObj: any = {};
    // specialPrintsForm.forEach(i => { if (i.name.trim()) spObj[i.name.trim()] = i.url; });
    // const muObj: any = {};
    // mockupsForm.forEach(i => { if (i.name.trim()) muObj[i.name.trim()] = i.url; });

    const newProductType = items.length > 1
      ? `${items[0]?.type} (+${items.length - 1} món khác)`
      : (items[0]?.type || '');

    let tempOrderPrice = 0;
    items.forEach((it: any) => {
      const blank = podBlanks.find(b => b.name === it.type);
      if (blank && blank.display_price) {
        tempOrderPrice += blank.display_price * (it.quantity || 1);
      }
    });

    const updatedOrderData = { 
      ...editForm, 
      product_type: newProductType,
      order_price: Math.max(0, tempOrderPrice),
      special_print_areas: null, 
      mockup_urls: null,
      product_detail: JSON.stringify(items) 
    };

    if (editSource === 'import') {
      const updated = [...importOrders];
      updated[editingIndex] = updatedOrderData;
      setImportOrders(updated);
      setEditingIndex(null); 
    } else if (editSource === 'db') {
      try {
        const newDbOrders = [...dbOrders];
        newDbOrders[editingIndex] = updatedOrderData;
        setDbOrders(newDbOrders);

        const payloadForApi = {
          ...updatedOrderData,
          items: items, 
        };

        await api.post('/partner/orders', { 
          orders: [payloadForApi], 
          target_shop_id: selectedShopId 
        });
        
        notify("Lưu thay đổi thành công!");
        fetchOrdersFromDB(); 
        setEditingIndex(null);
      } catch (err: any) {
        alert(err.response?.data?.error || "Lỗi lưu dữ liệu. Hệ thống sẽ tải lại dữ liệu thực tế.");
        fetchOrdersFromDB(); // Tát cho tỉnh: Kéo lại data chuẩn để xóa bỏ giao diện ảo
      }
    }
  };

  const handleSyncToBackend = async () => {
    if (importOrders.length === 0 || !selectedShopId) return;
    
    setIsImporting(true);
    setMessage('Đang khởi động quá trình đồng bộ...');
    
    let totalCreated = 0;
    let totalSkipped = 0;
    let allMessages: string[] = []; 
    
    try {
      const BATCH_SIZE = 50; 
      const totalOrders = importOrders.length;

      const ordersReadyForBackend = importOrders.map(order => ({
        ...order,
        product_detail: order.items ? JSON.stringify(order.items) : order.product_detail,
      }));

      for (let i = 0; i < totalOrders; i += BATCH_SIZE) {
        const batch = ordersReadyForBackend.slice(i, i + BATCH_SIZE); 
        
        setMessage(`Đang đồng bộ: ${i + 1} đến ${Math.min(i + BATCH_SIZE, totalOrders)} / Tổng ${totalOrders} đơn...`);
        
        const response = await api.post('/partner/orders', { 
          orders: batch, 
          target_shop_id: selectedShopId 
        });

        const resData = response.data;
        totalCreated += resData.count || 0;
        
        const skippedCount = resData.skipped !== undefined ? resData.skipped : 
                            (resData.message?.includes('Bỏ qua:') ? parseInt(resData.message.split('Bỏ qua:')[1]) : 0);
        
        totalSkipped += skippedCount;

        if (resData.message && resData.message.includes('⚠️')) {
            const warningText = resData.message.substring(resData.message.indexOf('⚠️'));
            allMessages.push(warningText);
        }
      }

      if (totalSkipped > 0) {
        setMessage(`Đã lưu thành công ${totalCreated} đơn mới.\nBỏ qua ${totalSkipped} đơn do mã ID đã tồn tại trên hệ thống!\n\n${allMessages.join('\n')}`);
      } else {
        setMessage(`Đã đồng bộ thành công toàn bộ ${totalCreated} đơn hàng mới!`);
      }
      setTimeout(() => { 
        setImportOrders([]); 
        setActiveTab('list'); 
      }, totalSkipped > 0 ? 6000 : 2000);

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Lỗi đồng bộ không xác định!";
      console.error("Lỗi đồng bộ:", error);
      setMessage(errorMessage); 
      
    } finally { 
      setIsImporting(false); 
    }
  };

  const renderProductColumn = (order: any) => {
    const itemsArray = order.items || [];
    if (itemsArray.length > 0) {
      return (
        <div className="flex flex-col gap-1.5 py-1">
          {itemsArray.map((item: any, idx: number) => (
            <div key={idx} className="text-[10px] bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 w-max shadow-sm">
              <span className="font-extrabold text-[#C29017] bg-[#C29017]/10 px-1.5 py-0.5 rounded">{item.quantity || 1}x</span>
              <span className="font-bold text-gray-800">{item.type}</span>
              <span className="text-gray-500 font-medium border-l pl-2 ml-1">({item.color || 'N/A'} - {item.size || 'N/A'})</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-sm text-gray-500 font-medium">{order.product_type || '---'}</span>;
  };

  // ==========================================
  // 4. GIAO DIỆN BẢNG DÙNG CHUNG
  // ==========================================

  const renderOrderTable = (data: any[], isImport = false, pageOffset = 0) => {
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectedRows(data.map((order, idx) => isImport ? (pageOffset + idx).toString() : order.id));
      } else {
        setSelectedRows([]);
      }
    };

    const handleSelectRow = (checked: boolean, rowId: string) => {
      if (checked) setSelectedRows(prev => [...prev, rowId]);
      else setSelectedRows(prev => prev.filter(id => id !== rowId));
    };

    const handlePaySingleOrder = async (order: any) => {
      const isValid = isOrderStrictlyValid(order);
      if (!isValid) {
        await confirm({
          title: "Chưa thể thanh toán đơn hàng",
          message: (
            <div className="flex flex-col gap-3 text-sm text-gray-700 mt-2">
              <p className="font-bold text-gray-900 text-base">Đơn hàng chưa đủ điều kiện để sản xuất. Bạn vui lòng bổ sung:</p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-red-600">
                <li>Chọn đầy đủ <span className="font-extrabold underline underline-offset-2">Phôi, Màu sắc và Kích cỡ</span>.</li>
                <li>Cung cấp ít nhất <span className="font-extrabold underline underline-offset-2">1 Link thiết kế</span> (Front hoặc Back).</li>
              </ul>
              <p className="italic text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg text-xs">💡 Mẹo: Hệ thống sẽ tự động mở khóa nút Thanh toán ngay khi bạn điền đủ các thông tin trên!</p>
            </div>
          ),
          confirmText: "Tôi đã hiểu",
        });
        return;
      }
      
      const isConfirmed = await confirm({ title: "Xác nhận thanh toán", message: `Bạn muốn thanh toán đơn ${order.external_order_id}?`, confirmText: "Thanh toán ngay" });
      if (!isConfirmed) return;
      try {
        await api.post('/partner/orders/pay', { order_ids: [order.id] });
        notify("Thanh toán thành công!");
        window.dispatchEvent(new Event('refresh_total_spend'));
        fetchOrdersFromDB(); 
      } catch (e: any) { alert(e.response?.data?.error || "Đã xảy ra lỗi thanh toán."); }
    };

    const updateInlineItem = async (absoluteIdx: number, itemIdx: number, updates: any) => {
      const targetOrders = isImport ? [...importOrders] : [...dbOrders];
      const order = { ...targetOrders[absoluteIdx] };

      // 1. Phục hồi trí nhớ: Lôi dữ liệu cũ ra để không bị xóa mất Phôi/Link khi chọn Màu/Size
      let currentItems = order.items;
      if (!currentItems || !Array.isArray(currentItems) || currentItems.length === 0) {
        try {
          const pd = typeof order.product_detail === 'string' ? JSON.parse(order.product_detail) : order.product_detail;
          if (Array.isArray(pd)) currentItems = pd;
          else if (pd?.items && Array.isArray(pd.items)) currentItems = pd.items;
          else currentItems = [pd];
        } catch(e) {
          currentItems = [];
        }
      }
      
      const newItems = [...(currentItems || [])];
      if (!newItems[itemIdx]) newItems[itemIdx] = {};

      // Cập nhật thông tin bác vừa gõ
      newItems[itemIdx] = { ...newItems[itemIdx], ...updates };

      if (updates.type) {
        const newBlank = podBlanks.find(b => b.name === updates.type);
        if (newBlank) {
          const parseArraySafe = (data: any) => { if (Array.isArray(data)) return data; if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } } return []; };
          const validColors = parseArraySafe(newBlank.colors);
          const validSizes = parseArraySafe(newBlank.sizes);
          
          const matchedColor = validColors.find((c: string) => c.toLowerCase() === (newItems[itemIdx].color || '').trim().toLowerCase());
          const matchedSize = validSizes.find((s: string) => s.toLowerCase() === (newItems[itemIdx].size || '').trim().toLowerCase());
          
          // FIX TẠI ĐÂY: Xóa trắng nếu Phôi mới không hỗ trợ Màu/Size cũ
          newItems[itemIdx].color = matchedColor || '';
          newItems[itemIdx].size = matchedSize || '';
        }
      }

      // 2. Tự nhẩm tính tiền ngay lập tức
      let tempPrice = 0;
      newItems.forEach((it: any) => {
        const blank = podBlanks.find(b => (b.name || '').trim() === (it.type || '').trim());
        if (blank) {
          const itemPrice = Number(blank.display_price || blank.price || blank.base_price || 0);
          tempPrice += itemPrice * (Number(it.quantity) || 1);
        }
      });
      
      // Ép thẳng giá tiền mới vào đơn (Bảo vệ giá trị gốc nếu giao diện tính ra 0đ)
      if (tempPrice > 0) {
        order.order_price = tempPrice;
      }
      order.product_type = newItems.length > 1 ? `${newItems[0]?.type} (+${newItems.length - 1} món khác)` : (newItems[0]?.type || '');
      order.items = newItems;
      order.product_detail = JSON.stringify(newItems);
      
      targetOrders[absoluteIdx] = order;

      if (isImport) { 
        // Bọc vào startTransition để không làm đơ UI
        startTransition(() => {
          setImportOrders(targetOrders); 
        });
      } else {
        // Bọc vào startTransition để không làm đơ UI
        startTransition(() => {
          setDbOrders(targetOrders);
        });
        
        // 3. Đẩy lên Server (Âm thầm dưới background)
        try {
          // Hàm bọc an toàn: Biến chuỗi thành Object để tránh sập Server (Lỗi 400)
          const parseObjSafe = (val: any) => {
            if (!val) return null;
            if (typeof val === 'object') return val;
            if (typeof val === 'string') {
              try { return JSON.parse(val); } catch { return null; }
            }
            return null;
          };

          const payloadForApi = {
            ...order,
            order_price: order.order_price,
            product_type: order.product_type,
            product_detail: order.product_detail,
            // Ép 3 trường dễ lỗi này về đúng định dạng Object
            shipping_address: parseObjSafe(order.shipping_address),
            special_print_areas: parseObjSafe(order.special_print_areas),
            mockup_urls: parseObjSafe(order.mockup_urls)
          };
          
          await api.post('/partner/orders', { 
            orders: [payloadForApi], 
            target_shop_id: selectedShopId 
          });
          
        } catch(e: any) { 
          console.error("Lỗi auto-save Inline:", e);
          
          // 1. Cảnh báo ngay cho Seller biết việc lưu đã thất bại
          alert(`Lỗi đồng bộ dữ liệu: ${e.response?.data?.error || 'Không thể lưu thay đổi vào hệ thống'}. Hệ thống sẽ tải lại dữ liệu gốc.`);
          
          // 2. Kéo lại dữ liệu thật từ DB để đè lên cái giao diện đang bị ảo
          fetchOrdersFromDB();
        }
      }
    };

    const allPageRowIds = data.map((order, idx) => isImport ? (pageOffset + idx).toString() : order.id);
    const allPageSelected = data.length > 0 && allPageRowIds.every(id => selectedRows.includes(id));

    return (
      <div className="overflow-x-auto rounded-xl pb-24 min-h-[400px]">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-[11px] uppercase tracking-widest border-b border-gray-200">
              <th className="p-4 font-bold sticky left-0 top-0 z-20 bg-gray-100 border-r border-gray-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3">
                  <input type="checkbox" onChange={handleSelectAll} checked={allPageSelected} className="w-4 h-4 cursor-pointer accent-[#C29017] rounded border-gray-300 transition" />
                  <span>Thao tác</span>
                </div>
              </th>
              <th className="p-4 font-bold">Mã Đơn</th>
              <th className="p-4 font-bold">Ngày lên đơn</th>
              <th className="p-4 font-bold">Trạng thái</th>
              <th className="p-4 font-bold">Tracking</th>
              <th className="p-4 font-bold">Khách Hàng</th>
              <th className="p-4 font-bold min-w-[500px]">Chi tiết Sản phẩm & Thiết kế</th>
              <th className="p-4 font-bold text-gray-900 text-right">Giá</th>
              <th className="p-4 font-bold text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.map((order, idx) => {
              const absoluteIdx = pageOffset + idx;
              const rowId = isImport ? absoluteIdx.toString() : order.id;
              const isChecked = selectedRows.includes(rowId);
              const isRowLocked = !isImport && !['pending', 'complete'].includes(order.status);

              let statusLabel = order.status || 'pending';
              let badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
              if (order.status === 'complete') { statusLabel = 'Đã thanh toán'; badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'; } 
              else if (order.status === 'processing') { badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'; } 
              else if (order.status === 'in_transit') { badgeColor = 'bg-orange-50 text-orange-700 border-orange-200'; } 
              else if (order.status === 'done') { badgeColor = 'bg-green-50 text-green-700 border-green-200'; } 
              else if (order.status === 'cancelled') { badgeColor = 'bg-red-50 text-red-700 border-red-200'; } 
              else if (order.status === 'pending') { statusLabel = 'Chờ thanh toán'; }
              
              const safeItems = (() => {
                if (Array.isArray(order.items)) return order.items;
                try {
                  const pd = typeof order.product_detail === 'string' ? JSON.parse(order.product_detail) : order.product_detail;
                  if (Array.isArray(pd)) return pd;
                  if (pd?.items && Array.isArray(pd.items)) return pd.items;
                } catch(e) {}
                return [];
              })();

              // const isFullyMapped = safeItems.length > 0 && safeItems.every((item: any) => item.type && item.color && item.size);
              // const displayPrice = isFullyMapped ? (order.order_price || 0) : 0;
              const displayPrice = order.order_price || 0;
              const uniqueRowKey = order.id || order.external_order_id || `import-row-${absoluteIdx}`;
              const isEven = idx % 2 === 0;
              const rowBg = isChecked ? 'bg-[#C29017]/10' : (isEven ? 'bg-white' : 'bg-slate-50'); 
              const hoverEffect = isChecked ? '' : 'hover:bg-blue-50/50';

              return (
                <tr key={uniqueRowKey} className={`border-b-2 border-gray-200 transition duration-200 group ${rowBg} ${hoverEffect}`}>
                  
                  <td className={`p-4 sticky left-0 z-10 border-r border-gray-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors duration-200 ${rowBg} ${isChecked ? '' : 'group-hover:bg-blue-50/50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={isChecked} onChange={(e) => handleSelectRow(e.target.checked, rowId)} className="w-4 h-4 cursor-pointer accent-[#C29017] rounded transition" />
                      {(!isRowLocked) ? (
                        <>
                          <button onClick={() => openEditModal(isImport ? absoluteIdx : idx, isImport ? 'import' : 'db')} className="text-[#C29017] font-bold hover:underline hover:text-[#a87c14] transition">Sửa chi tiết</button>
                          {isImport && <button onClick={() => { setImportOrders(prev => prev.filter((_, i) => i !== absoluteIdx)); }} className="text-red-500 font-bold hover:underline transition">Xóa</button>}
                        </>
                      ) : ( <button onClick={() => openEditModal(idx, 'db')} className="text-teal-600 font-bold hover:underline transition">Xem chi tiết</button> )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 group/orderid w-max cursor-pointer">
                        <span className="font-bold text-gray-900">{order.external_order_id}</span>
                        {/* NÚT COPY (Ẩn mặc định, hiện khi Hover) */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(order.external_order_id); }}
                          className="opacity-0 group-hover/orderid:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity p-1 rounded-md hover:bg-blue-50"
                          title="Copy Mã Đơn"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* BADGE HIỂN THỊ TÊN SHOP */}
                      {order.shop_name && (
                        <span className="w-fit px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-slate-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                          </svg>
                          {order.shop_name}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-xs text-gray-600 font-medium">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString('vi-VN', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${badgeColor}`}>{statusLabel}</span>
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {order.tracking_number ? (
                      <div className="flex items-center gap-1.5 group/tracking w-max cursor-pointer">
                        <span className="font-bold text-[#C29017]">{order.tracking_number}</span>
                        {/* NÚT COPY TRACKING */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(order.tracking_number); }}
                          className="opacity-0 group-hover/tracking:opacity-100 text-gray-400 hover:text-[#C29017] transition-opacity p-1 rounded-md hover:bg-amber-50"
                          title="Copy Tracking"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có</span>
                    )}
                  </td>

                  <td className="p-4 font-semibold text-gray-800">{order.customer_name}</td>

                  <td className="p-4 align-top min-w-[500px] relative hover:z-[90]">
                    <div className="flex flex-col gap-4 py-1">
                      {safeItems.map((item: any, itemIdx: number) => {
                        // Đưa logic xử lý lên đầu hàm map (Rất gọn gàng, không cần ngoặc lằng nhằng)
                        const selectedBlank = podBlanks.find(b => b.name === item.type);
                        const parseArraySafe = (data: any) => {
                          if (Array.isArray(data)) return data;
                          if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } }
                          return [];
                        };
                        const availableColors = parseArraySafe(selectedBlank?.colors);
                        const availableSizes = parseArraySafe(selectedBlank?.sizes);
                  
                        return (
                          <div key={`${uniqueRowKey}-item-${itemIdx}`} className="flex gap-5 p-3 bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all relative group/itemcard">
                            
                            {/* ================= NỬA TRÁI ================= */}
                            <div className="w-[240px] shrink-0 flex flex-col gap-2.5 border-r border-gray-100 pr-5">
                              <div className="shadow-sm rounded-lg w-full">
                                <SkuCombobox
                                  disabled={isRowLocked}
                                  value={item.sku || ''}
                                  options={sellerDesigns}
                                  onBlur={async (val) => {
                                    const trimmedVal = val.trim();
                                    if (!trimmedVal) {
                                      updateInlineItem(absoluteIdx, itemIdx, { sku: '' });
                                      return;
                                    }
                              
                                    // 1. TÌM NHANH TẠI CHỖ (LOCAL STATE)
                                    const localMatch = sellerDesigns.find((d: any) => d.sku.toLowerCase() === trimmedVal.toLowerCase());
                                    
                                    if (localMatch) {
                                      const libraryExtraAreas = localMatch.extra_print_areas || [];
                                      updateInlineItem(absoluteIdx, itemIdx, {
                                        sku: localMatch.sku,
                                        design_front: localMatch.design_front_url || item.design_front,
                                        design_back: localMatch.design_back_url || item.design_back,
                                        mockup: localMatch.mockup_url || item.mockup,
                                        extra_print_areas: libraryExtraAreas.length > 0 ? libraryExtraAreas : item.extra_print_areas
                                      });
                                      return;
                                    }
                              
                                    // 2. TÌM SÂU TRÊN SERVER (API CALL)
                                    try {
                                      const res = await api.get('/partner/designs', {
                                        params: { shop_id: selectedShopId, search: trimmedVal }
                                      });
                                      const designs = res.data.designs || [];
                                      const exactMatch = designs.find((d: any) => d.sku.toLowerCase() === trimmedVal.toLowerCase());
                              
                                      if (exactMatch) {
                                        const libraryExtraAreas = exactMatch.extra_print_areas || [];
                                        updateInlineItem(absoluteIdx, itemIdx, {
                                          sku: exactMatch.sku,
                                          design_front: exactMatch.design_front_url || item.design_front,
                                          design_back: exactMatch.design_back_url || item.design_back,
                                          mockup: exactMatch.mockup_url || item.mockup,
                                          extra_print_areas: libraryExtraAreas.length > 0 ? libraryExtraAreas : item.extra_print_areas
                                        });
                                        notify(`Đã đồng bộ thiết kế từ máy chủ cho SKU: ${trimmedVal}`);
                                      } else {
                                        updateInlineItem(absoluteIdx, itemIdx, { sku: trimmedVal });
                                      }
                                    } catch (error) {
                                      updateInlineItem(absoluteIdx, itemIdx, { sku: trimmedVal });
                                    }
                                  }} 
                                  onSelect={(design) => {
                                    const libraryExtraAreas = design.extra_print_areas || [];
                                    updateInlineItem(absoluteIdx, itemIdx, {
                                      sku: design.sku,
                                      design_front: design.design_front_url,
                                      design_back: design.design_back_url,
                                      mockup: design.mockup_url,
                                      // FIX TẠI ĐÂY: Dùng lại item.extra_print_areas nếu thư viện không có
                                      extra_print_areas: libraryExtraAreas.length > 0 ? libraryExtraAreas : item.extra_print_areas 
                                    });
                                    notify(`Đã đồng bộ thiết kế SKU: ${design.sku}`);
                                  }}
                                />
                              </div>
                              {!isRowLocked && item.sku && (
                                <button
                                  onClick={() => handleUpdateSKULibrary(item)}
                                  className="w-full text-[10px] bg-blue-50 text-blue-600 py-1.5 rounded-lg border border-blue-100 font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1"
                                  title="Cập nhật thông tin thiết kế hiện tại vào Thư viện SKU"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                  Lưu vào Thư viện
                                </button>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                {[
                                  { label: 'Front', url: item.design_front },
                                  { label: 'Back', url: item.design_back },
                                  { label: 'Mockup', url: item.mockup }
                                ].map((img, i) => {
                                  const isValidUrl = isValidImageUrl(img.url);
                                  const isNote = img.url && !isValidUrl;
                  
                                  return (
                                    <div key={i} className="relative group/inlineImg">
                                      <div 
                                        className="w-[50px] h-[50px] rounded-md border border-gray-200 flex items-center justify-center overflow-hidden cursor-help shadow-sm transition-colors relative"
                                        style={{ backgroundColor: getStandardColor(item.color) }}
                                      >
                                        {isValidUrl ? (
                                          <img 
                                            src={convertGoogleDriveUrl(img.url)} 
                                            alt={img.label} 
                                            className={`w-full h-full ${img.label === 'Mockup' ? 'object-cover' : 'object-contain p-0.5'}`} 
                                            onError={(e) => { 
                                              e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                              e.currentTarget.onerror = null; 
                                            }} 
                                          />
                                        ) : isNote ? (
                                          <div className="flex flex-col items-center justify-center p-1 w-full h-full bg-yellow-50/90 border-b-2 border-yellow-300">
                                            <span className="text-[14px]">📝</span>
                                            <span className="text-[6.5px] font-bold text-gray-700 leading-tight text-center line-clamp-1 w-full px-0.5">{img.url}</span>
                                          </div>
                                        ) : (
                                          <span className="text-[7px] font-bold text-gray-500 uppercase bg-white/80 px-1 py-0.5 rounded">{img.label}</span>
                                        )}
                                      </div>
                                      
                                      {isValidUrl ? (
                                        <div className="absolute top-full left-0 mt-2 hidden group-hover/inlineImg:block z-[99999] pointer-events-none">
                                          <div className="bg-white p-1.5 rounded-xl shadow-2xl border border-gray-200">
                                            <img 
                                              src={convertGoogleDriveUrl(img.url)} 
                                              className="w-auto h-auto max-w-[200px] object-contain rounded-lg" 
                                              style={{ backgroundColor: getStandardColor(item.color) }} 
                                              onError={(e) => { 
                                                e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                                e.currentTarget.onerror = null; 
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ) : isNote && (
                                        <div className="absolute top-full left-0 mt-2 hidden group-hover/inlineImg:block z-[99999] pointer-events-none">
                                          <div className="bg-yellow-50 p-2.5 rounded-lg shadow-xl border border-yellow-300 min-w-[150px] max-w-[250px]">
                                            <div className="text-[10px] font-bold text-yellow-800 mb-1 uppercase border-b border-yellow-200 pb-1">Ghi chú ({img.label}):</div>
                                            <p className="text-[11px] text-gray-800 whitespace-pre-wrap">{img.url}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                  
                              {/* KHỐI NHẬP LINK RÚT GỌN (FRONT / BACK / MOCKUP) */}
                              <div className="flex flex-col gap-1 mt-auto bg-gray-50/80 p-1.5 rounded-lg border border-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                                
                                {/* 1. Link Front */}
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/20 transition-all">
                                  <span className="text-[8.5px] font-extrabold text-blue-500 w-11 shrink-0 uppercase tracking-tight text-center">Front</span>
                                  <div className="w-px h-3 bg-gray-200 shrink-0"></div>
                                  <input
                                    key={`front-${uniqueRowKey}-${itemIdx}-${item.design_front || 'empty'}`}
                                    type="text"
                                    disabled={isRowLocked}
                                    placeholder="Dán link..."
                                    defaultValue={item.design_front || ''}
                                    onBlur={(e) => {
                                      if (e.target.value === item.design_front) return;
                                      updateInlineItem(absoluteIdx, itemIdx, { design_front: e.target.value });
                                    }}
                                    className="w-full text-[9.5px] py-1 bg-transparent outline-none text-gray-700 placeholder-gray-300 font-medium"
                                  />
                                </div>

                                {/* 2. Link Back */}
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-1.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/20 transition-all">
                                  <span className="text-[8.5px] font-extrabold text-purple-500 w-11 shrink-0 uppercase tracking-tight text-center">Back</span>
                                  <div className="w-px h-3 bg-gray-200 shrink-0"></div>
                                  <input
                                    key={`back-${uniqueRowKey}-${itemIdx}-${item.design_back || 'empty'}`}
                                    type="text"
                                    disabled={isRowLocked}
                                    placeholder="Dán link..."
                                    defaultValue={item.design_back || ''}
                                    onBlur={(e) => {
                                      if (e.target.value === item.design_back) return;
                                      updateInlineItem(absoluteIdx, itemIdx, { design_back: e.target.value });
                                    }}
                                    className="w-full text-[9.5px] py-1 bg-transparent outline-none text-gray-700 placeholder-gray-300 font-medium"
                                  />
                                </div>

                                {/* 3. Link Mockup (MỚI THÊM) */}
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-1.5 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all">
                                  <span className="text-[8.5px] font-extrabold text-teal-600 w-11 shrink-0 uppercase tracking-tight text-center">Mockup</span>
                                  <div className="w-px h-3 bg-gray-200 shrink-0"></div>
                                  <input
                                    key={`mockup-${uniqueRowKey}-${itemIdx}-${item.mockup || 'empty'}`}
                                    type="text"
                                    disabled={isRowLocked}
                                    placeholder="Dán link..."
                                    defaultValue={item.mockup || ''}
                                    onBlur={(e) => {
                                      if (e.target.value === item.mockup) return;
                                      updateInlineItem(absoluteIdx, itemIdx, { mockup: e.target.value });
                                    }}
                                    className="w-full text-[9.5px] py-1 bg-transparent outline-none text-gray-700 placeholder-gray-300 font-medium"
                                  />
                                </div>
                                
                              </div>
                            </div>
                  
                            {/* ================= NỬA PHẢI ================= */}
                            <div className="flex-1 flex flex-col gap-2 justify-center">
                              
                              {item.original_string && (
                                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded text-amber-700 w-fit max-w-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                                  <span className="text-[10px] font-bold truncate tracking-tight">{item.original_string}</span>
                                </div>
                              )}
                  
                              <SearchableDropdown disabled={isRowLocked} value={item.type || ''} placeholder="Chọn phôi..." options={podBlanks} onChange={(val) => updateInlineItem(absoluteIdx, itemIdx, { type: val })} />
                              
                              {/* --- Block Chọn MÀU SẮC, SIZE và SL mới --- */}
                              <div className="flex items-center gap-1.5 w-full">
                                <select
                                  disabled={isRowLocked || !item.type}
                                  value={item.color || ''}
                                  onChange={(e) => updateInlineItem(absoluteIdx, itemIdx, { color: e.target.value })}
                                  className={`flex-1 bg-gray-50 border p-1.5 rounded-md text-[10px] outline-none focus:border-blue-400 focus:bg-white disabled:opacity-60 transition-colors cursor-pointer 
                                    ${!item.color && item.type ? 'border-red-400 bg-red-50 text-red-600 font-bold' : 'border-gray-200 text-gray-700'}`}
                                >
                                  <option value="">Chọn Màu</option>
                                  {availableColors.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                  
                                <select
                                  disabled={isRowLocked || !item.type}
                                  value={item.size || ''}
                                  onChange={(e) => updateInlineItem(absoluteIdx, itemIdx, { size: e.target.value })}
                                  className={`flex-1 bg-gray-50 border p-1.5 rounded-md text-[10px] outline-none focus:border-blue-400 focus:bg-white disabled:opacity-60 transition-colors cursor-pointer 
                                    ${!item.size && item.type ? 'border-red-400 bg-red-50 text-red-600 font-bold' : 'border-gray-200 text-gray-700'}`}
                                >
                                  <option value="">Chọn Size</option>
                                  {availableSizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                </select>
                  
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md overflow-hidden shrink-0">
                                  <span className="text-[9px] font-bold text-gray-400 px-1.5 border-r border-gray-200 bg-gray-100">SL</span>
                                  <input
                                    type="number"
                                    min="1"
                                    disabled={isRowLocked}
                                    value={item.quantity || 1}
                                    onChange={(e) => updateInlineItem(absoluteIdx, itemIdx, { quantity: parseInt(e.target.value) || 1 })}
                                    className="w-8 p-1.5 text-[10px] text-center font-bold text-[#C29017] outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                  
                              <input
                                key={`item-note-${uniqueRowKey}-${itemIdx}`}
                                type="text"
                                disabled={isRowLocked}
                                placeholder="✏️ Ghi chú riêng cho sản phẩm này..."
                                defaultValue={item.note || ''}
                                onBlur={(e) => {
                                  if (e.target.value === (item.note || '')) return;
                                  // Lưu trực tiếp vào trường item.note thông qua hàm updateInlineItem cực gọn
                                  updateInlineItem(absoluteIdx, itemIdx, { note: e.target.value });
                                }}
                                className="w-full bg-yellow-50/50 border border-yellow-200/80 text-[10px] px-2 py-1.5 rounded-md outline-none focus:border-yellow-400 focus:bg-yellow-50 text-gray-700 placeholder-gray-400 shadow-sm mt-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 font-extrabold text-gray-900 text-right">
                    ${Number(displayPrice).toFixed(2)}
                  </td>

                  <td className="p-4 text-center align-middle">
                    {order.status === 'pending' && !isImport && (
                      <button onClick={(e) => { e.stopPropagation(); handlePaySingleOrder(order); }} className="bg-[#C29017] hover:bg-[#a67b13] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 flex gap-1 w-max">
        <button 
          onClick={() => setActiveTab('list')} 
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${
            activeTab === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Quản lý đơn
        </button>
        
        <button 
          onClick={() => setActiveTab('import')} 
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${
            activeTab === 'import' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Import CSV
        </button>
        <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
        <button 
          onClick={handleOpenCreateModal} 
          className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition text-blue-600 hover:bg-blue-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tạo đơn lẻ
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'pending', label: 'Chờ thanh toán' },
              { value: 'complete', label: 'Chờ duyệt' },
              { value: 'processing', label: 'Đang sản xuất' },
              { value: 'in_transit', label: 'Đang giao hàng' },
              { value: 'done', label: 'Hoàn thành' },
              { value: 'cancelled', label: 'Đã hủy' },
              { value: 'support', label: 'Yêu cầu Hỗ trợ' },
              { value: 'reship', label: 'Đơn Reship' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  if (typeof setCurrentPage === 'function') setCurrentPage(1); 
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  statusFilter === tab.value
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
            <input 
              type="text" 
              placeholder="Tìm đơn..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="flex-1 min-w-[200px] border p-2 rounded-lg outline-none focus:border-blue-500"
            />
            
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
              <span className="text-[10px] font-bold text-gray-400 ml-2 uppercase">Từ</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => {setStartDate(e.target.value); setCurrentPage(1);}} 
                className="bg-transparent text-sm p-1 outline-none text-gray-600"
              />
              <span className="text-gray-300">|</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Đến</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => {setEndDate(e.target.value); setCurrentPage(1);}} 
                className="bg-transparent text-sm p-1 outline-none text-gray-600"
              />
            </div>

            {(searchQuery || startDate || endDate || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  handleResetFilters();
                  setStatusFilter('all'); 
                }} 
                className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 font-bold rounded-lg text-sm transition"
              >
                ✖ Xóa lọc
              </button>
            )}
            {statusFilter === 'pending' && (
              <button
                onClick={handlePayAllPendingOrders}
                disabled={isAddingToPay || dbOrders.length === 0}
                className="px-4 py-2 bg-[#C29017] hover:bg-[#a67b13] disabled:bg-gray-300 text-white font-bold rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
              >
                {isAddingToPay ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Thanh toán tất cả
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Đang xuất...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Xuất file CSV
                </>
              )}
            </button>
            <div className="ml-auto text-sm font-medium text-gray-500">
              Tổng kết quả: <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded font-bold">{totalCount}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            {dbOrders.length > 0 ? (
              renderOrderTable(dbOrders, false, 0)
            ) : (
              <div className="p-12 text-center text-gray-500 font-medium">
                Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>
          {/* === THANH PHÂN TRANG === */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 mt-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="text-sm text-gray-500 font-medium">
                Hiển thị <span className="font-bold text-gray-900">{dbOrders.length}</span> / <span className="font-bold text-gray-900">{totalCount}</span> đơn hàng
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Trước
                </button>
                
                <div className="px-4 py-2 bg-gray-50 border rounded-lg text-sm font-bold text-gray-700">
                  Trang {currentPage} / {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex gap-3">
              <label className="bg-white border-2 border-dashed border-gray-300 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:border-blue-500 transition">Chọn file CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
              {importOrders.length > 0 && (
                <button 
                  onClick={handleSyncToBackend} 
                  disabled={isImporting} 
                  className="bg-[#C29017] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#a67b13] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Đang gửi...' : 'Đồng bộ lên Web'}
                </button>
              )}
            </div>
          </div>
          {message && (
            <div className={`p-4 rounded-xl text-sm border shadow-sm ${
              message.includes('thất bại') || message.includes('Lỗi')
                ? 'bg-red-50 text-red-800 border-red-200'
                : message.includes('thành công')
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed font-semibold">
                {message}
              </div>
            </div>
          )}
          {(() => {
            const importTotalPages = Math.ceil(importOrders.length / IMPORT_PAGE_SIZE);
            const importPageData = importOrders.slice(
              (importCurrentPage - 1) * IMPORT_PAGE_SIZE,
              importCurrentPage * IMPORT_PAGE_SIZE
            );
            return (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {renderOrderTable(importPageData, true, (importCurrentPage - 1) * IMPORT_PAGE_SIZE)}
                </div>
                {importTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 mt-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className="text-sm text-gray-500 font-medium">
                      Hiển thị <span className="font-bold text-gray-900">{importPageData.length}</span> / <span className="font-bold text-gray-900">{importOrders.length}</span> đơn hàng
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImportCurrentPage(p => Math.max(1, p - 1))}
                        disabled={importCurrentPage === 1}
                        className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        ← Trước
                      </button>
                      <div className="px-4 py-2 bg-gray-50 border rounded-lg text-sm font-bold text-gray-700">
                        Trang {importCurrentPage} / {importTotalPages}
                      </div>
                      <button
                        onClick={() => setImportCurrentPage(p => Math.min(importTotalPages, p + 1))}
                        disabled={importCurrentPage === importTotalPages}
                        className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* MODAL CHI TIẾT/CHỈNH SỬA */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-gray-900/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-50 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] w-[75vw] max-w-7xl max-h-[90vh] flex flex-col scale-in overflow-hidden border border-white/20">
            
            <div className="px-8 py-4 border-b border-gray-200/60 flex justify-between items-center bg-white z-10 shadow-sm rounded-t-[2rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C29017]/10 text-[#C29017] rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-gray-800 text-xl tracking-tight leading-none">
                      {isReadOnly ? 'Chi tiết đơn hàng' : 'Cập nhật đơn hàng'}
                    </h3>
                    
                    {(() => {
                      switch(editForm.status) {
                        case 'pending': return <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-amber-200/60 shadow-sm">Chờ thanh toán</span>;
                        case 'complete': return <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-blue-200/60 shadow-sm">Đã thanh toán</span>;
                        case 'processing': return <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-indigo-200/60 shadow-sm">Đang sản xuất</span>;
                        case 'in_transit': return <span className="bg-teal-50 text-teal-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-teal-200/60 shadow-sm">Đang giao hàng</span>;
                        case 'done': return <span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-green-200/60 shadow-sm">Hoàn thành</span>;
                        case 'cancelled': return <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-red-200/60 shadow-sm">Đã hủy</span>;
                        default: return <span className="bg-gray-50 text-gray-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-gray-200/60 shadow-sm">{editForm.status}</span>;
                      }
                    })()}
                  </div>
                  
                  <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                    Mã hệ thống: <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{editForm.external_order_id || 'Chưa lưu'}</span>
                  </div>
                </div>
              </div>
              
              <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
             
              {editForm.status === 'complete' && (
                <div className="p-4 bg-blue-50/80 ring-1 ring-blue-200 text-blue-800 rounded-2xl text-xs font-bold leading-relaxed shadow-sm">
                  Đơn hàng đã được thanh toán và gửi đến Admin xưởng. Bạn vẫn có thể thay đổi thiết kế hoặc thông tin giao hàng ở đây, nhưng để đảm bảo an toàn, vui lòng liên hệ thêm bộ phận hỗ trợ xưởng để cập nhật kịp thời!
                </div>
              )}
              {['processing', 'in_transit', 'done', 'cancelled'].includes(editForm.status) && (
                <div className="p-4 bg-red-50/80 ring-1 ring-red-200 text-red-700 rounded-2xl text-xs font-bold shadow-sm">
                  Đơn hàng đã vượt qua khâu xét duyệt / đã khóa. Tuyệt đối không thể can thiệp thay đổi thông tin hệ thống ở giai đoạn này.
                </div>
              )}

              {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG & GIAO HÀNG */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-5">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                       <span className="w-2 h-2 rounded-full bg-blue-500"></span> Thông tin liên hệ
                    </h4>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 block mb-1.5">Họ và tên</label>
                      <input disabled={isReadOnly} value={editForm.customer_name || ''} onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 block mb-1.5">Email</label>
                        <input disabled={isReadOnly} value={editForm.customer_email || ''} onChange={(e) => setEditForm({...editForm, customer_email: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 block mb-1.5">Số điện thoại</label>
                        <input disabled={isReadOnly} value={editForm.customer_phone || ''} onChange={(e) => setEditForm({...editForm, customer_phone: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span> Địa chỉ giao hàng
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input disabled={isReadOnly} placeholder="Địa chỉ 1 (Line 1)" value={editForm.shipping_address?.line_1 || ''} onChange={(e) => setEditForm({...editForm, shipping_address: {...editForm.shipping_address, line_1: e.target.value}})} className="col-span-2 w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      <input disabled={isReadOnly} placeholder="Địa chỉ 2 (Line 2)" value={editForm.shipping_address?.line_2 || ''} onChange={(e) => setEditForm({...editForm, shipping_address: {...editForm.shipping_address, line_2: e.target.value}})} className="col-span-2 w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      <input disabled={isReadOnly} placeholder="Thành phố (City)" value={editForm.shipping_address?.city || ''} onChange={(e) => setEditForm({...editForm, shipping_address: {...editForm.shipping_address, city: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      <input disabled={isReadOnly} placeholder="Bang (State/Region)" value={editForm.shipping_address?.region || ''} onChange={(e) => setEditForm({...editForm, shipping_address: {...editForm.shipping_address, region: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      <input disabled={isReadOnly} placeholder="Mã bưu điện (Zip)" value={editForm.shipping_address?.zip || ''} onChange={(e) => setEditForm({...editForm, shipping_address: {...editForm.shipping_address, zip: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                      <input disabled={isReadOnly} placeholder="Quốc gia (Country)" value={editForm.shipping_address?.country || ''} onChange={(e) => setEditForm({...editForm, shipping_address: {...editForm.shipping_address, country: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all disabled:opacity-60"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: DANH SÁCH MẶT HÀNG */}
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C29017]"></span> Sản phẩm trong đơn ({editForm.items?.length || 0})
                  </h4>
                  {!isReadOnly && (
                    <button
                      onClick={() => {
                        const newItem = { sku: '', type: '', color: '', size: '', quantity: 1, design_front: '', design_back: '', mockup: '', note: '', extra_print_areas: [] };
                        setEditForm({ ...editForm, items: [...(editForm.items || []), newItem] });
                      }}
                      className="text-xs bg-white shadow-sm ring-1 ring-gray-200 px-4 py-2 rounded-xl text-gray-700 font-bold hover:shadow-md hover:text-[#C29017] hover:ring-[#C29017]/30 transition-all"
                    >
                      + Thêm sản phẩm
                    </button>
                  )}
                </div>
                
                {(editForm.items || []).map((item: any, index: number) => {
                  const selectedBlank = podBlanks.find(b => b.name === item.type);
                  const parseArraySafe = (data: any) => {
                    if (Array.isArray(data)) return data;
                    if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } }
                    return [];
                  };
                  const availableColors = parseArraySafe(selectedBlank?.colors);
                  const availableSizes = parseArraySafe(selectedBlank?.sizes);

                  return (
                    <div key={index} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 space-y-6 relative group transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#C29017] to-amber-200 opacity-80 rounded-l-[2rem]"></div>
                      {item.original_string && (
                        <div className="bg-amber-50/50 ring-1 ring-amber-200/80 p-4 rounded-2xl flex items-start gap-3 shadow-sm relative z-10">
                          <div className="mt-0.5 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mb-1">Dữ liệu gốc từ file (Đối chiếu)</div>
                            <div className="text-sm font-bold text-amber-900 leading-snug">{item.original_string}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start pb-4">
                        <div className="flex-1 flex items-center gap-4">
                          <span className="text-[10px] bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider shadow-sm">Món #{index + 1}</span>
                          <div className="w-full max-w-sm">
                            <SkuCombobox
                              disabled={isReadOnly}
                              value={item.sku || ''}
                              options={sellerDesigns}
                              onChange={(newSku) => {
                                const newItems = [...editForm.items];
                                newItems[index] = { ...newItems[index], sku: newSku };
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              onSelect={(matchedDesign) => {
                                const newItems = [...editForm.items];
                                const libraryExtraAreas = matchedDesign.extra_print_areas || [];
                                newItems[index] = {
                                  ...newItems[index],
                                  sku: matchedDesign.sku,
                                  design_front: matchedDesign.design_front_url || newItems[index].design_front,
                                  design_back: matchedDesign.design_back_url || newItems[index].design_back,
                                  mockup: matchedDesign.mockup_url || newItems[index].mockup,
                                  extra_print_areas: libraryExtraAreas.length > 0 ? libraryExtraAreas : newItems[index].extra_print_areas
                                };
                                setEditForm({ ...editForm, items: newItems });
                                notify(`Đã đồng bộ thiết kế thành công cho: ${matchedDesign.sku}`);
                              }}
                            />
                          </div>
                          {!isReadOnly && item.sku && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSKULibrary(item)}
                              className="text-[11px] bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                              Lưu thư viện
                            </button>
                          )}
                        </div>
                        {!isReadOnly && (editForm.items || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = editForm.items.filter((_: any, i: number) => i !== index);
                              setEditForm({ ...editForm, items: newItems });
                            }}
                            className="text-[10px] text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white hover:shadow-md font-bold transition-all ml-4 shrink-0"
                          >
                            ✕ Xóa mặt hàng
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-5 gap-6 bg-gray-50/50 p-5 rounded-2xl ring-1 ring-gray-100">
                        <div className="col-span-2">
                          <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1.5">Loại sản phẩm (Phôi)</label>
                          <SearchableDropdown
                            disabled={isReadOnly}
                            value={item.type || ''}
                            placeholder="Chọn sản phẩm..."
                            options={podBlanks}
                            onChange={(newType: string) => {
                              const newBlank = podBlanks.find(b => b.name === newType);
                              const newItems = [...editForm.items];
                              const currentItem = newItems[index];
                              
                              currentItem.type = newType;
                              
                              if (newBlank) {
                                const parseArraySafe = (data: any) => { if (Array.isArray(data)) return data; if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } } return []; };
                                const newBlankColors = parseArraySafe(newBlank.colors);
                                const newBlankSizes = parseArraySafe(newBlank.sizes);
                                
                                const matchedColor = newBlankColors.find((c: string) => c.toLowerCase() === (currentItem.color || '').trim().toLowerCase());
                                const matchedSize = newBlankSizes.find((s: string) => s.toLowerCase() === (currentItem.size || '').trim().toLowerCase());
                                
                                currentItem.color = matchedColor || '';
                                currentItem.size = matchedSize || '';
                              }
                              setEditForm({ ...editForm, items: newItems });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1.5">Màu sắc</label>
                          <select disabled={isReadOnly || !item.type} value={item.color || ''} onChange={(e) => { const newItems = [...editForm.items]; newItems[index] = { ...newItems[index], color: e.target.value }; setEditForm({ ...editForm, items: newItems }); }} className={`w-full bg-white ring-1 ring-gray-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer disabled:bg-gray-100 ${!item.color && item.type ? 'ring-red-400 bg-red-50' : ''}`}>
                            <option value="">Chọn Màu</option>
                            {availableColors.map((c: string) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1.5">Kích cỡ</label>
                          <select disabled={isReadOnly || !item.type} value={item.size || ''} onChange={(e) => { const newItems = [...editForm.items]; newItems[index] = { ...newItems[index], size: e.target.value }; setEditForm({ ...editForm, items: newItems }); }} className={`w-full bg-white ring-1 ring-gray-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer disabled:bg-gray-100 ${!item.size && item.type ? 'ring-red-400 bg-red-50' : ''}`}>
                            <option value="">Chọn Size</option>
                            {availableSizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1.5">Số lượng</label>
                          <input 
                            type="number" 
                            min="1" 
                            disabled={isReadOnly} 
                            value={item.quantity || 1} 
                            onChange={(e) => { 
                              const newItems = [...editForm.items]; 
                              newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value) || 1 }; 
                              setEditForm({ ...editForm, items: newItems }); 
                            }} 
                            className="w-full bg-white ring-1 ring-gray-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Mặt Trước */}
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] ring-1 ring-gray-100 transition-all hover:ring-blue-200">
                          <div className="relative group/img shrink-0">
                            {(() => {
                              // Dùng Helper mới kiểm tra khắt khe
                              const isValidUrl = isValidImageUrl(item.design_front);
                              const isNote = item.design_front && !isValidUrl;

                              return (
                                <>
                                  <div 
                                    className="w-20 h-20 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-help border border-gray-200 transition-colors duration-300 relative"
                                    style={{ backgroundColor: getStandardColor(item.color) }}
                                  >
                                    {isValidUrl ? (
                                      <img 
                                        src={convertGoogleDriveUrl(item.design_front)} 
                                        alt="Front" 
                                        className="w-full h-full object-contain p-1" 
                                        onError={(e) => { 
                                          e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                          e.currentTarget.onerror = null; 
                                        }} 
                                      />
                                    ) : isNote ? (
                                      <div className="flex flex-col items-center justify-center p-2 w-full h-full bg-yellow-50/90 border-b-[3px] border-yellow-300">
                                        <span className="text-[20px]">📝</span>
                                        <span className="text-[9px] font-bold text-gray-700 leading-tight text-center line-clamp-2 w-full mt-1 px-1">{item.design_front}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] font-bold text-gray-600 text-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">No Img<br/>Front</span>
                                    )}
                                  </div>

                                  {isValidUrl ? (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                        <img 
                                          src={convertGoogleDriveUrl(item.design_front)} 
                                          alt="Preview" 
                                          className="w-auto h-auto max-w-[200px] object-contain rounded-lg" 
                                          style={{ backgroundColor: getStandardColor(item.color) }}
                                          onError={(e) => { 
                                            e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                            e.currentTarget.onerror = null; 
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : isNote && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-yellow-50 p-3 rounded-xl shadow-xl ring-1 ring-yellow-300 min-w-[150px] max-w-[250px]">
                                        <div className="text-[11px] font-bold text-yellow-800 mb-1.5 uppercase border-b border-yellow-200 pb-1">Ghi chú (Front):</div>
                                        <p className="text-[12px] text-gray-800 whitespace-pre-wrap">{item.design_front}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <label className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Mặt Trước</label>
                            <input disabled={isReadOnly} placeholder="Nhập Link Design..." value={item.design_front || ''} onChange={(e) => { const n = [...editForm.items]; n[index] = { ...n[index], design_front: e.target.value }; setEditForm({ ...editForm, items: n }); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"/>
                          </div>
                        </div>

                        {/* Mặt Sau */}
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] ring-1 ring-gray-100 transition-all hover:ring-purple-200">
                          <div className="relative group/img shrink-0">
                            {(() => {
                              const isValidUrl = isValidImageUrl(item.design_back);
                              const isNote = item.design_back && !isValidUrl;

                              return (
                                <>
                                  <div 
                                    className="w-20 h-20 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-help border border-gray-200 transition-colors duration-300 relative"
                                    style={{ backgroundColor: getStandardColor(item.color) }}
                                  >
                                    {isValidUrl ? (
                                      <img 
                                        src={convertGoogleDriveUrl(item.design_back)} 
                                        alt="Back" 
                                        className="w-full h-full object-contain p-1" 
                                        onError={(e) => { 
                                          e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                          e.currentTarget.onerror = null; 
                                        }} 
                                      />
                                    ) : isNote ? (
                                      <div className="flex flex-col items-center justify-center p-2 w-full h-full bg-yellow-50/90 border-b-[3px] border-yellow-300">
                                        <span className="text-[20px]">📝</span>
                                        <span className="text-[9px] font-bold text-gray-700 leading-tight text-center line-clamp-2 w-full mt-1 px-1">{item.design_back}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] font-bold text-gray-600 text-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">No Img<br/>Back</span>
                                    )}
                                  </div>

                                  {isValidUrl ? (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                        <img src={convertGoogleDriveUrl(item.design_back)} alt="Preview" className="w-auto h-auto max-w-[200px] object-contain rounded-lg" style={{ backgroundColor: getStandardColor(item.color) }} onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; e.currentTarget.onerror = null; }} />
                                      </div>
                                    </div>
                                  ) : isNote && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-yellow-50 p-3 rounded-xl shadow-xl ring-1 ring-yellow-300 min-w-[150px] max-w-[250px]">
                                        <div className="text-[11px] font-bold text-yellow-800 mb-1.5 uppercase border-b border-yellow-200 pb-1">Ghi chú (Back):</div>
                                        <p className="text-[12px] text-gray-800 whitespace-pre-wrap">{item.design_back}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <label className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Mặt Sau</label>
                            <input disabled={isReadOnly} placeholder="Nhập Link Design..." value={item.design_back || ''} onChange={(e) => { const n = [...editForm.items]; n[index] = { ...n[index], design_back: e.target.value }; setEditForm({ ...editForm, items: n });  }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"/>
                          </div>
                        </div>

                        {/* Mockup */}
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] ring-1 ring-gray-100 transition-all hover:ring-teal-200">
                          <div className="relative group/img shrink-0">
                            {(() => {
                              const isValidUrl = isValidImageUrl(item.mockup);
                              const isNote = item.mockup && !isValidUrl;

                              return (
                                <>
                                  <div 
                                    className="w-20 h-20 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-help border border-gray-200 transition-colors duration-300 relative"
                                    style={{ backgroundColor: getStandardColor(item.color) }}
                                  >
                                    {isValidUrl ? (
                                      <img 
                                        src={convertGoogleDriveUrl(item.mockup)} 
                                        alt="Mockup" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { 
                                          e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                          e.currentTarget.onerror = null; 
                                        }} 
                                      />
                                    ) : isNote ? (
                                      <div className="flex flex-col items-center justify-center p-2 w-full h-full bg-yellow-50/90 border-b-[3px] border-yellow-300">
                                        <span className="text-[20px]">📝</span>
                                        <span className="text-[9px] font-bold text-gray-700 leading-tight text-center line-clamp-2 w-full mt-1 px-1">{item.mockup}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] font-bold text-gray-600 text-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">No Img<br/>Mockup</span>
                                    )}
                                  </div>

                                  {isValidUrl ? (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                        <img src={convertGoogleDriveUrl(item.mockup)} alt="Preview" className="w-auto h-auto max-w-[200px] object-contain rounded-lg" style={{ backgroundColor: getStandardColor(item.color) }} onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; e.currentTarget.onerror = null; }} />
                                      </div>
                                    </div>
                                  ) : isNote && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-yellow-50 p-3 rounded-xl shadow-xl ring-1 ring-yellow-300 min-w-[150px] max-w-[250px]">
                                        <div className="text-[11px] font-bold text-yellow-800 mb-1.5 uppercase border-b border-yellow-200 pb-1">Ghi chú (Mockup):</div>
                                        <p className="text-[12px] text-gray-800 whitespace-pre-wrap">{item.mockup}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <label className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Mockup SP</label>
                            <input disabled={isReadOnly} placeholder="Nhập Link Mockup..." value={item.mockup || ''} onChange={(e) => { const n = [...editForm.items]; n[index] = { ...n[index], mockup: e.target.value }; setEditForm({ ...editForm, items: n }); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"/>
                          </div>
                        </div>
                      </div>

                      {/* HÀNG 4: Extra Print Areas */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Các vùng in tùy chọn (Tay áo, Cổ, Nhãn...)</label>
                          {!isReadOnly && (
                            <button type="button" onClick={() => { const newItems = [...editForm.items]; const currentAreas = Array.isArray(newItems[index].extra_print_areas) ? newItems[index].extra_print_areas : []; newItems[index] = { ...newItems[index], extra_print_areas: [...currentAreas, { name: '', url: '' }] }; setEditForm({ ...editForm, items: newItems }); }} className="text-[10px] bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 font-bold hover:bg-gray-200 transition">
                              + Thêm vùng in
                            </button>
                          )}
                        </div>
                        {Array.isArray(item.extra_print_areas) && item.extra_print_areas.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {item.extra_print_areas.map((area: any, aIdx: number) => (
                              <div key={aIdx} className="flex gap-3 bg-gray-50/80 p-3 rounded-2xl ring-1 ring-gray-100 relative group/extra transition-all hover:bg-white hover:shadow-md">
                                <div className="relative group/img shrink-0">
                                  {(() => {
                                    const isValidUrl = isValidImageUrl(area.url);
                                    const isNote = area.url && !isValidUrl;

                                    return (
                                      <>
                                        <div 
                                          className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center overflow-hidden cursor-help border border-gray-200 transition-colors duration-300 relative"
                                          style={{ backgroundColor: getStandardColor(item.color) }}
                                        >
                                          {isValidUrl ? (
                                            <img 
                                              src={convertGoogleDriveUrl(area.url)} 
                                              className="w-full h-full object-contain p-1" 
                                              onError={(e) => { 
                                                e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; 
                                                e.currentTarget.onerror = null; 
                                              }} 
                                            />
                                          ) : isNote ? (
                                            <div className="flex flex-col items-center justify-center w-full h-full bg-yellow-50/90 border-b-2 border-yellow-300">
                                              <span className="text-[12px]">📝</span>
                                            </div>
                                          ) : (
                                            <span className="text-[8px] font-bold text-gray-600 bg-white/80 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm">No Img</span>
                                          )}
                                        </div>
                                        {isValidUrl ? (
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                            <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                              <img src={convertGoogleDriveUrl(area.url)} className="w-auto h-auto max-w-[200px] object-contain rounded-lg" style={{ backgroundColor: getStandardColor(item.color) }} onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image'; e.currentTarget.onerror = null; }} />
                                            </div>
                                          </div>
                                        ) : isNote && (
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                            <div className="bg-yellow-50 p-2.5 rounded-xl shadow-xl ring-1 ring-yellow-300 min-w-[120px]">
                                              <div className="text-[10px] font-bold text-yellow-800 mb-1 uppercase border-b border-yellow-200 pb-1">Ghi chú:</div>
                                              <p className="text-[11px] text-gray-800 whitespace-pre-wrap">{area.url}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-1.5">
                                  <input disabled={isReadOnly} placeholder="Tên (VD: Left Sleeve)" value={area.name || ''} onChange={(e) => { const n = [...editForm.items]; n[index].extra_print_areas[aIdx].name = e.target.value; setEditForm({ ...editForm, items: n }); }} className="w-full bg-white ring-1 ring-gray-200 p-1.5 rounded-md text-[10px] font-bold text-gray-800 outline-none focus:ring-1 focus:ring-gray-400" />
                                  <input disabled={isReadOnly} placeholder="Link Design URL..." value={area.url || ''} onChange={(e) => { const n = [...editForm.items]; n[index].extra_print_areas[aIdx].url = e.target.value; setEditForm({ ...editForm, items: n }); }} className="w-full bg-white ring-1 ring-gray-200 p-1.5 rounded-md text-[10px] text-gray-700 outline-none focus:ring-1 focus:ring-gray-400" />
                                </div>
                                {!isReadOnly && <button type="button" onClick={() => { const n = [...editForm.items]; n[index].extra_print_areas = n[index].extra_print_areas.filter((_: any, i: number) => i !== aIdx); setEditForm({ ...editForm, items: n }); }} className="absolute -top-2 -right-2 bg-red-100 text-red-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-500 hover:text-white transition opacity-0 group-hover/extra:opacity-100 shadow-sm">✕</button>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* HÀNG 5: GHI CHÚ RIÊNG CHO SẢN PHẨM */}
                      <div className="pt-4 border-t border-gray-100 mt-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">
                          Ghi chú riêng cho sản phẩm này
                        </label>
                        <textarea
                          disabled={isReadOnly}
                          placeholder="Nhập yêu cầu đặc biệt (VD: In lệch trái, viền mỏng, chú ý màu sắc...)"
                          value={item.note || ''}
                          onChange={(e) => {
                            const newItems = [...editForm.items];
                            newItems[index] = { ...newItems[index], note: e.target.value };
                            setEditForm({ ...editForm, items: newItems });
                          }}
                          className="w-full bg-yellow-50/30 ring-1 ring-yellow-200/60 p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-yellow-50 text-gray-800 transition-all min-h-[60px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KHỐI 3: GHI CHÚ */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
                <label className="text-[10px] font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Ghi chú đơn hàng
                </label>
                <textarea disabled={isReadOnly} placeholder="Thêm ghi chú đặc biệt cho xưởng..." value={editForm.order_note || ''} onChange={(e) => setEditForm({...editForm, order_note: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all h-24 disabled:opacity-60 resize-none"/>
              </div>

            </div>

            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-4 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <button onClick={() => setEditingIndex(null)} className="px-8 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors">
                {isReadOnly ? 'Đóng' : 'Hủy bỏ'}
              </button>
              {!isReadOnly && (
                <button onClick={handleSaveEdit} className="bg-[#C29017] text-white px-10 py-3 rounded-2xl font-bold shadow-[0_8px_20px_-6px_rgba(194,144,23,0.5)] hover:bg-[#a67b13] hover:shadow-[0_10px_25px_-6px_rgba(194,144,23,0.6)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Lưu thay đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {selectedRows.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(194,144,23,0.3)] z-[60] flex items-center gap-6 border border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center bg-[#C29017] text-white w-6 h-6 rounded-full text-xs font-bold animate-pulse shadow-[0_0_10px_#C29017]">
              {selectedRows.length}
            </span>
            <span className="font-semibold text-sm">đơn được chọn</span>
          </div>
          
          <div className="w-px h-6 bg-gray-700"></div>
          
          <div className="flex gap-2">
            {activeTab === 'import' ? (
              <button onClick={handleBulkDeleteImport} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg">
                Xóa khỏi danh sách
              </button>
            ) : (
              <>
                {selectedRows.some(id => {
                  const order = dbOrders.find(o => o.id === id);
                  return order && (!order.status || order.status === 'pending');
                }) && (
                  <button 
                    onClick={handlePayOrders} 
                    disabled={isAddingToPay} 
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                  >
                    {isAddingToPay ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : ''}
                    Thanh toán
                  </button>
                )}
                
                {(() => {
                  const hasUncancellable = selectedRows.some(id => {
                    const order = dbOrders.find(o => o.id === id);
                    return order && ['processing', 'in_transit', 'done', 'cancelled'].includes(order.status);
                  });

                  return (
                    <button 
                      onClick={() => handleBulkActionDB('cancel')} 
                      disabled={hasUncancellable}
                      title={hasUncancellable ? "Có đơn đã duyệt sản xuất, không thể hủy" : "Hủy đơn hàng"}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg flex items-center gap-1.5 ${
                        hasUncancellable 
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed shadow-none" 
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Hủy đơn hàng
                    </button>
                  );
                })()}
                <button 
                  onClick={() => { setSupportType('resent'); setIsSupportModalOpen(true); }}
                  className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg text-xs font-bold text-gray-900 transition flex items-center gap-1.5"
                >
                  🛠 Yêu cầu Hỗ trợ
                </button>
              </>
            )}
            <button onClick={() => setSelectedRows([])} className="bg-transparent hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-xs font-bold transition">
              ✖ Đóng
            </button>
          </div>
        </div>
      )}
      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleConfirmSupport} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-extrabold text-base text-gray-900">Tạo yêu cầu Hỗ trợ / Khiếu nại</h3>
              <p className="text-xs text-gray-500 mt-1">Áp dụng cho hành động hàng loạt trên {selectedRows.length} đơn hàng.</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hình thức yêu cầu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSupportType('resent')} className={`p-2.5 rounded-xl border font-bold text-xs text-center transition ${supportType === 'resent' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-white text-gray-600'}`}>Hỗ trợ đi lại (Reship)</button>
                  <button type="button" onClick={() => setSupportType('refund')} className={`p-2.5 rounded-xl border font-bold text-xs text-center transition ${supportType === 'refund' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white text-gray-600'}`}>Yêu cầu Hoàn tiền</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lý do chi tiết *</label>
                <textarea 
                  required
                  rows={3}
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                  placeholder="Ví dụ: Hàng lỗi rách áo, ship sai size, khách không nhận do giao muộn..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-xs outline-none focus:border-gray-900 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đường dẫn ảnh minh chứng (URL)</label>
                <input 
                  type="text"
                  value={supportImage}
                  onChange={(e) => setSupportImage(e.target.value)}
                  placeholder="Dán link ảnh chụp lỗi sản phẩm tại đây..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-xs outline-none focus:border-gray-900 text-gray-800"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setIsSupportModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Đóng</button>
              <button type="submit" disabled={isSubmittingSupport} className="px-5 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                {isSubmittingSupport ? "Đang xử lý..." : "Gửi yêu cầu"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ================================================= */}
      {/* MODAL TẠO ĐƠN HÀNG LẺ (MANUAL ORDER) */}
      {/* ================================================= */}
      {isCreateModalOpen && createForm && (
        <div className="fixed inset-0 bg-gray-900/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateSubmit} className="bg-slate-50 rounded-[2rem] shadow-2xl w-[75vw] max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
            
            <div className="px-8 py-5 border-b border-gray-200/60 flex justify-between items-center bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <h3 className="font-extrabold text-gray-800 text-xl">Tạo đơn hàng mới</h3>
              </div>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG */}
              <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Cá nhân</h4>
                  <input required placeholder="Họ và tên khách hàng *" value={createForm.customer_name} onChange={(e) => setCreateForm({...createForm, customer_name: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Email" type="email" value={createForm.customer_email} onChange={(e) => setCreateForm({...createForm, customer_email: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                    <input placeholder="Số điện thoại" value={createForm.customer_phone} onChange={(e) => setCreateForm({...createForm, customer_phone: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Giao hàng</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Địa chỉ 1 *" value={createForm.shipping_address.line_1} onChange={(e) => setCreateForm({...createForm, shipping_address: {...createForm.shipping_address, line_1: e.target.value}})} className="col-span-2 w-full bg-gray-50 ring-1 ring-gray-200/60 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"/>
                    <input placeholder="Địa chỉ 2" value={createForm.shipping_address.line_2} onChange={(e) => setCreateForm({...createForm, shipping_address: {...createForm.shipping_address, line_2: e.target.value}})} className="col-span-2 w-full bg-gray-50 ring-1 ring-gray-200/60 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"/>
                    <input required placeholder="Thành phố *" value={createForm.shipping_address.city} onChange={(e) => setCreateForm({...createForm, shipping_address: {...createForm.shipping_address, city: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"/>
                    <input required placeholder="Bang/Vùng *" value={createForm.shipping_address.region} onChange={(e) => setCreateForm({...createForm, shipping_address: {...createForm.shipping_address, region: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"/>
                    <input required placeholder="Mã Zip *" value={createForm.shipping_address.zip} onChange={(e) => setCreateForm({...createForm, shipping_address: {...createForm.shipping_address, zip: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"/>
                    <input required placeholder="Quốc gia (Mặc định: US) *" value={createForm.shipping_address.country} onChange={(e) => setCreateForm({...createForm, shipping_address: {...createForm.shipping_address, country: e.target.value}})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"/>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: SẢN PHẨM & DESIGN */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C29017]"></span> Sản phẩm trong đơn
                  </h4>
                  <button type="button" onClick={() => setCreateForm({ ...createForm, items: [...createForm.items, { type: '', color: '', size: '', quantity: 1, sku: '', design_front: '', design_back: '', mockup: '', note: '', extra_print_areas: [] }] })} className="text-xs bg-white shadow-sm ring-1 ring-gray-200 px-3 py-1.5 rounded-lg text-gray-700 font-bold hover:text-blue-600 transition-all">
                    + Thêm sản phẩm
                  </button>
                </div>
                
                {createForm.items.map((item: any, index: number) => {
                  const selectedBlank = podBlanks.find(b => b.name === item.type);
                  const parseArraySafe = (data: any) => { if (Array.isArray(data)) return data; if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } } return []; };
                  const availableColors = parseArraySafe(selectedBlank?.colors);
                  const availableSizes = parseArraySafe(selectedBlank?.sizes);

                  return (
                    <div key={index} className="bg-white p-5 rounded-[1.5rem] shadow-sm ring-1 ring-gray-100 flex flex-col gap-4 relative">
                      {createForm.items.length > 1 && (
                        <button type="button" onClick={() => setCreateForm({ ...createForm, items: createForm.items.filter((_: any, i: number) => i !== index) })} className="absolute top-4 right-4 text-[10px] text-red-500 bg-red-50 px-2.5 py-1 rounded-md hover:bg-red-500 hover:text-white font-bold transition-all">
                          ✕ Xóa
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-16">
                        <div className="col-span-2">
                          <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">Loại sản phẩm (Phôi) *</label>
                          <SearchableDropdown value={item.type || ''} placeholder="Chọn sản phẩm..." options={podBlanks} onChange={(val) => { const n = [...createForm.items]; n[index].type = val; setCreateForm({ ...createForm, items: n }); }} />
                        </div>
                        <div className="flex gap-2 col-span-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">Màu (Tùy chọn)</label>
                            <select value={item.color || ''} onChange={(e) => { const n = [...createForm.items]; n[index].color = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">-- Không chọn --</option>
                              {availableColors.map((c: string) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">Size (Tùy chọn)</label>
                            <select value={item.size || ''} onChange={(e) => { const n = [...createForm.items]; n[index].size = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">-- Không chọn --</option>
                              {availableSizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="w-16">
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">SL *</label>
                            <input type="number" min="1" value={item.quantity} onChange={(e) => { const n = [...createForm.items]; n[index].quantity = parseInt(e.target.value) || 1; setCreateForm({ ...createForm, items: n }); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold text-[#C29017]"/>
                          </div>
                        </div>
                      </div>

                      {/* KHỐI NHẬP LINK VÀ HIỂN THỊ ẢNH TRỰC QUAN */}
                      <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl ring-1 ring-gray-200/50">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                          <div className="col-span-1 flex flex-col justify-center">
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">Mã SKU (Đồng bộ thư viện)</label>
                            <SkuCombobox
                              value={item.sku || ''}
                              options={sellerDesigns}
                              onChange={(val) => { const n = [...createForm.items]; n[index].sku = val; setCreateForm({ ...createForm, items: n }); }}
                              onSelect={(d) => {
                                const n = [...createForm.items];
                                n[index] = { ...n[index], sku: d.sku, design_front: d.design_front_url || n[index].design_front, design_back: d.design_back_url || n[index].design_back, mockup: d.mockup_url || n[index].mockup, extra_print_areas: d.extra_print_areas || n[index].extra_print_areas };
                                setCreateForm({ ...createForm, items: n });
                              }}
                            />
                          </div>

                          <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* KHỐI FRONT */}
                            <div className="flex items-start gap-2 bg-white ring-1 ring-gray-200 p-2 rounded-xl shadow-sm focus-within:ring-blue-400 transition-all">
                              <div className="w-12 h-12 shrink-0 rounded-lg shadow-inner border border-gray-100 flex items-center justify-center overflow-hidden" style={{ backgroundColor: getStandardColor(item.color) }}>
                                {isValidImageUrl(item.design_front) ? (
                                  <img src={convertGoogleDriveUrl(item.design_front)} className="w-full h-full object-contain p-0.5" alt="Front" />
                                ) : <span className="text-[8px] font-bold text-gray-400">Trống</span>}
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-1 mt-0.5">
                                <label className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider">Link Front</label>
                                <input type="text" placeholder="Dán link ảnh mặt trước..." value={item.design_front} onChange={(e) => { const n = [...createForm.items]; n[index].design_front = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full text-[10px] outline-none bg-transparent text-gray-700 placeholder-gray-300"/>
                              </div>
                            </div>

                            {/* KHỐI BACK */}
                            <div className="flex items-start gap-2 bg-white ring-1 ring-gray-200 p-2 rounded-xl shadow-sm focus-within:ring-purple-400 transition-all">
                              <div className="w-12 h-12 shrink-0 rounded-lg shadow-inner border border-gray-100 flex items-center justify-center overflow-hidden" style={{ backgroundColor: getStandardColor(item.color) }}>
                                {isValidImageUrl(item.design_back) ? (
                                  <img src={convertGoogleDriveUrl(item.design_back)} className="w-full h-full object-contain p-0.5" alt="Back" />
                                ) : <span className="text-[8px] font-bold text-gray-400">Trống</span>}
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-1 mt-0.5">
                                <label className="text-[9px] text-purple-600 font-extrabold uppercase tracking-wider">Link Back</label>
                                <input type="text" placeholder="Dán link ảnh mặt sau..." value={item.design_back} onChange={(e) => { const n = [...createForm.items]; n[index].design_back = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full text-[10px] outline-none bg-transparent text-gray-700 placeholder-gray-300"/>
                              </div>
                            </div>

                            {/* KHỐI MOCKUP */}
                            <div className="flex items-start gap-2 bg-white ring-1 ring-gray-200 p-2 rounded-xl shadow-sm focus-within:ring-teal-500 transition-all">
                              <div className="w-12 h-12 shrink-0 rounded-lg shadow-inner border border-gray-100 flex items-center justify-center overflow-hidden" style={{ backgroundColor: getStandardColor(item.color) }}>
                                {isValidImageUrl(item.mockup) ? (
                                  <img src={convertGoogleDriveUrl(item.mockup)} className="w-full h-full object-cover" alt="Mockup" />
                                ) : <span className="text-[8px] font-bold text-gray-400">Trống</span>}
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-1 mt-0.5">
                                <label className="text-[9px] text-teal-600 font-extrabold uppercase tracking-wider">Link Mockup</label>
                                <input type="text" placeholder="Dán link ảnh Mockup..." value={item.mockup} onChange={(e) => { const n = [...createForm.items]; n[index].mockup = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full text-[10px] outline-none bg-transparent text-gray-700 placeholder-gray-300"/>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ========================================= */}
                        {/* KHU VỰC VÙNG IN PHỤ (EXTRA PRINT AREAS) */}
                        {/* ========================================= */}
                        <div className="mt-2 pt-4 border-t border-gray-200/60">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Các vùng in phụ (Tay áo, Cổ...)</label>
                            <button type="button" onClick={() => { const n = [...createForm.items]; n[index].extra_print_areas = [...(n[index].extra_print_areas || []), { name: '', url: '' }]; setCreateForm({ ...createForm, items: n }); }} className="text-[10px] bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-200 transition-colors">
                              + Thêm vùng in
                            </button>
                          </div>
                          
                          {item.extra_print_areas && item.extra_print_areas.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                              {item.extra_print_areas.map((area: any, aIdx: number) => (
                                <div key={aIdx} className="flex items-center gap-3 bg-white ring-1 ring-purple-100 p-2 rounded-xl relative group/extra shadow-sm hover:shadow-md transition-all">
                                  <div className="w-10 h-10 shrink-0 rounded-lg shadow-inner border border-gray-100 flex items-center justify-center overflow-hidden" style={{ backgroundColor: getStandardColor(item.color) }}>
                                    {isValidImageUrl(area.url) ? (
                                      <img src={convertGoogleDriveUrl(area.url)} className="w-full h-full object-contain p-0.5" alt="Extra Area" />
                                    ) : <span className="text-[7px] font-bold text-gray-400">Trống</span>}
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1.5">
                                    <input placeholder="Tên vị trí (VD: Left Sleeve)" value={area.name} onChange={(e) => { const n = [...createForm.items]; n[index].extra_print_areas[aIdx].name = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full text-[10px] font-bold text-gray-700 outline-none bg-transparent placeholder-gray-400 border-b border-gray-100 focus:border-purple-300 pb-0.5"/>
                                    <input placeholder="Dán link ảnh..." value={area.url} onChange={(e) => { const n = [...createForm.items]; n[index].extra_print_areas[aIdx].url = e.target.value; setCreateForm({ ...createForm, items: n }); }} className="w-full text-[9px] outline-none bg-transparent text-purple-600 placeholder-purple-300"/>
                                  </div>
                                  <button type="button" onClick={() => { const n = [...createForm.items]; n[index].extra_print_areas = n[index].extra_print_areas.filter((_: any, i: number) => i !== aIdx); setCreateForm({ ...createForm, items: n }); }} className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-500 hover:text-white transition-colors shadow-sm opacity-0 group-hover/extra:opacity-100">
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KHỐI 3: GHI CHÚ */}
              <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-gray-100">
                <label className="text-[10px] font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Ghi chú gửi xưởng
                </label>
                <textarea placeholder="Ghi chú về đóng gói, ship hàng..." value={createForm.order_note} onChange={(e) => setCreateForm({...createForm, order_note: e.target.value})} className="w-full bg-gray-50 ring-1 ring-gray-200/60 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"/>
              </div>

            </div>

            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 z-10">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Hủy</button>
              <button type="submit" disabled={isSubmittingCreate} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
                {isSubmittingCreate ? 'Đang tạo đơn...' : 'Xác nhận lên đơn'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
