import { RestaurantTable, Category, Product, Order, Staff } from '@/types/restaurant';

export const mockTables: RestaurantTable[] = [
  { id: 't1', number: 1, zone: 'A', seats: 2, status: 'available' },
  { id: 't2', number: 2, zone: 'A', seats: 2, status: 'occupied' },
  { id: 't3', number: 3, zone: 'A', seats: 4, status: 'available' },
  { id: 't4', number: 4, zone: 'A', seats: 4, status: 'reserved' },
  { id: 't5', number: 5, zone: 'B', seats: 4, status: 'available' },
  { id: 't6', number: 6, zone: 'B', seats: 6, status: 'occupied' },
  { id: 't7', number: 7, zone: 'B', seats: 6, status: 'available' },
  { id: 't8', number: 8, zone: 'B', seats: 8, status: 'available' },
  { id: 't9', number: 9, zone: 'C', seats: 4, status: 'occupied' },
  { id: 't10', number: 10, zone: 'C', seats: 4, status: 'available' },
  { id: 't11', number: 11, zone: 'C', seats: 2, status: 'available' },
  { id: 't12', number: 12, zone: 'C', seats: 8, status: 'available' },
];

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'อาหารจานเดียว', icon: '🍛' },
  { id: 'cat2', name: 'กับข้าว', icon: '🥘' },
  { id: 'cat3', name: 'ของทอด/ทานเล่น', icon: '🍗' },
  { id: 'cat4', name: 'ส้มตำ/ยำ', icon: '🥗' },
  { id: 'cat5', name: 'เครื่องดื่ม', icon: '🥤' },
  { id: 'cat6', name: 'ของหวาน', icon: '🍰' },
];

export const mockProducts: Product[] = [
  { id: 'p1', name: 'ข้าวผัดกุ้ง', price: 80, image: '🍛', categoryId: 'cat1', available: true, description: 'ข้าวผัดกุ้งสด ไข่ดาว' },
  { id: 'p2', name: 'ผัดไทยกุ้งสด', price: 90, image: '🍜', categoryId: 'cat1', available: true, description: 'ผัดไทยรสเด็ด กุ้งสดตัวโต' },
  { id: 'p3', name: 'ข้าวกะเพราหมูสับ', price: 60, image: '🍚', categoryId: 'cat1', available: true, description: 'กะเพราหมูสับ ไข่ดาว' },
  { id: 'p4', name: 'ข้าวมันไก่', price: 55, image: '🍗', categoryId: 'cat1', available: false, description: 'ข้าวมันไก่ต้ม น้ำจิ้มรสเด็ด' },
  { id: 'p5', name: 'ต้มยำกุ้ง', price: 150, image: '🍲', categoryId: 'cat2', available: true, description: 'ต้มยำกุ้งน้ำข้น รสแซ่บ' },
  { id: 'p6', name: 'แกงเขียวหวานไก่', price: 120, image: '🥘', categoryId: 'cat2', available: true, description: 'แกงเขียวหวาน เนื้อไก่นุ่ม' },
  { id: 'p7', name: 'ผัดกะเพราทะเล', price: 140, image: '🦐', categoryId: 'cat2', available: true, description: 'กะเพราทะเลรวม' },
  { id: 'p8', name: 'ไก่ทอดหาดใหญ่', price: 100, image: '🍗', categoryId: 'cat3', available: true, description: 'ไก่ทอดกรอบ รสชาติดั้งเดิม' },
  { id: 'p9', name: 'ปอเปี๊ยะทอด', price: 60, image: '🥟', categoryId: 'cat3', available: true, description: 'ปอเปี๊ยะทอดกรอบ' },
  { id: 'p10', name: 'ส้มตำไทย', price: 60, image: '🥗', categoryId: 'cat4', available: true, description: 'ส้มตำไทยรสแซ่บ' },
  { id: 'p11', name: 'ยำวุ้นเส้น', price: 80, image: '🥗', categoryId: 'cat4', available: true, description: 'ยำวุ้นเส้นทะเล' },
  { id: 'p12', name: 'น้ำส้มคั้นสด', price: 40, image: '🍊', categoryId: 'cat5', available: true, description: 'น้ำส้มคั้นสด 100%' },
  { id: 'p13', name: 'ชาไทย', price: 35, image: '🧋', categoryId: 'cat5', available: true, description: 'ชาไทยเย็น หวานมัน' },
  { id: 'p14', name: 'น้ำเปล่า', price: 15, image: '💧', categoryId: 'cat5', available: true, description: 'น้ำดื่ม' },
  { id: 'p15', name: 'ข้าวเหนียวมะม่วง', price: 80, image: '🥭', categoryId: 'cat6', available: true, description: 'ข้าวเหนียวมะม่วง กะทิหอม' },
];

export const mockOrders: Order[] = [
  {
    id: 'o1', tableId: 't2', status: 'preparing', totalAmount: 230,
    createdAt: new Date(Date.now() - 1000 * 60 * 10), updatedAt: new Date(),
    items: [
      { id: 'oi1', orderId: 'o1', productId: 'p1', quantity: 1, price: 80 },
      { id: 'oi2', orderId: 'o1', productId: 'p5', quantity: 1, price: 150 },
    ]
  },
  {
    id: 'o2', tableId: 't6', status: 'pending', totalAmount: 195,
    createdAt: new Date(Date.now() - 1000 * 60 * 3), updatedAt: new Date(),
    items: [
      { id: 'oi3', orderId: 'o2', productId: 'p3', quantity: 2, price: 60 },
      { id: 'oi4', orderId: 'o2', productId: 'p13', quantity: 1, price: 35 },
      { id: 'oi5', orderId: 'o2', productId: 'p12', quantity: 1, price: 40 },
    ]
  },
  {
    id: 'o3', tableId: 't9', status: 'ready', totalAmount: 260,
    createdAt: new Date(Date.now() - 1000 * 60 * 25), updatedAt: new Date(),
    items: [
      { id: 'oi6', orderId: 'o3', productId: 'p2', quantity: 1, price: 90 },
      { id: 'oi7', orderId: 'o3', productId: 'p7', quantity: 1, price: 140 },
      { id: 'oi8', orderId: 'o3', productId: 'p14', quantity: 2, price: 15 },
    ]
  },
];

export const mockStaff: Staff[] = [
  { id: 's1', name: 'สมชาย ใจดี', role: 'admin', phone: '081-234-5678', active: true },
  { id: 's2', name: 'สมหญิง รักครัว', role: 'kitchen', phone: '082-345-6789', active: true },
  { id: 's3', name: 'สุดา แคชเชียร์', role: 'cashier', phone: '083-456-7890', active: true },
  { id: 's4', name: 'ประยุทธ์ เสิร์ฟ', role: 'waiter', phone: '084-567-8901', active: true },
  { id: 's5', name: 'มานี ครัว', role: 'kitchen', phone: '085-678-9012', active: false },
];
