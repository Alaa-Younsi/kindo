import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: ReactNode;
  widthClassName?: string;
}

export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  widthClassName = "w-full max-w-md",
}: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className={cn(
              "fixed top-0 z-50 flex h-full flex-col bg-panel shadow-2xl",
              widthClassName,
              side === "right" ? "right-0" : "left-0",
            )}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b-2 border-line px-5 py-4">
              {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
              <button
                onClick={onClose}
                aria-label="Close"
                className="ms-auto rounded-full p-2 text-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
