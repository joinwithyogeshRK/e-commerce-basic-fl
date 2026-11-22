export type Category = 'clothing' | 'footwear' | 'accessories';
export type Gender = 'men' | 'women' | 'unisex';

export type ColorOption = { name: string; hex: string; image: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  subcategory: string;
  gender: Gender;
  price: number;
  compareAt?: number;
  description: string;
  details: string[];
  material: string;
  care: string;
  colors: ColorOption[];
  sizes: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  badge?: string;
  featured?: boolean;
  createdAt: string;
};

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  color: string;
  size: string;
  qty: number;
};

export type Address = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type PaymentMethod = 'card' | 'upi' | 'cod';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type TimelineEntry = { status: OrderStatus; at: string; note: string };

export type Order = {
  id: string;
  items: CartLine[];
  address: Address;
  shippingMethod: { id: string; label: string; price: number; eta: string };
  payment: {
    method: PaymentMethod;
    status: 'paid' | 'pending' | 'failed';
    reference: string;
    last4?: string;
    brand?: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  coupon?: string;
  status: OrderStatus;
  timeline: TimelineEntry[];
  createdAt: string;
  estimatedDelivery: string;
};

export type MailMessage = {
  id: string;
  to: string;
  subject: string;
  preheader: string;
  html: string;
  kind: 'order_confirmation' | 'payment_receipt' | 'shipping_update' | 'welcome' | 'admin_alert';
  sentAt: string;
  provider: 'simulated' | 'resend';
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
  products?: string[];
  suggestions?: string[];
  action?: { type: 'add_to_cart'; productId: string; size?: string } | { type: 'navigate'; href: string };
};
