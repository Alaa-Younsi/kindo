import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAdminProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPrice, localize } from "@/lib/format";

export default function AdminProducts() {
  const { t, lang } = useLanguage();
  const { data: products, isLoading } = useAdminProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.products.title")}</h1>
        <Link to="/admin/products/new">
          <Button variant="brand" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("admin.products.new")}
          </Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              <th className="px-4 py-3 text-start font-bold">{t("admin.products.name")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.products.price")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.products.stock")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.products.status")}</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              products?.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="flex items-center gap-3 font-bold text-ink hover:text-brand"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-panel-2">
                        {product.product_images?.[0] && (
                          <img
                            src={product.product_images[0].url}
                            alt=""
                            width={40}
                            height={40}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      {localize(product, "name", lang)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    <Badge tone={product.status === "active" ? "green" : "neutral"}>
                      {t(product.status === "active" ? "admin.products.active" : "admin.products.draft")}
                    </Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
