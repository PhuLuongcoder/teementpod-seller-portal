'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import api from '@/lib/axios';
import { useShop } from '@/context/ShopContext';
import { SquareTwoStack } from "@medusajs/icons"
import { useConfirm } from '@/context/ConfirmContext';

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

  // Fix lỗi crash: dùng optional chaining thay vì gọi thẳng .toLowerCase()
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
      {/* SEARCH BOX — luôn hiển thị, tách biệt hoàn toàn */}
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

        {/* PILL — hiện tên đang chọn, tách biệt khỏi search box */}
        {value && (
          <div className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-500 shrink-0 max-w-[160px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="truncate">{value}</span>
          </div>
        )}
      </div>

      {/* RESULTS PANEL — chỉ chứa danh sách, không lẫn search box */}
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
  onChange: (newSku: string) => void;
  onSelect: (design: any) => void;
}

const SkuCombobox = ({ value, options, disabled, onChange, onSelect }: SkuComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    (opt.sku || '').toLowerCase().includes((value || '').toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onChange(e.target.value); // Vẫn cho phép gõ SKU mới bình thường
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Nhập mã mới hoặc tìm SKU có sẵn..."
        className="w-full border p-1.5 px-3 rounded-lg text-xs bg-gray-50 outline-none focus:border-[#C29017] disabled:bg-gray-100 transition-colors"
      />
      
      {/* Khung gợi ý thiết kế có sẵn */}
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div className="absolute z-[999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <div
              key={opt.id}
              onMouseDown={(e) => {
                e.preventDefault(); // Chặn mất focus để onClick hoạt động mượt mà
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
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});
  // ==========================================
  // 1. STATE QUẢN LÝ
  // ==========================================
  const [sellerDesigns, setSellerDesigns] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [importOrders, setImportOrders] = useState<any[]>([]);
  const [podBlanks, setPodBlanks] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingToPay, setIsAddingToPay] = useState(false);
  
  const [message, setMessage] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Import tab pagination
  const [importCurrentPage, setImportCurrentPage] = useState(1);
  const IMPORT_PAGE_SIZE = 20;
  //Export
  const [isExporting, setIsExporting] = useState(false);
  
  // Modal State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSource, setEditSource] = useState<'db' | 'import'>('import');
  const [editForm, setEditForm] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [specialPrintsForm, setSpecialPrintsForm] = useState<{name: string, url: string}[]>([]);
  const [mockupsForm, setMockupsForm] = useState<{name: string, url: string}[]>([]);
  // State phục vụ popup Hỗ trợ / Khiếu nại
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportType, setSupportType] = useState<'resent' | 'refund'>('resent');
  const [supportReason, setSupportReason] = useState('');
  const [supportImage, setSupportImage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  // THÊM: State theo dõi trạng thái đồng bộ SKU
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
        
        // THÊM res.data?.catalog VÀO ĐÂY
        const fetchedData = res.data?.catalog || res.data?.pod_blanks || res.data?.podBlanks || res.data?.data;
        
        // CHỐT CHẶN AN TOÀN: Đảm bảo biến podBlanks luôn luôn là một Array (Mảng)
        setPodBlanks(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (error) {
        console.error("Lỗi lấy danh sách Phôi:", error);
        setPodBlanks([]); // Ép về mảng rỗng nếu API lỗi để tránh sập trang
      }
    };
    if (selectedShopId) fetchPodBlanks();
  }, [selectedShopId]);
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await api.get('/partner/designs', { 
          params: { shop_id: selectedShopId, limit: 2000 } // Tải tối đa 2000 design gần nhất
        });
        setSellerDesigns(res.data.designs || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách Design:", error);
      }
    };
    if (selectedShopId) fetchDesigns();
  }, [selectedShopId]);
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
    // Adjust page after bulk delete
    const newTotalPages = Math.max(1, Math.ceil(remaining.length / IMPORT_PAGE_SIZE));
    setImportCurrentPage(prev => Math.min(prev, newTotalPages));
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
    // THÊM KIỂM TRA CHẶN: Nếu có đơn đã vào chu trình sản xuất hoặc giao hàng
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

    // 1. TÌM VÀ LỌC CÁC ĐƠN HỢP LỆ (Đã map đủ Type, Color, Size)
    const selectedOrderDetails = dbOrders.filter(order => selectedRows.includes(order.id));
    
    const validOrders = selectedOrderDetails.filter(order => {
      if (!order.items || order.items.length === 0) return false;
      return order.items.every((item: any) => item.type && item.color && item.size);
    });

    const invalidCount = selectedRows.length - validOrders.length;

    if (validOrders.length === 0) {
      return alert("Tất cả các đơn bạn chọn đều chưa được map Phôi/Màu/Size. Vui lòng bấm 'Sửa' từng đơn để chọn sản phẩm trước khi thanh toán!");
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

      const validPendingOrders = pendingOrders.filter((order: any) => {
        if (!order.items || order.items.length === 0) return false;
        return order.items.every((item: any) => item.type && item.color && item.size);
      });

      const invalidCount = pendingOrders.length - validPendingOrders.length;

      if (validPendingOrders.length === 0) {
        notify(`Có ${invalidCount} đơn pending nhưng TẤT CẢ đều chưa cấu hình Phôi/Màu/Size. Giao dịch đã bị hủy!`);
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

    // file/d/
    const fileMatch = url.match(/\/file\/d\/([^\/]+)/);

    if (fileMatch?.[1]) {
      return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
    }

    // open?id=
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
      setDbOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.count);
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
      const params: any = { shop_id: selectedShopId };
      
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
        "Print area front", "Print area back", "Mockup Front", "Extra Print Areas", "Tracking", "Status"
      ];
      
      const csvRows: string[] = [];

      ordersToExport.forEach((order: any) => {
        const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString('en-US') : '';
        
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
          // Bóc tách mảng extra_print_areas thành chuỗi string
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
            `"${(order.tracking_number || '').replace(/"/g, '""')}"`,
            `"${statusText}"`
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
        
        // Cập nhật: Ép kiểu results.data về mảng các object (any[]) để vượt qua bài kiểm tra của TypeScript
        const parsedData = results.data as any[];

        // NHẬN DIỆN THÔNG MINH: Nếu file có cột 'Ship Name', đó chắc chắn là file xuất từ Etsy
        const isEtsyFormat = parsedData.length > 0 && parsedData[0].hasOwnProperty('Ship Name');

        parsedData.forEach((row: any) => {
          const orderId = sanitizeText(row['Order ID']);
          if (!orderId) return; // Nếu dòng không có mã đơn thì bỏ qua

          // Các biến tạm để chứa dữ liệu chung sau khi phân loại
          let rawType = '', rawColor = '', rawSize = '', rawQuantity = 1, rawSku = '';
          let name = '', line1 = '', line2 = '', city = '', region = '', zip = '', country = 'US';
          let designFront = '', designBack = '', mockup = '';
          let tracking = '';
          let originalString = '';

          if (isEtsyFormat) {
            // ==========================================
            // 1. MAPPING CHO FILE ETSY
            // ==========================================
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

            // Tách Size và Color từ cột Variations ("SIZE:Blouse-L,Color:Yellow")
            const variations = row['Variations'] || '';
            // Regex bắt chữ SIZE: hoặc Size:
            const sizeMatch = variations.match(/SIZE:\s*([^,]+)/i) || variations.match(/Size:\s*([^,]+)/i);
            // Regex bắt chữ Color:
            const colorMatch = variations.match(/Color:\s*([^,]+)/i);
            
            rawSize = sizeMatch ? sizeMatch[1].trim() : '';
            rawColor = colorMatch ? colorMatch[1].trim() : '';
            
            // Etsy không có trường Type riêng lẻ, cắt tạm đoạn đầu của Item Name để làm Type
            rawType = row['Item Name'] ? row['Item Name'].split(',')[0].trim() : '';
            
            // Design Links để trống hoàn toàn để seller tự bổ sung tay sau trên UI
            designFront = '';
            designBack = '';
            mockup = '';
            const itemName = row['Item Name'] || '';
            originalString = `Etsy: ${itemName} | ${variations}`.trim();
            
          } else {
            // ==========================================
            // 2. MAPPING CHO FILE TRUYỀN THỐNG (Team Mr.Khoa)
            // ==========================================
            const keys = Object.keys(row);
            // Tìm cột Address line 2 vì CSV hay bị lỗi thụt dòng chữ 'line 2'
            const addr2Key = keys.find(k => k.toLowerCase().includes('line 2')) || 'Address line 2';
            
            name = row['Name']?.trim() || '';
            line1 = row['Address line 1']?.trim() || '';
            line2 = row[addr2Key]?.trim() || '';
            city = row['City']?.trim() || '';
            region = row['Region']?.trim() || '';
            zip = row['Zip']?.trim() || '';
            country = row['Country']?.trim() || 'US'; // Mặc định US vì file Khoa không có cột Country
            
            rawType = row['Type'] || '';
            rawColor = row['Color'] || '';
            rawSize = row['Size'] || '';
            rawQuantity = parseInt(row['Quantity']) || 1;
            rawSku = row['SKU'] || row['Design SKU'] || '';
            tracking = row['Tracking'] || '';
            
            designFront = row['Print area front']?.trim() || '';
            designBack = row['Print area back']?.trim() || '';
            mockup = row['Mockup Front']?.trim() || '';
            const fullType = row['Full Type'] || row['Full type'] || '';
            originalString = fullType 
              ? `Hệ thống: ${fullType}` 
              : `Loại: ${rawType}, Màu: ${rawColor}, Size: ${rawSize}`;
            
          }
          
          // ==========================================
          // 3. ĐÓNG GÓI CHUẨN HÓA VÀ GỘP ĐƠN
          // ==========================================
          // Áp dụng hàm sanitizeText cho các trường quan trọng (giữ nguyên logic gốc)
          const newItem = {
            sku: sanitizeText(rawSku),
            type: sanitizeText(rawType),  
            color: sanitizeText(rawColor), 
            size: sanitizeText(rawSize),
            quantity: rawQuantity,
            design_front: designFront,
            design_back: designBack,
            mockup: mockup,
            extra_print_areas: [],
            original_string: originalString
          };

          if (ordersMap.has(orderId)) {
            // Đã có mã đơn này -> Nhét thêm sản phẩm vào mảng items (Gộp đơn)
            const existingOrder = ordersMap.get(orderId);
            existingOrder.items.push(newItem);
          } else {
            // Chưa có -> Tạo mới order
            ordersMap.set(orderId, {
              external_order_id: orderId,
              tracking_number: sanitizeText(tracking),
              order_date: new Date().toISOString(),
              customer_name: sanitizeText(name),
              customer_email: '', customer_phone: '',
              shipping_address: {
                line_1: line1, 
                line_2: line2,
                city: city, 
                region: region, 
                zip: zip, 
                country: country
              },
              items: [newItem],
              product_type: sanitizeText(rawType), 
              order_price: 0, 
              order_note: '', 
              status: 'pending' // Chờ update design
            });
          }
        });

        const finalOrders = Array.from(ordersMap.values()).map(order => ({
          ...order,
          product_type: order.items.length > 1 
            ? `${order.items[0].type} (+${order.items.length - 1} món khác)` 
            : order.items[0].type
        }));

        setImportOrders(finalOrders);
        setImportCurrentPage(1);
        setMessage(`Đã chuẩn bị ${finalOrders.length} đơn hàng từ file CSV (đã gộp các đơn trùng ID).`);
      }
    });
    event.target.value = '';
  };

  // ==========================================
  // LOGIC ĐỒNG BỘ SKU 
  // ==========================================
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
        // Tự động kéo luôn các vùng in tùy chọn từ thư viện
        const libraryExtraAreas = exactMatch.extra_print_areas || [];

        newItems[itemIndex] = {
          ...newItems[itemIndex],
          design_front: exactMatch.design_front_url || newItems[itemIndex].design_front,
          design_back: exactMatch.design_back_url || newItems[itemIndex].design_back,
          mockup: exactMatch.mockup_url || newItems[itemIndex].mockup,
          extra_print_areas: libraryExtraAreas.length > 0 ? libraryExtraAreas : newItems[itemIndex].extra_print_areas
        };
        setEditForm({ ...editForm, items: newItems });
        notify(`🎉 Đã đồng bộ thiết kế thành công cho SKU: ${sku}`);
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
    
    // Parse thêm field `sku` vào item
    const normalizeItem = (item: any) => ({
      sku: item.sku || '',
      type: item.type || '',
      color: item.color || '',
      size: item.size || '',
      quantity: item.quantity || 1,
      design_front: item.design_front || '',
      design_back: item.design_back || '',
      mockup: item.mockup || '',
      extra_print_areas: Array.isArray(item.extra_print_areas) ? item.extra_print_areas : [],
      original_string: item.original_string || '',
    });

    let itemsArray: any[] = [];

    if (source === 'import') {
      itemsArray = Array.isArray(order.items) ? order.items.map(normalizeItem) : [];
    } else {
      if (Array.isArray(order.items) && order.items.length > 0) {
        itemsArray = order.items.map(normalizeItem);
      } else if (Array.isArray(parsedProductDetail)) {
        itemsArray = parsedProductDetail.map(normalizeItem);
      } else if (parsedProductDetail && Array.isArray(parsedProductDetail.items)) {
        itemsArray = parsedProductDetail.items.map(normalizeItem);
      } else {
        const pt = parsedProductDetail && typeof parsedProductDetail === 'object' ? parsedProductDetail : {};
        itemsArray = [{
          sku: pt.sku || order.sku || '',
          type: pt.type || order.product_type || '',
          color: pt.color || '',
          size: pt.size || '',
          quantity: pt.quantity || 1,
          design_front: pt.design_front || order.design_front_url || '',
          design_back: pt.design_back || order.design_back_url || '',
          mockup: pt.mockup || '',
          extra_print_areas: [],
        }];
      }
    }

    const safeOrder = {
      ...order,
      shipping_address: parsedAddress,
      items: itemsArray,
    };
    
    setEditForm(safeOrder);

    const parseToList = (f: any) => {
      try {
        const obj = typeof f === 'string' ? JSON.parse(f) : f;
        return obj ? Object.entries(obj).map(([n, u]) => ({ name: n, url: u as string })) : [];
      } catch { return []; }
    };
    setSpecialPrintsForm(parseToList(order.special_print_areas));
    setMockupsForm(parseToList(order.mockup_urls));
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;

    const spObj: any = {};
    specialPrintsForm.forEach(i => { if (i.name.trim()) spObj[i.name.trim()] = i.url; });
    const muObj: any = {};
    mockupsForm.forEach(i => { if (i.name.trim()) muObj[i.name.trim()] = i.url; });

    const items = editForm.items || [];
    const newProductType = items.length > 1
      ? `${items[0]?.type} (+${items.length - 1} món khác)`
      : (items[0]?.type || '');

    // 3. TÍNH TOÁN LẠI GIÁ TIỀN
    let tempOrderPrice = 0;
    items.forEach((it: any) => {
      const blank = podBlanks.find(b => b.name === it.type);
      if (blank && blank.display_price) {
        tempOrderPrice += blank.display_price * (it.quantity || 1);
      }
    });

    // Cập nhật state nội bộ
    const updatedOrderData = { 
      ...editForm, 
      product_type: newProductType,
      order_price: tempOrderPrice > 0 ? tempOrderPrice : editForm.order_price,
      special_print_areas: Object.keys(spObj).length > 0 ? spObj : null,
      mockup_urls: Object.keys(muObj).length > 0 ? muObj : null,
      product_detail: JSON.stringify(items) // <--- THÊM DÒNG NÀY ĐỂ ÉP KIỂU ITEMS THÀNH CHUỖI JSON
    };

    if (editSource === 'import') {
      const updated = [...importOrders];
      updated[editingIndex] = updatedOrderData;
      setImportOrders(updated);
      setEditingIndex(null); 
    } else if (editSource === 'db') {
      try {
        // Cập nhật giao diện ngay lập tức (Optimistic UI)
        const newDbOrders = [...dbOrders];
        newDbOrders[editingIndex] = updatedOrderData;
        setDbOrders(newDbOrders);

        // Tạo payload chuẩn hóa cho Backend (Loại bỏ mảng items để tránh lỗi giống lúc Sync Import)
        const payloadForApi = {
          ...updatedOrderData,
          items: undefined 
        };

        await api.post('/partner/orders', { 
          orders: [payloadForApi], // <--- GỬI PAYLOAD ĐÃ CHUẨN HÓA LÊN BACKEND
          target_shop_id: selectedShopId 
        });
        
        notify("Lưu thay đổi thành công!");
        fetchOrdersFromDB(); 
        setEditingIndex(null);
      } catch (err: any) {
        alert(err.response?.data?.error || "Lỗi lưu dữ liệu.");
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
        items: undefined 
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

  const OrderTable = ({ data, isImport = false, pageOffset = 0 }: { data: any[], isImport?: boolean, pageOffset?: number }) => {
    
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

    const allPageRowIds = data.map((order, idx) => isImport ? (pageOffset + idx).toString() : order.id);
    const allPageSelected = data.length > 0 && allPageRowIds.every(id => selectedRows.includes(id));

    return (
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-[11px] uppercase tracking-widest border-b border-gray-200">
              <th className="p-4 font-bold sticky left-0 top-0 z-20 bg-gray-100 border-r border-gray-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={allPageSelected}
                    className="w-4 h-4 cursor-pointer accent-[#C29017] rounded border-gray-300 transition"
                  />
                  <span>Thao tác</span>
                </div>
              </th>
              <th className="p-4 font-bold">Mã Đơn</th>
              <th className="p-4 font-bold">Ngày lên đơn</th>
              <th className="p-4 font-bold">Trạng thái</th>
              <th className="p-4 font-bold">Tracking</th>
              <th className="p-4 font-bold">Khách Hàng</th>
              <th className="p-4 font-bold">Liên hệ</th>
              <th className="p-4 font-bold">Địa chỉ</th>
              <th className="p-4 font-bold">Sản phẩm</th>
              <th className="p-4 font-bold text-gray-900">Giá</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.map((order, idx) => {
              const absoluteIdx = pageOffset + idx;
              const rowId = isImport ? absoluteIdx.toString() : order.id;
              const isChecked = selectedRows.includes(rowId);

              let statusLabel = order.status || 'pending';
              let badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
              if (order.status === 'complete') {
                statusLabel = 'Đã thanh toán';
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              } else if (order.status === 'processing') {
                badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
              } else if (order.status === 'in_transit') {
                badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
              } else if (order.status === 'done') {
                badgeColor = 'bg-green-50 text-green-700 border-green-200';
              } else if (order.status === 'cancelled') {
                badgeColor = 'bg-red-50 text-red-700 border-red-200';
              } else if (order.status === 'pending') {
                statusLabel = 'Chờ thanh toán';
              }

              return (
                <tr key={idx} className={`border-b border-gray-100 transition duration-200 group ${isChecked ? 'bg-[#C29017]/10' : 'hover:bg-gray-50 bg-white'}`}>
                  
                  <td className={`p-4 sticky left-0 z-10 border-r border-gray-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors duration-200 ${isChecked ? 'bg-[#fdf9f1]' : 'bg-white group-hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => handleSelectRow(e.target.checked, rowId)}
                        className="w-4 h-4 cursor-pointer accent-[#C29017] rounded transition"
                      />
                      
                      {(isImport || ['pending', 'complete'].includes(order.status)) ? (
                        <>
                          <button onClick={() => openEditModal(isImport ? absoluteIdx : idx, isImport ? 'import' : 'db')} className="text-[#C29017] font-bold hover:underline hover:text-[#a87c14] transition">Sửa</button>
                          {isImport && (
                            <button onClick={() => { setImportOrders(prev => prev.filter((_, i) => i !== absoluteIdx)); }} className="text-red-500 font-bold hover:underline transition">Xóa</button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => openEditModal(idx, 'db')} className="text-teal-600 font-bold hover:underline transition">Xem</button>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                  <div className="flex items-center gap-1.5 group/orderid w-max">
                    <span className="font-bold text-gray-900">{order.external_order_id}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        copyToClipboard(order.external_order_id); 
                      }} 
                      className="text-gray-400 opacity-0 group-hover/orderid:opacity-100 transition-opacity hover:text-[#C29017]" 
                      title="Sao chép ID đơn hàng"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                    </button>
                  </div>
                  {/* HIỂN THỊ BADGE RESHIP */}
                  {(order.order_type === 'reshipment' || (order.external_order_id && order.external_order_id.startsWith('RS-'))) && (
                    <div className="mt-1">
                      <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-200 shadow-sm">
                        Đơn Reship
                      </span>
                    </div>
                  )}
                </td>
                <td className="p-4 text-xs text-gray-600 font-medium">
                  {order.order_date 
                    ? new Date(order.order_date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) 
                    : '---'}
                </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${badgeColor}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {order.tracking_number ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 group/track">
                          <span className="font-bold text-[#C29017]">
                            {order.tracking_number}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(order.tracking_number); }} 
                            className="text-gray-400 opacity-0 group-hover/track:opacity-100 transition-opacity hover:text-[#C29017]" 
                            title="Sao chép"
                          >
                            {/* ĐÃ CHÈN VÀ CHUẨN HÓA SVG TẠI ĐÂY */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-gray-400 font-medium">{order.shipping_carrier || 'USPS'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có</span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-gray-800">{order.customer_name}</td>
                  <td className="p-4 text-xs text-gray-500 space-y-0.5">
                    <div>{order.customer_email || '---'}</div>
                    <div>{order.customer_phone || '---'}</div>
                  </td>
                  <td className="p-4 text-gray-500 text-xs truncate max-w-[200px]" title={renderJsonObject(order.shipping_address) as string}>
                    {renderJsonObject(order.shipping_address)}
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1.5 py-1">
                      {order.items?.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} className="text-[10px] bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 w-max shadow-sm">
                          <span className="font-extrabold text-[#C29017] bg-[#C29017]/10 px-1.5 py-0.5 rounded">{item.quantity || 1}x</span>
                          
                          {/* HIỂN THỊ CẢNH BÁO NẾU CHƯA CÓ PHÔI */}
                          {item.type ? (
                            <>
                               <span className="font-bold text-gray-800">{item.type}</span>
                               <span className="text-gray-500 font-medium border-l pl-2 ml-1">({item.color || 'N/A'} - {item.size || 'N/A'})</span>
                            </>
                          ) : (
                            <span className="font-bold text-red-500 uppercase tracking-wider animate-pulse">Chưa map phôi (Vui lòng bấm sửa)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-900">${order.order_price}</td>
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
              <OrderTable data={dbOrders} />
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
                  <OrderTable data={importPageData} isImport={true} pageOffset={(importCurrentPage - 1) * IMPORT_PAGE_SIZE} />
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

      {/* MODAL CHI TIẾT/CHỈNH SỬA - GIAO DIỆN HIỆN ĐẠI MỚI */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-gray-900/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-50 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] w-[75vw] max-w-7xl max-h-[90vh] flex flex-col scale-in overflow-hidden border border-white/20">
            
            {/* Header Modal */}
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
                    
                    {/* Badge Trạng thái đơn hàng */}
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
                  
                  {/* Hiển thị Mã đơn hàng */}
                  <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                    Mã hệ thống: <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{editForm.external_order_id || 'Chưa lưu'}</span>
                  </div>
                </div>
              </div>
              
              <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Body Modal */}
            <div className="p-8 overflow-y-auto space-y-8">
             
              {/* Cảnh báo khóa đơn */}
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

              {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG & GIAO HÀNG (Hiệu ứng thẻ Card nổi) */}
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
                        const newItem = { sku: '', type: '', color: '', size: '', quantity: 1, design_front: '', design_back: '', mockup: '', extra_print_areas: [] };
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
                      {/* Vạch kẻ màu vàng trang trí (đã thêm rounded-l-[2rem] và gỡ bỏ overflow-hidden ở thẻ cha) */}
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
                      {/* HÀNG 1: SKUs */}
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
                                setImageError(prev => ({...prev, [`front-${index}`]: false, [`back-${index}`]: false, [`mockup-${index}`]: false}));
                                notify(`🎉 Đã đồng bộ thiết kế thành công cho: ${matchedDesign.sku}`);
                              }}
                            />
                          </div>
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
                      
                      {/* HÀNG 2: Thông số Phôi */}
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
                              newItems[index] = { ...newItems[index], type: newType };
                              if (newBlank) {
                                const parseArraySafe = (data: any) => { if (Array.isArray(data)) return data; if (typeof data === 'string') { try { return JSON.parse(data) || []; } catch { return []; } } return []; };
                                const newBlankColors = parseArraySafe(newBlank.colors);
                                const newBlankSizes = parseArraySafe(newBlank.sizes);
                                if (!newBlankColors.includes(newItems[index].color)) newItems[index].color = '';
                                if (!newBlankSizes.includes(newItems[index].size)) newItems[index].size = '';
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
                        {/* Ô SỐ LƯỢNG */}
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
                      
                      {/* HÀNG 3: Designs (Đã sửa lỗi Hover mất Popup) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Mặt Trước */}
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] ring-1 ring-gray-100 transition-all hover:ring-blue-200">
                          <div className="relative group/img shrink-0">
                            {/* Khung chứa ảnh bị cắt viền (overflow-hidden) */}
                            <div className="w-20 h-20 bg-gray-50 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-help">
                              {item.design_front ? (
                                <img src={imageError[`front-${index}`] ? '/no-image.png' : convertGoogleDriveUrl(item.design_front)} alt="Front" className="w-full h-full object-contain p-1" onError={() => setImageError(prev => ({ ...prev, [`front-${index}`]: true }))} />
                              ) : <span className="text-[9px] text-gray-400 font-medium text-center">No Img<br/>Front</span>}
                            </div>
                            {/* Popup nẩy ra NẰM NGOÀI khung bị cắt */}
                            {item.design_front && !imageError[`front-${index}`] && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                  <img src={convertGoogleDriveUrl(item.design_front)} alt="Preview" className="w-auto h-auto max-w-[200px] object-contain rounded-lg" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <label className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Mặt Trước</label>
                            <input disabled={isReadOnly} placeholder="Nhập Link Design..." value={item.design_front || ''} onChange={(e) => { const n = [...editForm.items]; n[index] = { ...n[index], design_front: e.target.value }; setEditForm({ ...editForm, items: n }); setImageError(prev => ({...prev, [`front-${index}`]: false})); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"/>
                          </div>
                        </div>

                        {/* Mặt Sau */}
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] ring-1 ring-gray-100 transition-all hover:ring-purple-200">
                          <div className="relative group/img shrink-0">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-help">
                              {item.design_back ? (
                                <img src={imageError[`back-${index}`] ? '/no-image.png' : convertGoogleDriveUrl(item.design_back)} alt="Back" className="w-full h-full object-contain p-1" onError={() => setImageError(prev => ({ ...prev, [`back-${index}`]: true }))} />
                              ) : <span className="text-[9px] text-gray-400 font-medium text-center">No Img<br/>Back</span>}
                            </div>
                            {item.design_back && !imageError[`back-${index}`] && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                  <img src={convertGoogleDriveUrl(item.design_back)} alt="Preview" className="w-auto h-auto max-w-[200px] object-contain rounded-lg" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <label className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Mặt Sau</label>
                            <input disabled={isReadOnly} placeholder="Nhập Link Design..." value={item.design_back || ''} onChange={(e) => { const n = [...editForm.items]; n[index] = { ...n[index], design_back: e.target.value }; setEditForm({ ...editForm, items: n }); setImageError(prev => ({...prev, [`back-${index}`]: false})); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"/>
                          </div>
                        </div>

                        {/* Mockup */}
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] ring-1 ring-gray-100 transition-all hover:ring-teal-200">
                          <div className="relative group/img shrink-0">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-help">
                              {item.mockup ? (
                                <img src={imageError[`mockup-${index}`] ? '/no-image.png' : convertGoogleDriveUrl(item.mockup)} alt="Mockup" className="w-full h-full object-cover" onError={() => setImageError(prev => ({ ...prev, [`mockup-${index}`]: true }))} />
                              ) : <span className="text-[9px] text-gray-400 font-medium text-center">No Img<br/>Mockup</span>}
                            </div>
                            {item.mockup && !imageError[`mockup-${index}`] && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                  <img src={convertGoogleDriveUrl(item.mockup)} alt="Preview" className="w-auto h-auto max-w-[200px] object-contain rounded-lg" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1.5">
                            <label className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Mockup SP</label>
                            <input disabled={isReadOnly} placeholder="Nhập Link Mockup..." value={item.mockup || ''} onChange={(e) => { const n = [...editForm.items]; n[index] = { ...n[index], mockup: e.target.value }; setEditForm({ ...editForm, items: n }); setImageError(prev => ({...prev, [`mockup-${index}`]: false})); }} className="w-full bg-gray-50 ring-1 ring-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"/>
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
                                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden cursor-help">
                                    {area.url ? <img src={imageError[`extra-${index}-${aIdx}`] ? '/no-image.png' : convertGoogleDriveUrl(area.url)} className="w-full h-full object-contain p-1" onError={() => setImageError(prev => ({...prev, [`extra-${index}-${aIdx}`]: true}))} /> : <span className="text-[8px] text-gray-300">No Img</span>}
                                  </div>
                                  {area.url && !imageError[`extra-${index}-${aIdx}`] && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/img:block z-[999] pointer-events-none animate-in fade-in zoom-in duration-200">
                                      <div className="bg-white p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-gray-200">
                                        <img src={convertGoogleDriveUrl(area.url)} className="w-auto h-auto max-w-[200px] object-contain rounded-lg" />
                                      </div>
                                    </div>
                                  )}
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

            {/* Footer Modal */}
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
      
      {/* THANH CÔNG CỤ BULK ACTION NỔI Ở ĐÁY MÀN HÌNH */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(194,144,23,0.3)] z-[60] flex items-center gap-6 border border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2">
            {/* Số đếm màu Gold */}
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
      {/* POPUP NHẬP LÝ DO & ẢNH MINH CHỨNG BIẾN ĐỘNG HỖ TRỢ */}
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
    </div>
  );
}
