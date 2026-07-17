import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { QuantityOffer } from "@/types/db";

interface OffersEditorProps {
  value: QuantityOffer[];
  onChange: (offers: QuantityOffer[]) => void;
}

export function OffersEditor({ value, onChange }: OffersEditorProps) {
  const { t } = useLanguage();

  const updateOffer = (index: number, offer: QuantityOffer) => {
    onChange(value.map((o, i) => (i === index ? offer : o)));
  };

  const removeOffer = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addOffer = () => {
    onChange([...value, { type: "free", buy: 1, get: 1 }]);
  };

  const changeType = (index: number, type: QuantityOffer["type"]) => {
    updateOffer(
      index,
      type === "free" ? { type: "free", buy: 1, get: 1 } : { type: "price", qty: 2, price: 0 },
    );
  };

  return (
    <div className="space-y-3">
      {value.map((offer, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line p-3"
        >
          <Select
            value={offer.type}
            onChange={(e) => changeType(index, e.target.value as QuantityOffer["type"])}
            wrapperClassName="w-40"
          >
            <option value="free">{t("admin.products.offerFree")}</option>
            <option value="price">{t("admin.products.offerPrice")}</option>
          </Select>

          {offer.type === "free" ? (
            <>
              <Input
                type="number"
                min={1}
                placeholder={t("admin.products.offerBuy")}
                value={offer.buy}
                onChange={(e) => updateOffer(index, { ...offer, buy: Number(e.target.value) })}
                className="w-20"
              />
              <Input
                type="number"
                min={1}
                placeholder={t("admin.products.offerGet")}
                value={offer.get}
                onChange={(e) => updateOffer(index, { ...offer, get: Number(e.target.value) })}
                className="w-20"
              />
            </>
          ) : (
            <>
              <Input
                type="number"
                min={1}
                placeholder={t("admin.products.offerQty")}
                value={offer.qty}
                onChange={(e) => updateOffer(index, { ...offer, qty: Number(e.target.value) })}
                className="w-20"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder={t("admin.products.offerBundlePrice")}
                value={offer.price}
                onChange={(e) => updateOffer(index, { ...offer, price: Number(e.target.value) })}
                className="w-24"
              />
            </>
          )}

          <button
            type="button"
            onClick={() => removeOffer(index)}
            className="ms-auto rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand"
            aria-label={t("admin.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addOffer}>
        <Plus className="h-4 w-4" />
        {t("admin.products.addOffer")}
      </Button>
    </div>
  );
}
