import { AppRole } from "@/types/restaurant";
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, ChefHat, BookOpen, Users, UserCog,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: AppRole[];
}

const ALL: AppRole[] = ['admin', 'manager', 'cashier', 'kitchen', 'waiter'];

export const navItems: NavItem[] = [
  { title: "แดชบอร์ด", url: "/", icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
  { title: "ออร์เดอร์", url: "/orders", icon: ClipboardList, roles: ALL },
  { title: "โต๊ะอาหาร", url: "/tables", icon: UtensilsCrossed, roles: ['admin', 'manager', 'cashier', 'waiter'] },
  { title: "ห้องครัว", url: "/kitchen", icon: ChefHat, roles: ['admin', 'manager', 'kitchen', 'waiter'] },
  { title: "เมนูอาหาร", url: "/menu", icon: BookOpen, roles: ['admin', 'manager', 'kitchen'] },
  { title: "ลูกค้าสมาชิก", url: "/customers", icon: Users, roles: ['admin', 'manager', 'cashier'] },
  { title: "จัดการพนักงาน", url: "/staff", icon: UserCog, roles: ['admin', 'manager'] },
];

export const canAccess = (role: AppRole | null, path: string) => {
  if (!role) return false;
  const item = navItems.find(n => n.url === path);
  if (!item) return true;
  return item.roles.includes(role);
};

export const homeFor = (role: AppRole | null) => {
  if (!role) return "/login";
  const first = navItems.find(n => n.roles.includes(role));
  return first?.url ?? "/orders";
};
