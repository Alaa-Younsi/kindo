export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type DeliveryType = "home" | "office";
export type ProductStatus = "active" | "draft";
export type Lang = "fr" | "ar";

export interface ProductColor {
  label_fr: string;
  label_ar: string;
  hex: string;
  image_url?: string | null;
}

/** One choice within a variant group ("Rouge", "128 Go", "Menthe"). Carries its
 *  own optional photo — selecting it swaps the product page's main image. */
export interface VariantOption {
  value_fr: string;
  value_ar: string;
  image_url: string | null;
}

export interface VariantGroup {
  name_fr: string;
  name_ar: string;
  values: VariantOption[];
}

/** The shopper's selection, snapshotted into the order. `value` is kept only
 *  for reading orders placed before the bilingual-option upgrade. */
export interface VariantPick {
  name_fr: string;
  name_ar: string;
  value_fr: string;
  value_ar: string;
  value?: string;
}

export type QuantityOffer =
  | { type: "free"; buy: number; get: number }
  | { type: "price"; qty: number; price: number };

export interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  image_url: string | null;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  details_fr: string[];
  details_ar: string[];
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  stock: number;
  style_code: string | null;
  colors: ProductColor[];
  sizes: string[];
  variants: VariantGroup[];
  quantity_offers: QuantityOffer[];
  video_url: string | null;
  featured: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  categories?: Category | null;
}

export interface StoreSettings {
  id: number;
  shipping_fee: number;
  free_ship_threshold: number | null;
  updated_at: string;
}

export interface DeliveryPrice {
  id: string;
  wilaya: string;
  home_price: number;
  office_price: number;
  active: boolean;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name_fr: string;
  name_ar: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  variants: VariantPick[];
  image_url: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address: string | null;
  notes: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  language: Lang;
  delivery_type: DeliveryType;
  created_at: string;
  order_items?: OrderItem[];
}

export interface ClientReview {
  id: string;
  client_name: string;
  stars: number;
  review_text: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface AdminProfileRow {
  user_id: string;
  email: string | null;
  is_owner: boolean;
  sections: string[];
  active: boolean;
  created_at: string;
}

export interface PolicySettingsRow {
  id: boolean;
  title_fr: string | null;
  title_ar: string | null;
  intro_fr: string | null;
  intro_ar: string | null;
  updated_label_fr: string | null;
  updated_label_ar: string | null;
  updated_at: string;
}

export interface PolicySectionRow {
  id: string;
  builtin_key: string | null;
  sort_order: number;
  active: boolean;
  title_fr: string | null;
  title_ar: string | null;
  body_fr: string | null;
  body_ar: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestOrderLookup {
  order_number: string;
  customer_name: string;
  wilaya: string;
  city: string;
  delivery_type: DeliveryType;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  language: Lang;
  created_at: string;
  items: Array<{
    name_fr: string;
    name_ar: string;
    price: number;
    quantity: number;
    color: string | null;
    size: string | null;
    variants: VariantPick[];
    image_url: string | null;
  }>;
}
