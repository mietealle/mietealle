"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastCtx {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error:   <XCircle     className="h-5 w-5 text-red-500"   />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info:    <Info        className="h-5 w-5 text-blue-500"  />,
};

const BORDERS: Record<ToastType, string> = {
  success: "border-l-green-500",
  error:   "border-l-red-500",
  warning: "border-l-yellow-500",
  info:    "border-l-blue-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-3), { ...opts, id }]);
    const t = setTimeout(() => dismiss(id), 4000);
    timers.current.set(id, t);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, ...(message !== undefined ? { message } : {}) }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: "error",   title, ...(message !== undefined ? { message } : {}) }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, ...(message !== undefined ? { message } : {}) }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: "info",    title, ...(message !== undefined ? { message } : {}) }), [toast]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id}
            className={cn(
              "pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-l-4 bg-white p-4 shadow-lg",
              "animate-in slide-in-from-bottom-4 fade-in duration-200",
              BORDERS[t.type]
            )}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs text-gray-500">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-gray-300 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
