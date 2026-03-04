export type TableStatus = 'available' | 'occupied' | 'reserved';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMethod = 'cash' | 'qr_code';
export type PaymentStatus = 'pending' | 'completed';
export type StaffRole = 'admin' | 'cashier' | 'kitchen' | 'waiter';

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
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  available: boolean;
  description: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}
