import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Tone = "success" | "error";
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface AdminToastValue {
  toast: (message: string, tone?: Tone) => void;
}

const AdminToastContext = createContext<AdminToastValue | null>(null);

/**
 * A single toast surface mounted in AdminLayout (around <Outlet />), so a
 * toast fired by a page that then navigates away still renders. Timers live on
 * the provider and are cleared on unmount.
 */
export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((x) => x.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, tone, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((h) => clearTimeout(h));
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((x) => (
          <button
            key={x.id}
            onClick={() => dismiss(x.id)}
            className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold shadow-lg ${
              x.tone === "error"
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-green/40 bg-green/10 text-green"
            }`}
          >
            {x.tone === "error" ? (
              <XCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            {x.message}
          </button>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast(): AdminToastValue {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx;
}
