import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";

interface DeleteAllOrdersModalProps {
  open: boolean;
  count: number;
  deleting: boolean;
  onClose: () => void;
  onExport: () => void;
  onConfirm: () => void;
}

export function DeleteAllOrdersModal({
  open,
  count,
  deleting,
  onClose,
  onExport,
  onConfirm,
}: DeleteAllOrdersModalProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={deleting ? undefined : onClose}
            aria-hidden
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl border-2 border-line bg-panel p-6 shadow-2xl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow/20 text-yellow">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-lg font-extrabold text-ink">
                {t("admin.orders.deleteAll.title")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t("admin.orders.deleteAll.warning").replace("{count}", String(count))}
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleting}
                  onClick={onExport}
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  {t("admin.orders.deleteAll.exportFirst")}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  disabled={deleting}
                  onClick={onConfirm}
                  className="w-full"
                >
                  {deleting ? t("admin.saving") : t("admin.orders.deleteAll.confirm")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={deleting}
                  onClick={onClose}
                  className="w-full"
                >
                  {t("admin.cancel")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
