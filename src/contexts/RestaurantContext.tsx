import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  RestaurantTable, Product, Order, OrderStatus, Category, Payment, PaymentMethod,
  CartItem, Customer, TableStatus, OrderItem,
} from '@/types/restaurant';

interface NewOrderPayload { tableId: string }

interface RestaurantContextType {
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  payments: Payment[];
  customers: Customer[];
  loading: boolean;
  refresh: () => Promise<void>;

  setTableStatus: (tableId: string, status: TableStatus) => Promise<void>;
  openTable: (tableId: string) => Promise<void>;
  closeTable: (tableId: string) => Promise<void>;
  addTable: (t: { number: number; zone: string; seats: number }) => Promise<string | null>;
  deleteTable: (tableId: string) => Promise<string | null>;

  toggleProductAvailability: (productId: string, available: boolean) => Promise<void>;
  addProduct: (p: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  createOrder: (tableId: string, items: CartItem[], source?: string, customerId?: string | null) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  setItemQuantity: (item: OrderItem, quantity: number) => Promise<void>;
  setItemNote: (itemId: string, note: string) => Promise<void>;
  addItemsToOrder: (orderId: string, items: CartItem[]) => Promise<void>;

  processPayment: (orderId: string, method: PaymentMethod) => Promise<void>;
  requestPayment: (orderId: string, method: PaymentMethod, amount: number) => Promise<void>;

  addCustomer: (c: { name: string; phone: string; email: string }) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  getProductById: (id: string) => Product | undefined;
  getTableById: (id: string) => RestaurantTable | undefined;
  getOrdersByTable: (tableId: string) => Order[];
  todaySales: number;
  todayOrderCount: number;
  todayItemCount: number;
  yearSales: number;
  yearOrderCount: number;
  onNewOrder: (cb: (p: NewOrderPayload) => void) => () => void;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
};

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const newOrderListeners = useRef<Set<(p: NewOrderPayload) => void>>(new Set());
  const knownOrderIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const fetchAll = useCallback(async () => {
    const [t, c, p, o, oi, pay, cus] = await Promise.all([
      supabase.from('tables').select('*').order('number'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('created_at'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*').order('created_at'),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
    ]);

    setTables((t.data ?? []) as RestaurantTable[]);
    setCategories((c.data ?? []) as Category[]);
    setProducts((p.data ?? []) as Product[]);
    setPayments((pay.data ?? []) as Payment[]);
    setCustomers((cus.data ?? []) as Customer[]);

    const items = (oi.data ?? []) as OrderItem[];
    const built = ((o.data ?? []) as Order[]).map(ord => ({
      ...ord,
      items: items.filter(i => i.order_id === ord.id),
    }));
    setOrders(built);

    if (firstLoad.current) {
      built.forEach(b => knownOrderIds.current.add(b.id));
      firstLoad.current = false;
    } else {
      built.forEach(b => {
        if (!knownOrderIds.current.has(b.id)) {
          knownOrderIds.current.add(b.id);
          newOrderListeners.current.forEach(cb => cb({ tableId: b.table_id }));
        }
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchAll(), 250);
    };
    const channel = supabase
      .channel('restaurant-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, debounced)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const onNewOrder = useCallback((cb: (p: NewOrderPayload) => void) => {
    newOrderListeners.current.add(cb);
    return () => newOrderListeners.current.delete(cb);
  }, []);

  const setTableStatus = useCallback(async (tableId: string, status: TableStatus) => {
    await supabase.from('tables').update({ status }).eq('id', tableId);
    await fetchAll();
  }, [fetchAll]);

  const openTable = useCallback((id: string) => setTableStatus(id, 'occupied'), [setTableStatus]);
  const closeTable = useCallback((id: string) => setTableStatus(id, 'available'), [setTableStatus]);

  const addTable = useCallback(async (t: { number: number; zone: string; seats: number }) => {
    const { data, error } = await supabase.from('tables').insert(t).select().maybeSingle();
    await fetchAll();
    return { error: error ? error.message : null, table: (data as RestaurantTable | null) ?? null };
  }, [fetchAll]);


  const deleteTable = useCallback(async (tableId: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', tableId);
    await fetchAll();
    return error ? error.message : null;
  }, [fetchAll]);

  const toggleProductAvailability = useCallback(async (productId: string, available: boolean) => {
    await supabase.from('products').update({ available }).eq('id', productId);
    await fetchAll();
  }, [fetchAll]);

  const addProduct = useCallback(async (p: Omit<Product, 'id'>) => {
    await supabase.from('products').insert(p);
    await fetchAll();
  }, [fetchAll]);

  const updateProduct = useCallback(async (id: string, p: Partial<Omit<Product, 'id'>>) => {
    await supabase.from('products').update(p).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteProduct = useCallback(async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const createOrder = useCallback(async (
    tableId: string, items: CartItem[], source = 'staff', customerId: string | null = null,
  ) => {
    if (!items.length) return null;
    const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    const { data, error } = await supabase.from('orders')
      .insert({ table_id: tableId, total_amount: total, source, customer_id: customerId })
      .select('id').single();
    if (error || !data) return null;
    await supabase.from('order_items').insert(items.map(i => ({
      order_id: data.id,
      product_id: i.product.id,
      quantity: i.quantity,
      price: Number(i.product.price),
      note: i.note ?? '',
    })));
    await fetchAll();
    return data.id;
  }, [fetchAll]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    await fetchAll();
  }, [fetchAll]);

  const recalcTotal = useCallback(async (orderId: string) => {
    const { data } = await supabase.from('order_items').select('quantity, price').eq('order_id', orderId);
    const total = (data ?? []).reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    await supabase.from('orders').update({ total_amount: total }).eq('id', orderId);
  }, []);

  const setItemQuantity = useCallback(async (item: OrderItem, quantity: number) => {
    if (quantity <= 0) await supabase.from('order_items').delete().eq('id', item.id);
    else await supabase.from('order_items').update({ quantity }).eq('id', item.id);
    await recalcTotal(item.order_id);
    await fetchAll();
  }, [recalcTotal, fetchAll]);

  const setItemNote = useCallback(async (itemId: string, note: string) => {
    await supabase.from('order_items').update({ note }).eq('id', itemId);
    await fetchAll();
  }, [fetchAll]);

  const addItemsToOrder = useCallback(async (orderId: string, items: CartItem[]) => {
    if (!items.length) return;
    await supabase.from('order_items').insert(items.map(i => ({
      order_id: orderId,
      product_id: i.product.id,
      quantity: i.quantity,
      price: Number(i.product.price),
      note: i.note ?? '',
    })));
    await recalcTotal(orderId);
    await fetchAll();
  }, [recalcTotal, fetchAll]);

  const processPayment = useCallback(async (orderId: string, method: PaymentMethod) => {
    const order = orders.find(o => o.id === orderId);
    const amount = order ? Number(order.total_amount) : 0;
    const { data: existing } = await supabase.from('payments').select('id').eq('order_id', orderId).limit(1);
    if (existing && existing.length) {
      await supabase.from('payments').update({ status: 'completed', method, amount }).eq('id', existing[0].id);
    } else {
      await supabase.from('payments').insert({ order_id: orderId, amount, method, status: 'completed' });
    }
    await supabase.from('orders').update({ status: 'served' }).eq('id', orderId);
    await fetchAll();
  }, [orders, fetchAll]);

  const requestPayment = useCallback(async (orderId: string, method: PaymentMethod, amount: number) => {
    await supabase.from('payments').insert({ order_id: orderId, amount, method, status: 'pending' });
    await fetchAll();
  }, [fetchAll]);

  const addCustomer = useCallback(async (c: { name: string; phone: string; email: string }) => {
    await supabase.from('customers').insert(c);
    await fetchAll();
  }, [fetchAll]);

  const deleteCustomer = useCallback(async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);
  const getTableById = useCallback((id: string) => tables.find(t => t.id === id), [tables]);
  const getOrdersByTable = useCallback((tableId: string) => orders.filter(o => o.table_id === tableId), [orders]);

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const valid = orders.filter(o => o.status !== 'cancelled');
  const todayOrders = valid.filter(o => new Date(o.created_at) >= startOfDay);
  const yearOrders = valid.filter(o => new Date(o.created_at) >= startOfYear);

  const value: RestaurantContextType = {
    tables, categories, products, orders, payments, customers, loading, refresh: fetchAll,
    setTableStatus, openTable, closeTable, addTable, deleteTable,
    toggleProductAvailability, addProduct, updateProduct, deleteProduct,
    createOrder, updateOrderStatus, setItemQuantity, setItemNote, addItemsToOrder,
    processPayment, requestPayment, addCustomer, deleteCustomer,
    getProductById, getTableById, getOrdersByTable,
    todaySales: todayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
    todayOrderCount: todayOrders.length,
    todayItemCount: todayOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0),
    yearSales: yearOrders.reduce((s, o) => s + Number(o.total_amount), 0),
    yearOrderCount: yearOrders.length,
    onNewOrder,
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};
