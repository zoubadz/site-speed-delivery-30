export type UserRole = 'admin' | 'worker' | null;

export type ViewState = 
  | 'splash'
  | 'landing'
  | 'role-selection'
  | 'login-admin'
  | 'login-worker'
  | 'dashboard-admin'
  | 'dashboard-worker'
  | 'developer-dashboard'; // Added developer view

export interface NavItem {
  id: string;
  label: string;
  icon: any; // Lucide icon type
}

export interface DashboardStat {
  label: string;
  value: string;
  color: string;
  icon: any;
}

export interface Admin {
  id: string;
  username: string;
  password?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  password?: string;
  status: 'active' | 'suspended';
  ordersCompleted: number;
  totalEarnings: number;
  openingBalance: number; // Added opening balance field
  lastLogin?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  fromLocation: string;
  toLocation: string;
  price: number;
  customerPhone: string;
  workerId: string | null; 
  workerName?: string;
  status: 'pending' | 'accepted' | 'delivered' | 'cancelled';
  date: string;
  time: string;
  description?: string; // Added description field
}

export interface Notification {
  id: string;
  workerName: string;
  action: string; // e.g., "Accepted Order", "Delivered Order"
  orderId: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

export interface Expense {
  id: string;
  workerId: string;
  title: string;
  amount: number;
  date: string;
  time: string;
}