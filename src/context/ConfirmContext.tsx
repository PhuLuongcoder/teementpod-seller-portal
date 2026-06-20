'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type ConfirmOptions = {
  title?: string;
  // 🔥 MỞ KHÓA: Cho phép truyền cả Text thường lẫn giao diện HTML/JSX vào message
  message: string | ReactNode; 
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean; // Nếu true, nút xác nhận sẽ có màu Đỏ
};
type Toast = { id: number; message: string | ReactNode };

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string | ReactNode) => void;
};

const ConfirmContext = createContext<ConfirmContextType>({} as ConfirmContextType);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  };

  const handleConfirm = () => {
    resolver?.(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.(false);
    setIsOpen(false);
  };

  const notify = (message: string | ReactNode) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000); 
  };
  
  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}

      {/* GIAO DIỆN POPUP XÁC NHẬN */}
      {isOpen && options && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {options.title || "Xác nhận thao tác"}
              </h3>
              {/* 🔥 ĐỔI THẺ <p> THÀNH <div> ĐỂ TRÁNH LỖI HTML KHI CHÈN LIST/DIV BÊN TRONG */}
              <div className="text-sm text-gray-500 leading-relaxed">
                {options.message}
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={handleCancel}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
              >
                {options.cancelText || "Hủy bỏ"}
              </button>
              <button 
                onClick={handleConfirm}
                className={`px-6 py-2 text-sm font-bold rounded-xl shadow-md transition text-white ${
                  options.isDanger 
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                    : "bg-[#C29017] hover:bg-[#a67b13] shadow-[#C29017]/20"
                }`}
              >
                {options.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Render Toast Container */}
      <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg border border-gray-700 animate-in slide-in-from-right-5 font-bold text-sm">
            {toast.message}
          </div>
        ))}
      </div>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
