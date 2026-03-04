import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RestaurantTable, Product, Order, OrderStatus, Category, Staff, Payment, PaymentMethod, CartItem } from '@/types/restaurant';
import { mockTables, mockCategories, mockProducts, mockOrders, mockStaff } from '@/data/mockData';

interface RestaurantContextType {
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  staff: Staff[];
  payments: Payment[];
  cart: CartItem[];

  // Table actions
  openTable: (tableId: string) => void;
  closeTable: (tableId: string) => void;

  // Product actions
  toggleProductAvailability: (productId: string) => void;

  // Order actions
  createOrder: (tableId: string, items: CartItem[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Cart actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Payment actions
  processPayment: (orderId: string, method: PaymentMethod) => void;

  // Staff actions
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  toggleStaffActive: (staffId: string) => void;

  // Helpers
  getProductById: (id: string) => Product | undefined;
  getTableById: (id: string) => RestaurantTable | undefined;
  getOrdersByTable: (tableId: string) => Order[];
  isTableOpen: (tableId: string) => boolean;
  todaySales: number;
  todayOrderCount: number;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
};

let nextId = 100;
const genId = (prefix: string) => `${prefix}${nextId++}`;

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [tables, setTables] = useState<RestaurantTable[]>(mockTables);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [staff, setStaff] = useState<Staff[]>(mockStaff);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const openTable = useCallback((tableId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'occupied' as const } : t));
  }, []);

  const closeTable = useCallback((tableId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'available' as const } : t));
  }, []);

  const toggleProductAvailability = useCallback((productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, available: !p.available } : p));
  }, []);

  const createOrder = useCallback((tableId: string, items: CartItem[]) => {
    const orderId = genId('o');
    const orderItems = items.map(item => ({
      id: genId('oi'),
      orderId,
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      note: item.note,
    }));
    const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const newOrder: Order = {
      id: orderId,
      tableId,
      items: orderItems,
      status: 'pending',
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date() } : o));
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const processPayment = useCallback((orderId: string, method: PaymentMethod) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const payment: Payment = {
      id: genId('pay'),
      orderId,
      amount: order.totalAmount,
      method,
      status: 'completed',
      createdAt: new Date(),
    };
    setPayments(prev => [payment, ...prev]);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'served' as const } : o));
  }, [orders]);

  const addStaff = useCallback((s: Omit<Staff, 'id'>) => {
    setStaff(prev => [...prev, { ...s, id: genId('s') }]);
  }, []);

  const toggleStaffActive = useCallback((staffId: string) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, active: !s.active } : s));
  }, []);

  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);
  const getTableById = useCallback((id: string) => tables.find(t => t.id === id), [tables]);
  const getOrdersByTable = useCallback((tableId: string) => orders.filter(o => o.tableId === tableId), [orders]);
  const isTableOpen = useCallback((tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    return table?.status === 'occupied';
  }, [tables]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayOrderCount = todayOrders.length;

  return (
    <RestaurantContext.Provider value={{
      tables, categories: mockCategories, products, orders, staff, payments, cart,
      openTable, closeTable, toggleProductAvailability, createOrder, updateOrderStatus,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      processPayment, addStaff, toggleStaffActive,
      getProductById, getTableById, getOrdersByTable, isTableOpen,
      todaySales, todayOrderCount,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};
