export type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export const ORDER_STATUSES: { id: OrderStatus; label: string; customer: string; tone: string }[] = [
  { id: "pending_payment", label: "Waiting for payment", customer: "Please pay and upload your payment screenshot.", tone: "bg-brand-yellow-soft text-ink" },
  { id: "payment_review", label: "Checking payment", customer: "We received your payment screenshot and are checking it.", tone: "bg-[#e8f0ff] text-[#1d3f8a]" },
  { id: "paid", label: "Paid", customer: "Payment confirmed. The branch will prepare your order.", tone: "bg-[#e3f4e8] text-success" },
  { id: "processing", label: "Preparing", customer: "The branch is preparing your order.", tone: "bg-[#efe7ff] text-[#4b2a8a]" },
  { id: "ready", label: "Ready for pickup", customer: "Your order is ready for pickup at the branch.", tone: "bg-[#e3f4e8] text-success" },
  { id: "shipped", label: "On the way", customer: "Your order is on the way.", tone: "bg-[#e8f0ff] text-[#1d3f8a]" },
  { id: "delivered", label: "Delivered", customer: "Your order was delivered.", tone: "bg-[#e3f4e8] text-success" },
  { id: "completed", label: "Completed", customer: "Order completed. Thank you!", tone: "bg-sand text-graphite" },
  { id: "cancelled", label: "Cancelled", customer: "This order was cancelled.", tone: "bg-[#fff1f1] text-brand-red-deep" },
];
export const orderStatus = (s: OrderStatus) => ORDER_STATUSES.find((x) => x.id === s) ?? ORDER_STATUSES[0];
export const OPEN_ORDER_STATUSES: OrderStatus[] = ["pending_payment", "payment_review", "paid", "processing", "ready", "shipped"];

/** The steps shown on the tracking bar. */
export const TRACK_STEPS: { label: string; reached: OrderStatus[] }[] = [
  { label: "Placed", reached: ["pending_payment", "payment_review", "paid", "processing", "ready", "shipped", "delivered", "completed"] },
  { label: "Paid", reached: ["paid", "processing", "ready", "shipped", "delivered", "completed"] },
  { label: "Preparing", reached: ["processing", "ready", "shipped", "delivered", "completed"] },
  { label: "On the way / ready", reached: ["ready", "shipped", "delivered", "completed"] },
  { label: "Delivered", reached: ["delivered", "completed"] },
];

export const DELIVERY_METHODS: { id: string; label: string; hint: string }[] = [
  { id: "pickup", label: "Pickup at branch", hint: "Free. We'll tell you when it's ready." },
  { id: "lalamove", label: "Lalamove", hint: "Same-day, within the city. Rider fee paid by you." },
  { id: "grab", label: "GrabExpress", hint: "Same-day, small orders. Rider fee paid by you." },
  { id: "transportify", label: "Transportify", hint: "Vans and trucks for bigger orders." },
  { id: "trucking", label: "Trucking", hint: "Bulk orders to your province." },
  { id: "container", label: "Shipping container", hint: "Sea cargo to Visayas and Mindanao." },
  { id: "bus", label: "Bus terminal to terminal", hint: "Pick up at your bus terminal." },
  { id: "van", label: "Van", hint: "UV express or van cargo." },
  { id: "jeep", label: "Jeepney", hint: "Short routes from the branch." },
];
export const deliveryLabel = (id: string) => DELIVERY_METHODS.find((d) => d.id === id)?.label ?? id;

export interface OrderItem {
  sheet: string;
  row: string;
  column: string;
  name: string;
  option: string;
  unit: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  reference: string;
  user_id: string;
  branch_slug: string | null;
  tier: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  adjustment: number;
  adjustment_note: string | null;
  shipping_fee: number | null;
  delivery_method: string;
  delivery_address: string | null;
  contact_name: string;
  contact_mobile: string;
  notes: string | null;
  courier: string | null;
  tracking_ref: string | null;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: number;
  order_id: string;
  status: OrderStatus | null;
  note: string | null;
  actor: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  method: string;
  amount: number;
  reference: string | null;
  proof_path: string;
  status: "submitted" | "confirmed" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  label: string;
  account_name: string | null;
  account_number: string | null;
  qr_path: string | null;
  instructions: string | null;
  active: boolean;
  sort: number;
}

/** Totals for an order and its payments. */
export function orderTotals(o: Pick<Order, "subtotal" | "adjustment" | "shipping_fee">, payments: Pick<Payment, "amount" | "status">[]) {
  const total = Number(o.subtotal) + Number(o.adjustment ?? 0) + Number(o.shipping_fee ?? 0);
  const paid = payments.filter((p) => p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "submitted").reduce((s, p) => s + Number(p.amount), 0);
  return { total, paid, pending, balance: Math.max(0, Math.round((total - paid) * 100) / 100) };
}
