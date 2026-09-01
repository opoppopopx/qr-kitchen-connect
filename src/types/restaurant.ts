export type TableStatus = 'available' | 'occupied' | 'reserved';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMethod = 'cash' | 'qr_code';
export type PaymentStatus = 'pending' | 'completed';
export type AppRole = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'waiter';

export interface RestaurantTable {
  id: string;
  number: number;
  zone: string;
  seats: number;
  status: TableStatus;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category_id: string | null;
  available: boolean;
  description: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  note: string;
}

export interface Order {
  id: string;
  order_no: number;
  table_id: string;
  customer_id: string | null;
  status: OrderStatus;
  source: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  created_at: string;
}

export interface StaffMember {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  salary: number;
  active: boolean;
  role: AppRole;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export const roleLabels: Record<AppRole, string> = {
  admin: 'แอดมิน',
  manager: 'ผู้จัดการ',
  cashier: 'แคชเชียร์',
  kitchen: 'ครัว',
  waiter: 'บริการ',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'รอรับออร์เดอร์',
  preparing: 'กำลังทำ',
  ready: 'ทำเสร็จแล้ว',
  served: 'เสิร์ฟแล้ว',
  cancelled: 'ยกเลิก',
};
