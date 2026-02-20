

export type UserRole = 'admin' | 'worker' | null;

export type ViewState = 
  | 'splash'
  | 'landing'
  | 'role-selection'
  | 'login-admin'
  | 'login-worker'
  | 'dashboard-admin'
  | 'dashboard-worker'
  | 'developer-dashboard';

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
  openingBalance: number;
  lastLogin?: string;
  avatar?: string;
  notificationSound?: string; // 'tone-1', 'tone-2', ... or 'custom'
  customRingTone?: string; // Base64 Data URL for custom audio
  // GPS Tracking Fields
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string; // Timestamp
}

export interface Order {
  id: string;
  fromLocation: string;
  toLocation: string;
  price: number;
  customerPhone: string; // Sender/Pickup Phone
  deliveryPhone?: string; // Receiver/Dropoff Phone
  workerId: string | null; 
  workerName?: string;
  status: 'pending' | 'accepted' | 'delivered' | 'cancelled';
  date: string;
  time: string; // Order Creation Time
  acceptedTime?: string; // Time when worker accepted
  deliveredTime?: string; // Time when delivered
  cancelledTime?: string; // Time when cancelled
  description?: string;
}

export interface OrderChangeRequest {
  id: string;
  orderId: string;
  workerId: string;
  workerName: string;
  newValues: Partial<Order>;
  timestamp: string;
}

export interface Notification {
  id: string;
  workerId?: string; // Target worker
  workerName?: string; // For admin logs
  action: string; 
  orderId: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'admin_edit';
  isRead?: boolean;
  changes?: string[]; // Array of change descriptions
}

export interface Expense {
  id: string;
  workerId: string;
  title: string;
  amount: number;
  date: string;
  time: string;
}