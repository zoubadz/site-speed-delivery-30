import { Bike, Package, Users, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Worker, Order, Admin } from './types';

export const APP_NAME = "SPEED DELIVERY";
export const APP_SUBTITLE = "OUARGLA";

export const COLORS = {
  primary: '#0f172a', // Slate 900 - Dark Blue
  secondary: '#dc2626', // Red 600 - Speed Red
  accent: '#ffffff', // White
  textMuted: '#94a3b8', // Slate 400
};

export const MOCK_STATS_ADMIN = [
  { label: 'الطلبات اليومية', value: '0', color: 'bg-blue-500', icon: Package },
  { label: 'السائقين النشطين', value: '0', color: 'bg-green-500', icon: Bike },
  { label: 'إجمالي العملاء', value: '0', color: 'bg-purple-500', icon: Users },
  { label: 'الأرباح (DA)', value: '0', color: 'bg-yellow-500', icon: BarChart3 },
];

export const MOCK_STATS_WORKER = [
  { label: 'مهام قيد الانتظار', value: '0', color: 'bg-orange-500', icon: Clock },
  { label: 'تم التوصيل', value: '0', color: 'bg-green-500', icon: CheckCircle },
  { label: 'مشاكل عالقة', value: '0', color: 'bg-red-500', icon: AlertCircle },
];

// Added mock workers for login testing
export const INITIAL_WORKERS: Worker[] = [];

// Default Admin if local storage is empty
export const INITIAL_ADMINS: Admin[] = [];

export const INITIAL_ORDERS: Order[] = [];