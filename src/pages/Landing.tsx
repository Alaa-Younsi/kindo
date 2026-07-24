import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bone,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/effects/TiltCard";
import { PawScatter, Paw } from "@/components/effects/PawScatter";
import { WaveDivider } from "@/components/effects/WaveDivider";
import { Marquee } from "@/components/effects/Marquee";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/useCategories";
import { topLevelCategories } from "@/lib/categories";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { useSeo } from "@/hooks/useSeo";
import { localize } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { ClientReview } from "@/types/db";

/* Square crops cut from the client's brand photo (see scripts note in README). */
const CATEGORY_PHOTOS: Record<string, string> = {
  chiens: "/images/cat-chiens.webp",
  chats: "/images/cat-chats.webp",
  oiseaux: "/images/cat-oiseaux.webp",
  poissons: "/images/cat-poissons.webp",
};

const CATEGORY_ICONS: Record<string, typeof Bone> = {
  "alimentation-soins": Bone,
  accessoires: Sparkles,
};

const RING_TONES = [
  "ring-brand/50 group-hover:ring-brand",
  "ring-blue/50 group-hover:ring-blue",
  "ring-green/50 group-hover:ring-green",
  "ring-yellow/60 group-hover:ring-yellow",
] as const;

const BLOB_TONES = [
  "bg-brand/15 text-brand",
  "bg-blue/15 text-blue",
  "bg-green/15 text-green",
  "bg-yellow/25 text-yellow",
] as const;

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

