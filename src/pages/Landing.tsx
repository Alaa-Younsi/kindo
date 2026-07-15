import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { HeroPets } from "@/components/effects/HeroPets";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { BentoPanel } from "@/components/ui/BentoPanel";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { localize } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import type { ClientReview } from "@/types/db";

const CATEGORY_ACCENTS = ["brand", "blue", "green", "yellow"] as const;

const ACCENT_SOLID_CLASSES: Record<(typeof CATEGORY_ACCENTS)[number], string> = {
  brand: "bg-brand text-brand-ink",
  blue: "bg-blue text-blue-ink",
  green: "bg-green text-green-ink",
  yellow: "bg-yellow text-yellow-ink",
};

const ACCENT_SOFT_CLASSES: Record<(typeof CATEGORY_ACCENTS)[number], string> = {
  brand: "bg-brand/15",
  blue: "bg-blue/15",
  green: "bg-green/15",
  yellow: "bg-yellow/15",
};

function useActiveReviews() {
  return useQuery({
    queryKey: ["reviews", "active"],
    queryFn: async (): Promise<ClientReview[]> => {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default function Landing() {
  const { t, lang } = useLanguage();
  const { data: categories } = useCategories();
  const { data: featured } = useFeaturedProducts(8);
  const { data: reviews } = useActiveReviews();

  useSeo({
    title: t("brand.name"),
    description: t("hero.subtitle"),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Store",
      name: "KINDO",
      url: import.meta.env.VITE_SITE_URL || "https://kindo.dz",
      description: t("hero.subtitle"),
      areaServed: "Algérie",
      paymentAccepted: "Cash on delivery",
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-panel-2">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20 lg:px-8">
          <div>
            <motion.span
              initial={{ x: -12 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-green/15 px-3 py-1.5 text-xs font-bold text-green"
            >
              <Truck className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </motion.span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-4 max-w-md text-base text-muted sm:text-lg">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button variant="brand" size="lg">
                  {t("hero.cta.shop")}
                </Button>
              </Link>
              <a href="#categories">
                <Button variant="outline" size="lg">
                  {t("hero.cta.categories")}
                </Button>
              </a>
            </div>
          </div>
          <HeroPets />
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y-2 border-line bg-panel">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {(
            [
              { Icon: Truck, key: "trust.cod", accent: "text-brand" },
              { Icon: BadgeCheck, key: "trust.delivery", accent: "text-blue" },
              { Icon: ShieldCheck, key: "trust.quality", accent: "text-green" },
              { Icon: Star, key: "trust.support", accent: "text-yellow" },
            ] as const
          ).map(({ Icon, key, accent }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon className={`h-8 w-8 shrink-0 ${accent}`} strokeWidth={2} />
              <span className="text-sm font-bold text-ink">{t(key)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
              {t("categories.title")}
            </h2>
            <p className="mt-1 text-muted">{t("categories.subtitle")}</p>
          </div>
          <Link to="/shop" className="hidden text-sm font-bold text-brand hover:underline sm:block">
            {t("categories.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories?.map((cat, i) => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`}>
              <BentoPanel
                accent={CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]}
                className="flex aspect-square flex-col items-center justify-center gap-2 text-center hover:-translate-y-1"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={localize(cat, "name", lang)}
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold text-ink ${ACCENT_SOFT_CLASSES[CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]]}`}
                  >
                    {localize(cat, "name", lang).charAt(0)}
                  </div>
                )}
                <span className="text-sm font-bold text-ink">{localize(cat, "name", lang)}</span>
              </BentoPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured && featured.length > 0 && (
        <section className="bg-panel-2 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
                {t("featured.title")}
              </h2>
              <p className="mt-1 text-muted">{t("featured.subtitle")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {t("how.title")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {(["step1", "step2", "step3"] as const).map((step, i) => (
            <BentoPanel
              key={step}
              accent={CATEGORY_ACCENTS[i]}
              className="flex flex-col items-center gap-3 text-center"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold ${ACCENT_SOLID_CLASSES[CATEGORY_ACCENTS[i]]}`}
              >
                {i + 1}
              </span>
              <h3 className="font-display text-lg font-extrabold text-ink">
                {t(`how.${step}.title`)}
              </h3>
              <p className="text-sm text-muted">{t(`how.${step}.desc`)}</p>
            </BentoPanel>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {reviews && reviews.length > 0 && (
        <section className="bg-panel-2 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
              {t("testimonials.title")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <BentoPanel key={review.id} className="flex flex-col gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.stars ? "fill-yellow text-yellow" : "text-line"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-ink">{review.review_text}</p>
                  <span className="mt-auto text-sm font-bold text-muted">{review.client_name}</span>
                </BentoPanel>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
