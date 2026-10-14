export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  image: string;
  subcategories: Category[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number; // integer cents
  compareAtPrice?: number; // integer cents
  rating: number; // 3.5 to 5.0
  reviewCount: number;
  stock: number;
  images: string[];
  videoUrls: string[];
  features: string[];
  description: string; // two paragraphs separated by \n\n
  specifications: Record<string, string>;
  tags: string[];
  categoryId: string;
  subcategoryId: string | null;
}

export interface CartItemSnapshot {
  id: string;
  slug: string;
  title: string;
  image: string;
  unitPrice: number; // integer cents
  stock: number;
}

export interface CartItem extends CartItemSnapshot {
  quantity: number;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateOrRegion: string;
  postalCode: string;
  country: string;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  fee: number; // integer cents
  freeThreshold?: number; // integer cents, free shipping if subtotal >= this
  estimatedDays: string;
}

export interface OrderSummary {
  orderNumber: string;
  items: CartItem[];
  shippingDetails: ShippingDetails;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  placedAt: string;
}

export interface HeroSlide {
  id: string;
  image: string;
  headline: string;
  subcopy: string;
  ctaText: string;
  ctaHref: string;
}

export interface PaymentInput {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  amount: number; // cents
}

export interface PaymentResult {
  success: boolean;
  message: string;
  declineCode?: string;
}