const cardStagger = {
  hidden: { y: 32 },
  show: (i: number) => ({
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function Landing() {
  const { t, lang } = useLanguage();
  const { data: allCategories } = useCategories();
  const categories = allCategories ? topLevelCategories(allCategories) : allCategories;
  const { data: featured } = useFeaturedProducts(8);
  const { data: reviews } = useActiveReviews();
  const { shouldReduceEffects } = useMediaFlags();

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const blobY = useTransform(scrollYProgress, [0, 1], [0, -80]);

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
    <div className="overflow-x-clip">
      {/* ================= Hero ================= */}
      <section ref={heroRef} className="bg-mesh-hero relative overflow-hidden">
        <PawScatter />
        <motion.div
          aria-hidden
          style={shouldReduceEffects ? undefined : { y: blobY }}
          className="pointer-events-none absolute -end-24 -top-24 h-80 w-80 rounded-full bg-blue/15"
        />
        <motion.div
          aria-hidden
          style={shouldReduceEffects ? undefined : { y: blobY }}
          className="pointer-events-none absolute -bottom-32 -start-20 h-72 w-72 rounded-full bg-yellow/20"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:grid-cols-2 md:pb-24 md:pt-16 lg:px-8">
          <div className="relative z-10 order-2 md:order-1">
            <motion.span
              initial={{ x: -16 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-green/40 bg-green/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-green"
            >
              <Truck className="h-4 w-4" />
              {t("hero.badge")}
            </motion.span>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.12] sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-brand via-blue to-green bg-clip-text text-transparent">
                {t("hero.title")}
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted sm:text-lg">{t("hero.subtitle")}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/shop">
                <Button variant="brand" size="lg" className="fx-paw-sweep hover:-rotate-1">
                  <PawPrint className="h-5 w-5" />
                  {t("hero.cta.shop")}
                </Button>
              </Link>
              <a href="#categories">
                <Button variant="blue" size="lg" className="hover:rotate-1">
                  {t("hero.cta.categories")}
                </Button>
              </a>
            </div>

            {/* animal chips */}
            <div className="mt-10 flex gap-3">
              {(
                [
                  { src: "/images/cat-chiens.webp", label: t("categories.dogs"), ring: "ring-brand/40" },
                  { src: "/images/cat-chats.webp", label: t("categories.cats"), ring: "ring-blue/40" },
                  { src: "/images/cat-oiseaux.webp", label: t("categories.birds"), ring: "ring-yellow/50" },
                  { src: "/images/cat-poissons.webp", label: t("categories.fish"), ring: "ring-green/40" },
                ] as const
              ).map(({ src, label, ring }, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 220 }}
                  className={cn(
                    "h-14 w-14 overflow-hidden rounded-2xl ring-2 transition-transform hover:-translate-y-1 sm:h-16 sm:w-16",
                    ring,
                  )}
                >
                  <img src={src} alt={label} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </motion.span>
              ))}
            </div>
          </div>

          {/* Photo card */}
          <motion.div
            style={shouldReduceEffects ? undefined : { y: photoY }}
            className="relative order-1 mx-auto w-full max-w-2xl md:order-2"
          >
            <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue/25 via-yellow/25 to-brand/25" />
            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <img
                src="/images/hero-pets.webp"
                alt={t("hero.title")}
                width={1600}
                height={893}
                loading="eager"
                fetchPriority="high"
                className="h-auto w-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= Marquee ================= */}
      <Marquee />

      {/* ================= Trust badges ================= */}
      <section className="relative bg-tint-blue">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-10 sm:gap-4 sm:px-6 sm:py-14 lg:grid-cols-4 lg:px-8">
          {(
            [
              { Icon: Truck, key: "trust.cod", card: "bg-brand text-brand-ink" },
              { Icon: BadgeCheck, key: "trust.delivery", card: "bg-yellow text-yellow-ink" },
              { Icon: ShieldCheck, key: "trust.quality", card: "bg-brand text-brand-ink" },
              { Icon: Star, key: "trust.support", card: "bg-yellow text-yellow-ink" },
            ] as const
          ).map(({ Icon, key, card }, i) => (
            <motion.div
              key={key}
              custom={i}
              variants={cardStagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-3 shadow-[0_4px_0_0_rgb(var(--c-ink)/0.12)] transition-transform hover:-translate-y-1 hover:rotate-1 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-5 sm:shadow-[0_6px_0_0_rgb(var(--c-ink)/0.12)]",
                card,
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 transition-transform group-hover:rotate-12 sm:h-12 sm:w-12 sm:rounded-xl">
                <Icon className="h-4.5 w-4.5 sm:h-7 sm:w-7" strokeWidth={2.2} />
              </span>
              <span className="text-xs font-extrabold leading-tight sm:text-lg">{t(key)}</span>
            </motion.div>
          ))}
        </div>
        <WaveDivider className="text-panel-2" />
      </section>

      {/* ================= Categories ================= */}
      <section id="categories" className="bg-tint-yellow relative">
        <PawScatter count={4} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            tone="blue"
            kicker={t("nav.categories")}
            title={t("categories.title")}
            subtitle={t("categories.subtitle")}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
            {categories?.map((cat, i) => {
              const photo = cat.image_url ?? CATEGORY_PHOTOS[cat.slug];
              const FallbackIcon = CATEGORY_ICONS[cat.slug] ?? PawPrint;
              return (
                <motion.div
                  key={cat.id}
                  custom={i}
                  variants={cardStagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                >
                  <Link to={`/shop?category=${cat.slug}`} className="group block">
                    <TiltCard max={12}>
                      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-line bg-panel p-5 shadow-sm transition-all duration-200 group-hover:-translate-y-1.5 group-hover:border-transparent group-hover:shadow-xl">
                        {photo ? (
                          <span
                            className={cn(
                              "h-20 w-20 overflow-hidden rounded-full ring-4 transition-all sm:h-24 sm:w-24",
                              RING_TONES[i % RING_TONES.length],
                            )}
                          >
                            <img
                              src={photo}
                              alt={localize(cat, "name", lang)}
                              width={96}
                              height={96}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:rotate-12 sm:h-24 sm:w-24",
                              BLOB_TONES[i % BLOB_TONES.length],
                            )}
                          >
                            <FallbackIcon className="h-9 w-9" strokeWidth={2} />
                          </span>
                        )}
                        <span className="text-center text-sm font-extrabold text-ink">
                          {localize(cat, "name", lang)}
                        </span>
                      </div>
                    </TiltCard>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
        <WaveDivider className="text-bg" />
      </section>

      {/* ================= Featured products ================= */}
      {featured && featured.length > 0 && (
        <section className="bg-tint-green relative">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              tone="green"
              kicker={<Paw className="inline h-3.5 w-3.5" />}
              title={t("featured.title")}
              subtitle={t("featured.subtitle")}
            />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {featured.map((product, i) => (
                <motion.div
                  key={product.id}
                  custom={i}
                  variants={cardStagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/shop">
                <Button variant="green" className="hover:rotate-1">
                  {t("categories.viewAll")}
                </Button>
              </Link>
            </div>
          </div>
          <WaveDivider className="text-panel-2" />
        </section>
      )}

      {/* ================= How it works ================= */}
      <section className="bg-tint-red relative">
        <PawScatter count={4} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading tone="brand" kicker="1 · 2 · 3" title={t("how.title")} />

          <div className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            {/* dashed paw trail connecting the steps (desktop only) */}
            <div aria-hidden className="absolute inset-x-[16%] top-10 hidden items-center justify-around border-t-4 border-dashed border-line md:flex">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0.4, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 90 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 260 }}
                  className="-mt-3"
                >
                  <Paw className="h-6 w-6 text-brand/50" />
                </motion.span>
              ))}
            </div>

            {(
              [
                { step: "step1", chip: "bg-brand text-brand-ink", card: "border-brand/30 hover:border-brand bg-brand/5" },
                { step: "step2", chip: "bg-blue text-blue-ink", card: "border-blue/30 hover:border-blue bg-blue/5" },
                { step: "step3", chip: "bg-green text-green-ink", card: "border-green/30 hover:border-green bg-green/5" },
              ] as const
            ).map(({ step, chip, card }, i) => (
              <motion.div
                key={step}
                custom={i}
                variants={cardStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-3xl border-2 p-7 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
                  card,
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold shadow-[0_4px_0_0_rgb(var(--c-ink)/0.15)]",
                    chip,
                  )}
                >
                  {i + 1}
                </span>
                <h3 className="font-display text-lg font-extrabold text-ink">{t(`how.${step}.title`)}</h3>
                <p className="text-sm text-muted">{t(`how.${step}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <WaveDivider className="text-bg" />
      </section>

      {/* ================= Certifications ================= */}
      <section className="bg-tint-green relative">
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            tone="green"
            kicker={<ShieldCheck className="inline h-3.5 w-3.5" />}
            title={t("certifications.title")}
            subtitle={t("certifications.subtitle")}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {(
              [
                { src: "/certificate1.jpeg", label: "UNATO" },
                { src: "/certificate2.png", label: "LGA" },
              ] as const
            ).map(({ src, label }, i) => (
              <motion.div
                key={label}
                custom={i}
                variants={cardStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className="group rounded-3xl border-2 border-line bg-panel p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-white p-6">
                  <img
                    src={src}
                    alt={label}
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-contain"
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-extrabold text-ink">
                  <BadgeCheck className="h-4 w-4 text-green" />
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <WaveDivider className="text-bg" />
      </section>

      {/* ================= Testimonials ================= */}
      {reviews && reviews.length > 0 && (
        <section className="bg-tint-blue relative">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading tone="yellow" kicker="★★★★★" title={t("testimonials.title")} />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  custom={i}
                  variants={cardStagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-3xl border-2 border-line bg-panel p-6 shadow-md transition-transform hover:rotate-0 hover:shadow-xl",
                    i % 3 === 0 ? "rotate-[-1.5deg]" : i % 3 === 1 ? "rotate-[1deg]" : "rotate-[-0.5deg]",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -top-3 start-8 h-6 w-16 rotate-[-4deg] rounded-sm opacity-80",
                      i % 4 === 0 ? "bg-yellow" : i % 4 === 1 ? "bg-blue" : i % 4 === 2 ? "bg-green" : "bg-brand",
                    )}
                  />
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-4 w-4",
                          s < review.stars ? "fill-yellow text-yellow" : "text-line",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-ink">{review.review_text}</p>
                  <span className="mt-auto flex items-center gap-2 text-sm font-extrabold text-muted">
                    <Paw className="h-4 w-4 text-brand/60" />
                    {review.client_name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA ================= */}
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="bg-cta-gradient relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-14 text-center shadow-2xl sm:px-12 sm:py-16">
          <PawScatter count={6} className="text-white" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">{t("cta.subtitle")}</p>
            <Link to="/shop" className="mt-8 inline-block">
              <Button variant="yellow" size="lg" className="fx-paw-sweep hover:-rotate-1">
                <PawPrint className="h-5 w-5" />
                {t("cta.button")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
