import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Bell, Search, LayoutDashboard, Users, Package, 
  Settings, MapPin, ClipboardList, Bike, Plus, Trash2, Edit, 
  MoreVertical, CheckCircle, XCircle, FileText, Download, Save,
  ArrowRight, Key, Phone, User, DollarSign, Calendar, Navigation, 
  PhoneCall, Wallet, History, Clock, Check, AlertCircle, RefreshCw,
  ChevronRight, Timer, AlertTriangle, Home, Menu, Grid, BarChart3,
  Banknote, Shield, PieChart, TrendingUp, Coins, Send, Printer,
  CalendarDays, Activity, Loader2, FileQuestion, Receipt, Calculator,
  Power, PowerOff, UserCheck, UserX
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ViewState, DashboardStat, Worker, Order, Notification, Expense } from '../types';
import Logo from '../components/Logo';
import { MOCK_STATS_ADMIN, MOCK_STATS_WORKER, INITIAL_WORKERS, INITIAL_ORDERS } from '../constants';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for TS errors
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    accepted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  
  const labels = {
    pending: 'قيد الانتظار',
    accepted: 'جاري التوصيل',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

// --- Extracted NavigationDock Component ---
interface NavigationDockProps {
  role: 'admin' | 'worker';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isDockExpanded: boolean;
  setIsDockExpanded: (expanded: boolean) => void;
  dockRef: React.RefObject<HTMLDivElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  resetDockTimer: () => void;
}

const NavigationDock: React.FC<NavigationDockProps> = ({
  role,
  activeTab,
  setActiveTab,
  onLogout,
  isDockExpanded,
  setIsDockExpanded,
  dockRef,
  onMouseEnter,
  onMouseLeave,
  resetDockTimer
}) => {
  const adminLinks = [
    { id: 'overview', icon: Home, label: 'الرئيسية', color: 'from-cyan-500 to-blue-600' },
    { id: 'workers', icon: Users, label: 'العمال', color: 'from-purple-500 to-indigo-600' },
    { id: 'orders', icon: Package, label: 'الطلبات', color: 'from-amber-400 to-orange-600' },
    { id: 'reports', icon: FileText, label: 'التقارير', color: 'from-emerald-400 to-green-600' },
  ];

  const workerLinks = [
    { id: 'tasks', icon: ClipboardList, label: 'المهام', color: 'from-blue-400 to-blue-600' },
    { id: 'history', icon: History, label: 'السجل', color: 'from-indigo-400 to-purple-600' },
    { id: 'wallet', icon: Wallet, label: 'المحفظة', color: 'from-green-400 to-emerald-600' },
    { id: 'settings', icon: Settings, label: 'الإعدادات', color: 'from-gray-500 to-slate-600' },
  ];

  const links = role === 'admin' ? adminLinks : workerLinks;

  return (
    <div 
      ref={dockRef}
      className="fixed right-6 top-4 z-50 flex flex-col items-end"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <AnimatePresence mode="wait">
        {!isDockExpanded ? (
           <MotionButton
              key="dock-collapsed"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={resetDockTimer}
              className="w-12 h-12 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-slate-700 hover:border-blue-500 text-white flex items-center justify-center shadow-lg transition-colors"
           >
              <Grid size={24} />
           </MotionButton>
        ) : (
           <MotionDiv
              key="dock-expanded"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="flex flex-col gap-4 md:gap-6 p-3 md:p-4 rounded-3xl bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl"
           >
              {links.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <div key={link.id} className="relative group flex items-center justify-center">
                    <div className="hidden md:block absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700 shadow-xl">
                       {link.label}
                    </div>

                    <button 
                      onClick={() => {
                         setActiveTab(link.id);
                         resetDockTimer(); 
                      }}
                      className={`relative transition-all duration-300 outline-none`}
                    >
                       <MotionDiv 
                         animate={isActive ? { 
                           scale: [1, 1.1, 1],
                           y: [0, -4, 0],
                           boxShadow: ["0 10px 15px -3px rgba(0,0,0,0.5)", "0 20px 25px -5px rgba(0,0,0,0.6)", "0 10px 15px -3px rgba(0,0,0,0.5)"]
                         } : { scale: 1, y: 0 }}
                         transition={isActive ? { duration: 2, repeat: Infinity, repeatType: "reverse" } : { duration: 0.2 }}
                         className={`
                           w-10 h-10 md:w-14 md:h-14 flex items-center justify-center
                           bg-gradient-to-br ${isActive ? link.color : 'from-slate-700 to-slate-800'}
                           ${isActive ? 'rounded-full' : 'rounded-2xl'}
                           shadow-lg border-t border-white/20 border-b border-black/40
                           transition-all duration-500 relative overflow-hidden
                         `}
                       >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                          
                          <link.icon 
                            size={20} 
                            className={`md:w-6 md:h-6 relative z-10 transition-colors duration-300 drop-shadow-md ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} 
                            strokeWidth={isActive ? 2.5 : 2}
                          />

                          {isActive && (
                            <span className="absolute bottom-1 md:bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></span>
                          )}
                       </MotionDiv>
                    </button>
                  </div>
                );
              })}

              <div className="w-6 md:w-10 h-px bg-slate-700/50 mx-auto my-1 md:my-2"></div>

              <button 
                onClick={onLogout}
                className="group relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-800/80 hover:bg-red-900/50 border border-slate-700 hover:border-red-500/30 flex items-center justify-center transition-all mx-auto"
              >
                 <LogOut size={18} className="md:w-5 md:h-5 text-slate-400 group-hover:text-red-400" />
              </button>
           </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DashboardProps {
  role: 'admin' | 'worker';
  currentUser?: Worker | null;
  onLogout: () => void;
}

interface FinancialSummary {
  openingBalance: number;
  totalDelivery: number;
  officeShare: number;
  workerGrossShare: number;
  totalExpenses: number;
  netCashHand: number; 
  totalLiquidity: number; 
  workerEquity: number;
  workerNetProfit: number; 
}

interface ReportData {
  title: string;
  subtitle: string;
  worker?: Worker;
  orders: Order[];
  expenses?: Expense[];
  financials?: FinancialSummary;
  stats: { label: string; value: string; color: string }[];
  date: string;
}

const Dashboard: React.FC<DashboardProps> = ({ role, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>(role === 'admin' ? 'overview' : 'tasks');

  // --- Clock State ---
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Navigation Dock State ---
  const [isDockExpanded, setIsDockExpanded] = useState(true);
  const dockTimerRef = useRef<any>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const resetDockTimer = () => {
    setIsDockExpanded(true);
    if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    
    dockTimerRef.current = setTimeout(() => {
      setIsDockExpanded(false);
    }, 5000);
  };

  const handleDockMouseEnter = () => {
    setIsDockExpanded(true);
    if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
  };

  useEffect(() => {
    resetDockTimer();
    return () => {
      if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    };
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsDockExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // --- State Management ---
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const savedWorkers = localStorage.getItem('speed_delivery_workers');
    return savedWorkers ? JSON.parse(savedWorkers) : (INITIAL_WORKERS.length > 0 ? INITIAL_WORKERS : []);
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('speed_delivery_orders');
    return savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const savedExpenses = localStorage.getItem('speed_delivery_expenses');
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('speed_delivery_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('speed_delivery_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('speed_delivery_expenses', JSON.stringify(expenses));
  }, [expenses]);
  
  // --- NOTIFICATION & SOUND LOGIC ---
  useEffect(() => {
    if (role === 'worker' && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, [role]);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    const playTone = (freq: number, type: 'sine' | 'square', startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    playTone(880, 'square', now, 0.1);       
    playTone(660, 'square', now + 0.15, 0.1); 
    playTone(880, 'square', now + 0.3, 0.4);  
    
    setTimeout(() => {
       const now2 = audioContext.currentTime;
       playTone(880, 'square', now2, 0.1);
       playTone(660, 'square', now2 + 0.15, 0.1);
       playTone(880, 'square', now2 + 0.3, 0.4);
    }, 1000);
  };

  const showSystemNotification = (order: Order) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification("📦 طلب توصيل جديد!", {
          body: `من: ${order.fromLocation} \nإلى: ${order.toLocation} \nالسعر: ${order.price} DA`,
          icon: '/vite.svg', 
          tag: order.id, 
          requireInteraction: true 
        });
        notif.onclick = () => { window.focus(); notif.close(); };
      } catch (e) { console.error("Notification error:", e); }
    }
  };

  useEffect(() => {
    if (role === 'worker' && currentUser) {
      const intervalId = setInterval(() => {
        const storedOrdersStr = localStorage.getItem('speed_delivery_orders');
        if (storedOrdersStr) {
          const storedOrders: Order[] = JSON.parse(storedOrdersStr);
          const currentMyPending = orders.filter(o => o.workerId === currentUser.id && o.status === 'pending');
          const newMyPending = storedOrders.filter(o => o.workerId === currentUser.id && o.status === 'pending');
          
          if (newMyPending.length > currentMyPending.length) {
             const newOrder = newMyPending.find(no => !currentMyPending.some(co => co.id === no.id));
             if (newOrder) {
               setIncomingOrder(newOrder);
               playNotificationSound();
               showSystemNotification(newOrder);
               if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]); 
             }
          }
          if (JSON.stringify(storedOrders) !== JSON.stringify(orders)) {
             setOrders(storedOrders);
          }
        }
      }, 2000); 
      return () => clearInterval(intervalId);
    }
  }, [role, currentUser, orders]);

  useEffect(() => {
    if (role === 'admin') {
      const intervalId = setInterval(() => {
        const storedOrdersStr = localStorage.getItem('speed_delivery_orders');
        if (storedOrdersStr) {
          const storedOrders: Order[] = JSON.parse(storedOrdersStr);
          setOrders(currentOrders => {
             if (JSON.stringify(currentOrders) !== JSON.stringify(storedOrders)) return storedOrders;
             return currentOrders;
          });
        }
        const storedWorkersStr = localStorage.getItem('speed_delivery_workers');
        if (storedWorkersStr) {
           const storedWorkers: Worker[] = JSON.parse(storedWorkersStr);
           setWorkers(currentWorkers => {
              if (JSON.stringify(currentWorkers) !== JSON.stringify(storedWorkers)) return storedWorkers;
              return currentWorkers;
           });
        }
      }, 3000);
      return () => clearInterval(intervalId);
    }
  }, [role]);

  const setWorkerAvailability = (status: 'active' | 'suspended') => {
    if (!currentUser) return;
    setWorkers(prev => prev.map(w => 
      w.id === currentUser.id ? { ...w, status } : w
    ));
  };

  const triggerPdfGeneration = async (filename: string) => {
    const input = document.getElementById('printable-report');
    if (!input) {
        setGeneratingReportId(null);
        return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(input, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const imgScaledHeight = imgHeight * ratio;
      let heightLeft = imgScaledHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgScaledHeight);
      heightLeft -= pdfHeight;
      while (heightLeft >= 2) {
        position -= pdfHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgScaledHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(filename);
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("حدث خطأ أثناء إنشاء ملف PDF");
    } finally {
      setGeneratingReportId(null);
      setReportData(null);
    }
  };

  const prepareGlobalReport = () => {
    setGeneratingReportId('global');
    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.price, 0);
    const workerShare = Math.round(totalRevenue * (2/3));
    const companyShare = totalRevenue - workerShare;
    setReportData({
      title: "التقرير المالي العام",
      subtitle: "ملخص شامل لجميع العمليات والطلبات",
      orders: orders,
      date: new Date().toLocaleDateString('ar-DZ'),
      stats: [
        { label: "إجمالي الإيرادات", value: `${totalRevenue} DA`, color: "text-slate-800" },
        { label: "مستحقات العمال (2/3)", value: `${workerShare} DA`, color: "text-green-600" },
        { label: "حصة الشركة (1/3)", value: `${companyShare} DA`, color: "text-blue-600" },
        { label: "إجمالي الطلبات", value: orders.length.toString(), color: "text-slate-600" },
      ]
    });
  };

  const prepareWorkerReport = (worker: Worker) => {
    setGeneratingReportId(worker.id);
    const workerOrders = orders.filter(o => o.workerId === worker.id);
    const totalEarnings = workerOrders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.price, 0);
    const workerProfit = Math.round(totalEarnings * (2/3));
    const companyProfit = totalEarnings - workerProfit;
    setReportData({
      title: `تقرير أداء العامل: ${worker.name}`,
      subtitle: `رقم الهاتف: ${worker.phone}`,
      worker: worker,
      orders: workerOrders,
      date: new Date().toLocaleDateString('ar-DZ'),
      stats: [
        { label: "إجمالي المحصل", value: `${totalEarnings} DA`, color: "text-slate-800" },
        { label: "صافي الربح (2/3)", value: `${workerProfit} DA`, color: "text-green-600" },
        { label: "مستحقات الشركة (1/3)", value: `${companyProfit} DA`, color: "text-red-600" },
        { label: "الطلبات المنجزة", value: worker.ordersCompleted.toString(), color: "text-slate-600" },
      ]
    });
  };

  const prepareWorkerDailyReport = () => {
    if (!currentUser) return;
    setGeneratingReportId('daily-worker');
    const currentWorker = workers.find(w => w.id === currentUser.id) || currentUser;
    const myOrders = orders.filter(o => o.workerId === currentWorker.id && o.status === 'delivered');
    const myExpenses = expenses.filter(e => e.workerId === currentWorker.id);

    const totalDelivery = myOrders.reduce((acc, curr) => acc + curr.price, 0);
    const totalExpenses = myExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const openingBalance = currentWorker.openingBalance || 0;
    
    const totalLiquidity = openingBalance + totalDelivery;
    const remainingFromTotal = totalLiquidity - totalExpenses; 
    
    const officeShare = Math.round(totalDelivery / 3);
    const workerGrossShare = totalDelivery - officeShare; 
    const workerNetProfit = workerGrossShare - totalExpenses; 
    const workerEquity = openingBalance + workerNetProfit; 

    setReportData({
      title: "كشف حساب يومي",
      subtitle: `السائق: ${currentWorker.name}`,
      worker: currentWorker,
      orders: myOrders,
      expenses: myExpenses,
      financials: {
        openingBalance,
        totalDelivery,
        officeShare,
        workerGrossShare,
        totalExpenses,
        netCashHand: remainingFromTotal,
        totalLiquidity,
        workerEquity,
        workerNetProfit
      },
      date: new Date().toLocaleDateString('ar-DZ'),
      stats: [] 
    });
  };

  useEffect(() => {
    if (reportData) {
       const filename = reportData.worker 
          ? `Daily_Report_${reportData.worker.name.replace(/\s/g, '_')}_${Date.now()}.pdf`
          : `Global_Report_${Date.now()}.pdf`;
       triggerPdfGeneration(filename);
    }
  }, [reportData]);

  // ... Modal States ...
  const [selectedWorkerForReport, setSelectedWorkerForReport] = useState<Worker | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ amount: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, workerId: string | null, workerName: string, isSelf?: boolean}>({ isOpen: false, workerId: null, workerName: '', isSelf: false });
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', password: '', status: 'active' as 'active' | 'suspended' });
  const [orderForm, setOrderForm] = useState({ from: '', to: '', price: '', phone: '', workerId: '', description: '' });

  const addNotification = (workerName: string, action: string, orderId: string, type: 'info' | 'success' | 'warning') => {
    const newNotif: Notification = { id: Date.now().toString(), workerName, action, orderId, time: new Date().toLocaleTimeString('ar-DZ'), type };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleWorkerOrderAction = (orderId: string, action: 'accept' | 'reject' | 'deliver') => {
    if (!currentUser) return;
    if (incomingOrder && incomingOrder.id === orderId) setIncomingOrder(null);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    const updatedOrders = [...orders];
    const order = updatedOrders[orderIndex];
    if (action === 'accept') {
      order.status = 'accepted';
      addNotification('النظام', 'تم قبول المهمة وبدء التوصيل', orderId, 'info');
    } else if (action === 'reject') {
      order.status = 'cancelled'; 
      order.workerId = null; 
      addNotification('النظام', 'قام العامل برفض الطلب', orderId, 'warning');
    } else if (action === 'deliver') {
      order.status = 'delivered';
      addNotification('النظام', 'تم توصيل الطلب بنجاح', orderId, 'success');
      const updatedWorkers = workers.map(w => {
        if (w.id === currentUser.id) {
          return { ...w, ordersCompleted: w.ordersCompleted + 1, totalEarnings: w.totalEarnings + order.price };
        }
        return w;
      });
      setWorkers(updatedWorkers);
    }
    setOrders(updatedOrders);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const newExpense: Expense = { id: `EXP-${Date.now()}`, workerId: currentUser.id, title: expenseForm.title, amount: parseFloat(expenseForm.amount), date: new Date().toLocaleDateString('ar-DZ'), time: new Date().toLocaleTimeString('ar-DZ') };
    setExpenses(prev => [newExpense, ...prev]);
    setIsExpenseModalOpen(false);
    setExpenseForm({ title: '', amount: '' });
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) setExpenses(expenses.filter(e => e.id !== id));
  };

  const openWorkerModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setWorkerForm({ name: worker.name, phone: worker.phone, password: '', status: worker.status });
    } else {
      setEditingWorker(null);
      setWorkerForm({ name: '', phone: '', password: '', status: 'active' });
    }
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const isPhoneDuplicate = workers.some(w => w.phone === workerForm.phone && w.id !== editingWorker?.id);
    if (isPhoneDuplicate) { alert('خطأ: رقم الهاتف مسجل مسبقاً لعامل آخر.'); return; }
    if (editingWorker) {
      setWorkers(workers.map(w => w.id === editingWorker.id ? { ...w, name: workerForm.name, phone: workerForm.phone, password: workerForm.password ? workerForm.password : w.password, status: w.status } : w));
    } else {
      const newId = `W-${Math.floor(Math.random() * 10000)}`;
      const newWorker: Worker = { id: newId, name: workerForm.name, phone: workerForm.phone, password: workerForm.password, status: 'active', ordersCompleted: 0, totalEarnings: 0, openingBalance: 0, lastLogin: 'لم يسجل دخول بعد' };
      setWorkers([...workers, newWorker]);
    }
    setIsWorkerModalOpen(false);
  };

  const openBalanceModal = (worker: Worker) => {
    setEditingWorker(worker);
    setBalanceForm({ amount: worker.openingBalance ? worker.openingBalance.toString() : '' });
    setIsBalanceModalOpen(true);
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    const inputValue = balanceForm.amount;
    const newBalance = inputValue === '' ? 0 : parseFloat(inputValue);
    if (isNaN(newBalance)) { alert('الرجاء إدخال مبلغ صحيح'); return; }
    setWorkers(workers.map(w => w.id === editingWorker.id ? { ...w, openingBalance: newBalance } : w));
    setIsBalanceModalOpen(false);
    setEditingWorker(null);
  };

  const handleDeleteWorkerClick = (worker: Worker, e: React.MouseEvent, isSelf: boolean = false) => {
    if (e) e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, workerId: worker.id, workerName: worker.name, isSelf });
  };

  const executeDeleteWorker = () => {
    if (deleteConfirmation.workerId) {
      setWorkers(prev => prev.filter(w => w.id !== deleteConfirmation.workerId));
      setDeleteConfirmation({ isOpen: false, workerId: null, workerName: '', isSelf: false });
      if (deleteConfirmation.isSelf) onLogout();
    }
  };

  const openOrderModal = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({ from: order.fromLocation, to: order.toLocation, price: order.price.toString(), phone: order.customerPhone, workerId: order.workerId || '' , description: order.description || '' });
    } else {
      setEditingOrder(null);
      setOrderForm({ from: '', to: '', price: '', phone: '', workerId: '', description: '' });
    }
    setIsOrderModalOpen(true);
  };

  // Helper function for sequential ID generation
  const getNextOrderId = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, ''); // Format: 26022024
    const storageKey = 'speed_delivery_daily_seq';
    
    let seq = 1;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
       try {
           const data = JSON.parse(stored);
           // If date matches today, increment sequence. Else start from 1.
           if (data.date === dateStr) {
              seq = data.count + 1;
           }
       } catch (e) {
           console.error("Error parsing sequence", e);
       }
    }
    
    localStorage.setItem(storageKey, JSON.stringify({ date: dateStr, count: seq }));
    // Return format: YYYYMMDD-SEQ (e.g., 26022024-1)
    return `${dateStr}-${seq}`; 
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedWorker = workers.find(w => w.id === orderForm.workerId);
    if (editingOrder) {
      setOrders(orders.map(o => o.id === editingOrder.id ? { ...o, fromLocation: orderForm.from, toLocation: orderForm.to, price: Number(orderForm.price), customerPhone: orderForm.phone, workerId: orderForm.workerId, workerName: selectedWorker?.name, description: orderForm.description } : o));
    } else {
      // Use the new sequential ID generator
      const newId = getNextOrderId();
      
      const newOrder: Order = { id: newId, fromLocation: orderForm.from, toLocation: orderForm.to, price: Number(orderForm.price), customerPhone: orderForm.phone, workerId: orderForm.workerId, workerName: selectedWorker?.name || 'غير محدد', status: 'pending', date: new Date().toLocaleDateString('en-GB'), time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), description: orderForm.description };
      setOrders([newOrder, ...orders]);
      if (selectedWorker) addNotification(selectedWorker.name, `تم إرسال طلب جديد: ${orderForm.from} ◄ ${orderForm.to} (${orderForm.price} DA)`, newId, 'info');
    }
    setIsOrderModalOpen(false);
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm('تأكيد الحذف النهائي للطلب؟')) setOrders(orders.filter(o => o.id !== id));
  };

  const getWorkerStats = (workerId: string) => {
    const workerOrders = orders.filter(o => o.workerId === workerId);
    const completed = workerOrders.filter(o => o.status === 'delivered').length;
    const totalEarnings = workerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.price, 0);
    const workerProfit = Math.round(totalEarnings * (2/3));
    const companyProfit = totalEarnings - workerProfit;
    return { total: workerOrders.length, completed, totalEarnings, workerProfit, companyProfit, workerOrders };
  };

  // --- RENDER WORKER PANEL ---
  const renderWorkerPanel = () => {
    if (!currentUser) return <div>Loading...</div>;
    const myProfile = workers.find(w => w.id === currentUser.id) || currentUser;
    const myOrders = orders.filter(o => o.workerId === currentUser.id);
    const myStats = getWorkerStats(currentUser.id);
    const pendingOrders = myOrders.filter(o => o.status === 'pending');
    const activeOrders = myOrders.filter(o => o.status === 'accepted');
    const historyOrders = myOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

    const renderWorkerOverview = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div onClick={() => setActiveTab('tasks')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center">
            <div className={`w-10 h-10 ${pendingOrders.length > 0 ? 'bg-orange-500 text-white animate-bounce' : 'bg-blue-500/20 text-blue-500'} rounded-full flex items-center justify-center mb-2`}>
              <Package size={20} />
            </div>
            <span className="text-2xl font-bold">{pendingOrders.length}</span>
            <span className="text-xs text-slate-400">طلب جديد</span>
          </div>
          <div onClick={() => setActiveTab('tasks')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-2">
              <Bike size={20} />
            </div>
            <span className="text-2xl font-bold">{activeOrders.length}</span>
            <span className="text-xs text-slate-400">قيد التوصيل</span>
          </div>
          <div onClick={() => setActiveTab('history')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={20} />
            </div>
            <span className="text-2xl font-bold">{myStats.completed}</span>
            <span className="text-xs text-slate-400">مكتمل</span>
          </div>
          <div onClick={() => setActiveTab('wallet')} className="cursor-pointer hover:scale-[1.02] transition-transform bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <Banknote size={20} />
            </div>
            <span className="text-2xl font-bold text-green-400">{myStats.workerProfit}</span>
            <span className="text-xs text-slate-400">صافي الربح (DA)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ClipboardList size={20} className="text-slate-400" />
              المهام الحالية
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 animate-pulse">
              <RefreshCw size={10} /> تحديث تلقائي
            </span>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
            {pendingOrders.map(order => (
              <MotionDiv 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={order.id} 
                className="bg-slate-800 rounded-2xl p-1 border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/10 relative overflow-hidden group"
              >
                 <div className="bg-slate-900/50 p-5 rounded-xl h-full">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg z-10 flex items-center gap-2">
                       <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
                        </span>
                       طلب جديد!
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 mt-4">
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex items-center gap-3 text-slate-200 bg-slate-800 p-2 rounded-lg">
                              <MapPin size={18} className="text-red-500 shrink-0" /> 
                              <span className="text-sm font-bold truncate">من: {order.fromLocation}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-200 bg-slate-800 p-2 rounded-lg">
                              <MapPin size={18} className="text-green-500 shrink-0" /> 
                              <span className="text-sm font-bold truncate">إلى: {order.toLocation}</span>
                          </div>
                        </div>
                        <div className="text-2xl font-black text-yellow-400 mr-4 whitespace-nowrap">{order.price} <span className="text-xs text-slate-500 font-medium">DA</span></div>
                    </div>

                    {order.description && (
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 mb-6 text-sm text-slate-300 relative">
                             <span className="absolute -top-2.5 right-3 bg-slate-700 text-xs px-2 py-0.5 rounded text-slate-400 border border-slate-600">وصف الطلبية</span>
                             <p className="mt-1 flex items-start gap-2">
                                <FileText size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                {order.description}
                             </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button 
                          onClick={() => handleWorkerOrderAction(order.id, 'accept')}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-600/20"
                        >
                          <Check size={20} strokeWidth={3} /> قبول المهمة
                        </button>
                        <button 
                          onClick={() => handleWorkerOrderAction(order.id, 'reject')}
                          className="px-5 bg-slate-700 hover:bg-red-500/20 hover:text-red-500 text-slate-300 rounded-xl font-bold transition-colors"
                        >
                          <XCircle size={24} />
                        </button>
                    </div>
                 </div>
              </MotionDiv>
            ))}
            </AnimatePresence>

            {activeOrders.map(order => (
              <div key={order.id} className="bg-slate-800 rounded-2xl p-5 border-l-4 border-blue-500 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl animate-pulse">جاري التوصيل...</div>
                 
                 <div className="flex flex-col gap-3 mb-6 mt-4">
                    <div className="flex items-center justify-between">
                       <span className="text-slate-400 text-xs">رقم الطلب: {order.id}</span>
                       <span className="text-slate-400 text-xs">{order.time}</span>
                    </div>
                    <div className="h-px bg-slate-700 w-full"></div>
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-3 text-slate-200">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-red-500"><Navigation size={16}/></div>
                          <span className="font-medium">{order.fromLocation}</span>
                       </div>
                       <div className="h-4 border-l-2 border-dashed border-slate-600 mr-4"></div>
                       <div className="flex items-center gap-3 text-slate-200">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-green-500"><MapPin size={16}/></div>
                          <span className="font-medium">{order.toLocation}</span>
                       </div>
                    </div>
                 </div>

                 {order.description && (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mb-6 text-sm text-slate-300 flex items-start gap-2">
                         <FileText size={16} className="text-slate-500 mt-0.5 shrink-0" />
                         <span>{order.description}</span>
                    </div>
                 )}

                 <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={`tel:${order.customerPhone}`}
                      className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <PhoneCall size={18} /> اتصال
                    </a>
                    <button 
                      onClick={() => handleWorkerOrderAction(order.id, 'deliver')}
                      className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                    >
                      <CheckCircle size={18} /> تم التوصيل
                    </button>
                 </div>
              </div>
            ))}

            {pendingOrders.length === 0 && activeOrders.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="opacity-50" />
                 </div>
                 <p>لا توجد مهام نشطة حالياً</p>
                 <p className="text-xs mt-2">ستصلك إشعارات عند تعيين طلبات جديدة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    const renderWorkerHistory = () => (
      <div className="space-y-4">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
           <History size={20} className="text-slate-400" />
           سجل الطلبات
        </h3>
        {historyOrders.length === 0 ? (
           <div className="text-center py-12 text-slate-500">لا يوجد سجل سابق</div>
        ) : (
          historyOrders.map(order => (
            <div key={order.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-sm font-bold text-white">{order.toLocation}</span>
                     <StatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-slate-400 flex gap-2">
                     <span>{order.date}</span>
                     <span>•</span>
                     <span>{order.time}</span>
                  </div>
               </div>
               <div className="text-green-400 font-bold">
                  {order.price} DA
               </div>
            </div>
          ))
        )}
      </div>
    );

    const renderWorkerWallet = () => {
        const myExpenses = expenses.filter(e => e.workerId === currentUser.id);
        const totalExpenses = myExpenses.reduce((sum, e) => sum + e.amount, 0);
        const deliveryTotal = myStats.totalEarnings; 
        const openingBalance = myProfile.openingBalance || 0;
        const officeShare = Math.round(deliveryTotal / 3);
        const workerGrossProfit = deliveryTotal - officeShare;
        const totalLiquidity = openingBalance + deliveryTotal;
        const netCashHand = totalLiquidity - totalExpenses;
        const workerNetProfit = workerGrossProfit - totalExpenses;
        const workerEquity = openingBalance + workerNetProfit; 

        return (
          <div className="space-y-6">
             <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="bg-blue-600 p-3 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-white">
                      <Banknote size={20} />
                      <span className="font-bold">الرصيد الافتتاحي</span>
                   </div>
                   <span className="font-black text-xl text-white">{openingBalance.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-700">
                   <div className="flex flex-col">
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800/50">
                         <span className="text-sm text-slate-300">مجموع التوصيل</span>
                         <span className="font-bold text-white">{deliveryTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800/50">
                         <span className="text-sm text-slate-300">فائدة مكتب التوصيل</span>
                         <span className="font-bold text-blue-400">{officeShare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-900/20">
                         <span className="text-sm text-green-400 font-bold">الفائدة (2/3)</span>
                         <span className="font-bold text-green-400">{workerGrossProfit.toFixed(2)}</span>
                      </div>
                   </div>
                   <div className="flex flex-col">
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-blue-900/20">
                         <span className="text-sm text-blue-300 font-bold">مجموع المصروف</span>
                         <span className="font-bold text-blue-300">{totalExpenses.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-yellow-900/20">
                         <span className="text-sm text-yellow-400 font-bold">الباقي من سعر الكلي</span>
                         <span className="font-bold text-yellow-400">{netCashHand.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-green-900/10">
                         <span className="text-sm text-slate-300">السعر الكلي</span>
                         <span className="font-bold text-white">{totalLiquidity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-yellow-600/20">
                         <span className="text-sm text-yellow-200 font-bold">السعر الكلي الصافي</span>
                         <span className="font-bold text-yellow-200">{workerEquity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-400/20">
                         <span className="text-sm text-yellow-300 font-bold">الباقي من الفائدة</span>
                         <span className="font-bold text-yellow-300">{workerNetProfit.toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {(!myProfile.openingBalance || myProfile.openingBalance === 0) ? (
                 <button 
                   onClick={() => openBalanceModal(myProfile)}
                   className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-600"
                 >
                    <Plus size={16} /> إدخال الرصيد الافتتاحي
                 </button>
               ) : (
                 <button 
                   onClick={() => openBalanceModal(myProfile)}
                   className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-600"
                 >
                    <RefreshCw size={16} /> تعديل الرصيد الافتتاحي
                 </button>
               )}
               
               <button 
                  onClick={prepareWorkerDailyReport}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl border border-slate-600 flex items-center justify-center gap-2 font-bold transition-all"
               >
                  {generatingReportId === 'daily-worker' ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18} className="text-blue-400"/>}
                  <span>تصدير التقرير (PDF)</span>
               </button>
             </div>

             <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                   <h3 className="font-bold flex items-center gap-2">
                      <Receipt size={20} className="text-red-500" />
                      المصاريف
                   </h3>
                   <button 
                     onClick={() => setIsExpenseModalOpen(true)}
                     className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors shadow-lg shadow-red-600/20"
                   >
                      <Plus size={16} /> إضافة مصروف
                   </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                   {myExpenses.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                         <Receipt size={32} className="mx-auto mb-2 opacity-20" />
                         <p className="text-sm">لا توجد مصاريف مسجلة</p>
                      </div>
                   ) : (
                      <table className="w-full text-right text-sm">
                         <thead className="bg-slate-900/50 text-slate-400 sticky top-0">
                            <tr>
                               <th className="p-3 font-medium">التفاصيل</th>
                               <th className="p-3 font-medium">المبلغ</th>
                               <th className="p-3 font-medium w-10"></th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-700">
                            {myExpenses.map(expense => (
                               <tr key={expense.id} className="group hover:bg-slate-700/30 transition-colors">
                                  <td className="p-3">
                                     <p className="font-bold text-slate-200">{expense.title}</p>
                                     <p className="text-[10px] text-slate-500">{expense.date} • {expense.time}</p>
                                  </td>
                                  <td className="p-3 font-bold text-red-400">-{expense.amount} DA</td>
                                  <td className="p-3 text-center">
                                     <button 
                                       onClick={() => handleDeleteExpense(expense.id)}
                                       className="text-slate-600 hover:text-red-500 transition-colors p-1"
                                     >
                                        <Trash2 size={14} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   )}
                </div>
             </div>
          </div>
        );
    };
    
    const renderWorkerSettings = () => (
      <div className="space-y-6">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
           <Settings size={20} className="text-slate-400" />
           إعدادات الحساب
        </h3>
        
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white">
                 {myProfile.name.charAt(0)}
              </div>
              <div>
                 <h3 className="font-bold text-xl">{myProfile.name}</h3>
                 <p className="text-slate-400">{myProfile.phone}</p>
                 <span className="inline-block mt-2 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">حساب نشط</span>
              </div>
           </div>
        </div>
      </div>
    );

    switch(activeTab) {
        case 'tasks': return renderWorkerOverview();
        case 'history': return renderWorkerHistory();
        case 'wallet': return renderWorkerWallet();
        case 'settings': return renderWorkerSettings();
        default: return renderWorkerOverview();
    }
  };

  // --- RENDER ADMIN PANEL ---
  const renderAdminPanel = () => {
    const renderAdminOverview = () => {
        const totalOrders = orders.length;
        const activeWorkersCount = workers.filter(w => w.status === 'active').length;
        const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.price, 0);
        const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
        const recentOrders = orders.slice(0, 8);

        const adminStats = [
            { label: 'الطلبات الكلية', value: totalOrders.toString(), color: 'bg-blue-500', icon: Package },
            { label: 'السائقين النشطين', value: activeWorkersCount.toString(), color: 'bg-green-500', icon: Bike },
            { label: 'طلبات قيد الانتظار', value: pendingOrdersCount.toString(), color: 'bg-orange-500', icon: Clock },
            { label: 'الإيرادات (DA)', value: totalRevenue.toLocaleString(), color: 'bg-yellow-500', icon: BarChart3 },
        ];

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminStats.map((stat, idx) => (
                 <div key={idx} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
                    <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center mb-2 text-white shadow-lg`}>
                       <stat.icon size={20} />
                    </div>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                    <span className="text-xs text-slate-400">{stat.label}</span>
                 </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col h-[500px]">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                     <Activity size={20} className="text-blue-500" />
                     سجل الطلبات المباشر (Latest Orders)
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                     {recentOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                           <Package size={48} className="opacity-20 mb-2" />
                           <p>لا توجد طلبات حديثة</p>
                        </div>
                     ) : (
                        recentOrders.map(order => (
                           <div key={order.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3 hover:border-slate-500 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 shrink-0">
                                 {order.workerName ? order.workerName.charAt(0) : '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-white truncate">
                                       {order.workerName || <span className="text-red-400 italic text-xs">غير محدد</span>}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">{order.time}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs mb-1.5">
                                    <div className="flex items-center gap-1 text-slate-300 max-w-[45%] truncate">
                                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                                       <span className="truncate">{order.fromLocation}</span>
                                    </div>
                                    <ArrowRight size={10} className="text-slate-600 shrink-0" />
                                    <div className="flex items-center gap-1 text-slate-300 max-w-[45%] truncate">
                                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                                       <span className="truncate">{order.toLocation}</span>
                                    </div>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-yellow-500 font-bold text-xs">{order.price} DA</span>
                                    <StatusBadge status={order.status} />
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-[500px]">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                     <TrendingUp size={20} className="text-green-500" />
                     إجراءات سريعة
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => openOrderModal()} className="bg-slate-700 hover:bg-slate-600 p-6 rounded-2xl flex flex-col items-center gap-3 transition-colors border border-slate-600 hover:border-green-500/50 group">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors text-green-500">
                           <Plus size={24} />
                        </div>
                        <span className="text-sm font-bold">إضافة طلب جديد</span>
                     </button>
                     <button onClick={() => openWorkerModal()} className="bg-slate-700 hover:bg-slate-600 p-6 rounded-2xl flex flex-col items-center gap-3 transition-colors border border-slate-600 hover:border-blue-500/50 group">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500">
                           <Users size={24} />
                        </div>
                        <span className="text-sm font-bold">إضافة عامل جديد</span>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        );
    }

    const renderAdminWorkers = () => (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl flex items-center gap-2">
               <Users size={24} className="text-purple-500" />
               قائمة العمال
            </h3>
            <button onClick={() => openWorkerModal()} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors">
               <Plus size={18} /> إضافة عامل
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map(worker => (
               <div key={worker.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-purple-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
                           {worker.name.charAt(0)}
                        </div>
                        <div>
                           <h4 className="font-bold text-white">{worker.name}</h4>
                           <p className="text-xs text-slate-400">{worker.phone}</p>
                        </div>
                     </div>
                     <div className="relative">
                        <button className="text-slate-400 hover:text-white p-1" onClick={() => openWorkerModal(worker)}>
                           <Edit size={16} />
                        </button>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                     <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                        <p className="text-xs text-slate-500">طلبات منجزة</p>
                        <p className="font-bold">{worker.ordersCompleted}</p>
                     </div>
                     <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                        <p className="text-xs text-slate-500">أرباح (DA)</p>
                        <p className="font-bold text-green-400">{worker.totalEarnings}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <div className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border ${worker.status === 'active' ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>
                        {worker.status === 'active' ? <UserCheck size={16}/> : <UserX size={16}/>}
                        {worker.status === 'active' ? 'متاح للعمل' : 'غير متاح'}
                     </div>
                     <button onClick={(e) => handleDeleteWorkerClick(worker, e)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg transition-colors" title="حذف الحساب">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );

    const renderAdminOrders = () => (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl flex items-center gap-2">
               <Package size={24} className="text-orange-500" />
               إدارة الطلبات
            </h3>
            <button onClick={() => openOrderModal()} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors">
               <Plus size={18} /> طلب جديد
            </button>
         </div>

         <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-right">
                  <thead>
                     <tr className="bg-slate-900/50 text-slate-400 text-sm">
                        <th className="p-4">رقم الطلب</th>
                        <th className="p-4">من - إلى</th>
                        <th className="p-4">السائق</th>
                        <th className="p-4">السعر</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">الإجراءات</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                     {orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                           <td className="p-4 font-mono text-sm text-slate-300" dir="ltr">{order.id}</td>
                           <td className="p-4">
                              <div className="flex flex-col gap-1 text-sm">
                                 <span className="flex items-center gap-1"><MapPin size={12} className="text-red-500"/> {order.fromLocation}</span>
                                 <span className="flex items-center gap-1"><MapPin size={12} className="text-green-500"/> {order.toLocation}</span>
                              </div>
                           </td>
                           <td className="p-4 text-sm">
                              {order.workerName || <span className="text-slate-500 italic">غير محدد</span>}
                           </td>
                           <td className="p-4 font-bold text-yellow-400">{order.price} DA</td>
                           <td className="p-4">
                              <StatusBadge status={order.status} />
                           </td>
                           <td className="p-4 flex gap-2">
                              <button onClick={() => openOrderModal(order)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors">
                                 <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteOrder(order.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {orders.length === 0 && (
               <div className="p-8 text-center text-slate-500">لا توجد طلبات مسجلة</div>
            )}
         </div>
      </div>
    );
    
    const renderAdminReports = () => (
      <div className="space-y-6">
         <h3 className="font-bold text-xl flex items-center gap-2">
            <FileText size={24} className="text-green-500" />
            التقارير المالية
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={prepareGlobalReport} className="cursor-pointer bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-green-500 transition-all group text-center">
               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 group-hover:scale-110 transition-transform">
                  <BarChart3 size={32} />
               </div>
               <h4 className="font-bold text-lg mb-2">التقرير العام</h4>
               <p className="text-sm text-slate-400 mb-4">توليد تقرير شامل لجميع العمليات والمدخولات المالية للنظام.</p>
               <span className="text-green-500 text-sm font-bold flex items-center justify-center gap-1">
                  {generatingReportId === 'global' ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                  تحميل PDF
               </span>
            </div>

            <div className="md:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
               <h4 className="font-bold text-lg mb-4">تقارير العمال</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workers.map(worker => (
                     <div key={worker.id} onClick={() => prepareWorkerReport(worker)} className="cursor-pointer bg-slate-900/50 p-3 rounded-xl border border-slate-700 hover:border-blue-500 flex items-center gap-3 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                           {worker.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                           <p className="font-bold text-sm text-white">{worker.name}</p>
                           <p className="text-xs text-slate-500">الأرباح: {worker.totalEarnings} DA</p>
                        </div>
                        {generatingReportId === worker.id ? <Loader2 className="animate-spin text-blue-500" size={16} /> : <Download size={16} className="text-slate-500" />}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    );

    switch(activeTab) {
       case 'overview': return renderAdminOverview();
       case 'workers': return renderAdminWorkers();
       case 'orders': return renderAdminOrders();
       case 'reports': return renderAdminReports();
       default: return renderAdminOverview();
    }
  };

  const getLiveWorker = () => {
    if (!currentUser) return null;
    return workers.find(w => w.id === currentUser.id) || currentUser;
  }
  const liveWorker = getLiveWorker();

  return (
    <div className="min-h-screen bg-slate-900 flex text-white font-sans relative">
      
      <NavigationDock 
        role={role}
        activeTab={activeTab}
        setActiveTab={(id) => { setActiveTab(id); resetDockTimer(); }}
        onLogout={onLogout}
        isDockExpanded={isDockExpanded}
        setIsDockExpanded={setIsDockExpanded}
        dockRef={dockRef}
        onMouseEnter={handleDockMouseEnter}
        onMouseLeave={resetDockTimer}
        resetDockTimer={resetDockTimer}
      />
      
      {/* HIDDEN REPORT TEMPLATE */}
      {reportData && (
        <div id="printable-report" className="fixed top-0 left-0 -z-50 w-[210mm] min-h-[297mm] bg-white text-slate-900 font-sans flex flex-col" dir="rtl">
           <div className="h-4 bg-slate-800 w-full"></div>
           <div className="p-10 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-8 border-b-2 border-slate-100 pb-6">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-sm">
                          <Bike size={32} />
                      </div>
                      <div>
                          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">SPEED DELIVERY</h1>
                          <p className="text-sm text-slate-500 font-bold tracking-[0.2em]">OUARGLA</p>
                      </div>
                  </div>
                  <div className="text-left">
                      <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-400 font-bold mb-1">تاريخ التقرير</p>
                          <p className="text-lg font-mono font-bold text-slate-800">{reportData.date}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 flex justify-between items-center shadow-sm">
                  <div>
                      <p className="text-xs text-slate-400 font-bold">اسم السائق</p>
                      <p className="text-xl font-bold text-slate-800">{reportData.worker?.name}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 mx-4"></div>
                  <div>
                      <p className="text-xs text-slate-400 font-bold">رقم الهاتف</p>
                      <p className="text-lg font-mono font-bold text-slate-700">{reportData.worker?.phone}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 mx-4"></div>
                  <div className="text-left">
                      <p className="text-xs text-slate-400 font-bold">عدد الطلبات</p>
                      <p className="text-xl font-black text-blue-600">{reportData.orders.length}</p>
                  </div>
              </div>

              <div className="flex gap-6 mb-8 flex-1 items-start">
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <Package size={18} className="text-blue-500" />
                              قائمة التوصيلات
                          </h3>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">{reportData.orders.length} طلب</span>
                      </div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                    <th className="p-3">إلى (الوجهة)</th>
                                    <th className="p-3">السعر</th>
                                    <th className="p-3 text-left">التوقيت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.orders.map((order, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                        <td className="p-3 font-medium text-slate-800">{order.toLocation}</td>
                                        <td className="p-3 font-bold text-slate-900">{order.price}</td>
                                        <td className="p-3 font-mono text-slate-500 text-left">{order.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>

                  <div className="w-1/3">
                      <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <Receipt size={18} className="text-red-500" />
                              المصاريف
                          </h3>
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold">
                              {reportData.expenses?.length || 0}
                          </span>
                      </div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                    <th className="p-3">البيان</th>
                                    <th className="p-3 text-left">المبلغ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.expenses && reportData.expenses.length > 0 ? (
                                    reportData.expenses.map((expense, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                            <td className="p-3 text-slate-700">{expense.title}</td>
                                            <td className="p-3 font-bold text-red-600 text-left">{expense.amount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="p-4 text-center text-slate-400 italic">لا توجد مصاريف</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>

              {reportData.financials && (
                <div className="mb-4">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Calculator size={18} className="text-slate-600" />
                        الخلاصة المالية
                    </h3>
                    <div className="border-2 border-slate-800 text-sm shadow-sm">
                        <div className="flex divide-x divide-x-reverse divide-slate-800">
                            <div className="flex-1 flex flex-col">
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800 bg-[#92D050]">
                                    <div className="flex-1 p-2 font-bold text-center text-black">{reportData.financials.totalDelivery}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#82C040]">مجموع التوصيل</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800 bg-[#92D050]">
                                    <div className="flex-1 p-2 font-bold text-center text-black">{reportData.financials.officeShare}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#82C040]">فائدة المكتب</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800 bg-[#92D050] flex-1">
                                    <div className="flex-1 p-2 font-bold text-center text-black flex items-center justify-center">{reportData.financials.workerGrossShare}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#82C040] flex items-center justify-center">الفائدة (السائق)</div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800">
                                    <div className="flex-1 p-2 font-bold text-center text-white bg-[#00B0F0]">{reportData.financials.openingBalance}</div>
                                    <div className="w-48 p-2 font-bold text-center text-white bg-[#0090C0]">الرصيد الافتتاحي</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800">
                                    <div className="flex-1 p-2 font-bold text-center text-white bg-[#00B0F0]">{reportData.financials.totalExpenses}</div>
                                    <div className="w-48 p-2 font-bold text-center text-white bg-[#0090C0]">مجموع المصروف</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800">
                                    <div className="flex-1 p-2 font-bold text-center text-black bg-[#FFC000]">{reportData.financials.netCashHand}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#EFA000]">الباقي من سعر الكلي</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800">
                                    <div className="flex-1 p-2 font-bold text-center text-black bg-[#92D050]">{reportData.financials.totalLiquidity}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#82C040]">السعر الكلي</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800 border-b border-slate-800">
                                    <div className="flex-1 p-2 font-bold text-center text-black bg-[#FFC000]">{reportData.financials.workerEquity}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#EFA000]">السعر الكلي الصافي</div>
                                </div>
                                <div className="flex divide-x divide-x-reverse divide-slate-800">
                                    <div className="flex-1 p-2 font-bold text-center text-black bg-[#FFFF00]">{reportData.financials.workerNetProfit}</div>
                                    <div className="w-48 p-2 font-bold text-center text-black bg-[#E0E000]">الباقي من الفائدة</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              <div className="mt-8 flex justify-between items-end border-t border-slate-200 pt-4">
                  <div className="text-xs text-slate-400">
                      تم استخراج هذا التقرير آلياً من نظام Speed Delivery
                      <br />
                      {new Date().toLocaleString('ar-DZ')}
                  </div>
                  <div className="flex gap-16">
                      <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 mb-8">توقيع السائق</p>
                          <div className="w-32 h-px bg-slate-300"></div>
                      </div>
                      <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 mb-8">توقيع الإدارة</p>
                          <div className="w-32 h-px bg-slate-300"></div>
                      </div>
                  </div>
              </div>
           </div>
           <div className="h-4 bg-slate-800 w-full mt-auto"></div>
        </div>
      )}

      {/* NEW: Full Screen Incoming Order Alert for Workers */}
      <AnimatePresence>
        {incomingOrder && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <MotionDiv 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-full max-w-sm relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-500/20 blur-[50px] rounded-full animate-pulse"></div>
                    <div className="bg-slate-800 border-2 border-yellow-500 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500 animate-pulse"></div>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-yellow-500 text-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-bounce">
                                <Bell size={40} className="animate-wiggle" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-1">طلب جديد!</h2>
                            <p className="text-yellow-400 font-bold">يرجى الاستجابة فوراً</p>
                        </div>
                        <div className="space-y-4 mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-red-500 border border-slate-700"><Navigation size={16}/></div>
                                 <div className="flex-1">
                                     <p className="text-xs text-slate-500">من</p>
                                     <p className="font-bold text-white text-sm">{incomingOrder.fromLocation}</p>
                                 </div>
                             </div>
                             <div className="flex justify-center -my-2 pl-4">
                                 <div className="h-6 border-l-2 border-dashed border-slate-700"></div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-green-500 border border-slate-700"><MapPin size={16}/></div>
                                 <div className="flex-1">
                                     <p className="text-xs text-slate-500">إلى</p>
                                     <p className="font-bold text-white text-sm">{incomingOrder.toLocation}</p>
                                 </div>
                             </div>
                             {incomingOrder.description && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                   <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><FileText size={10}/> ملاحظات:</p>
                                   <p className="text-sm text-slate-200 bg-slate-800 p-2 rounded-lg border border-slate-700">{incomingOrder.description}</p>
                                </div>
                             )}
                             <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                                 <span className="text-slate-400 text-sm">السعر المقترح</span>
                                 <span className="text-2xl font-black text-white">{incomingOrder.price} <span className="text-xs text-slate-500 font-normal">DA</span></span>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => handleWorkerOrderAction(incomingOrder.id, 'accept')} className="bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                                <CheckCircle size={24} /> قبول
                             </button>
                             <button onClick={() => handleWorkerOrderAction(incomingOrder.id, 'reject')} className="bg-slate-700 hover:bg-red-600/20 hover:text-red-500 text-slate-300 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                <XCircle size={24} /> رفض
                             </button>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pr-4 md:pr-10">
        <header className="h-20 bg-slate-800/50 backdrop-blur border-b border-slate-700 flex items-center justify-center px-6 sticky top-0 z-30 relative shadow-lg shadow-slate-900/50">
          <div className="flex items-center gap-2">
              <Logo size="sm" showSubtitle={false} />
          </div>
          <div className="absolute left-6 flex items-center gap-4 transition-all">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${role === 'admin' ? 'bg-red-900/30 border-red-500/50 text-red-200' : 'bg-blue-900/30 border-blue-500/50 text-blue-200'}`}>
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                 {role === 'admin' ? 'A' : (currentUser?.name.charAt(0) || 'W')}
              </div>
              <span className="text-xs font-bold">{role === 'admin' ? 'الإدارة' : currentUser?.name}</span>
            </div>
          </div>
        </header>

        <div className="w-full bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-md py-2 px-4 md:px-8 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 z-20 relative">
            <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
                 <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
                    <CalendarDays size={16} className="text-red-500" />
                    <span className="tracking-wide text-xs md:text-sm">
                        {currentTime.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                 </div>
                 <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
                    <Clock size={16} className="text-blue-500" />
                    <span className="font-mono font-bold text-slate-200 tracking-widest text-sm md:text-base">
                        {currentTime.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold">نظام مباشر</span>
                </div>
            </div>
        </div>

        {role === 'worker' && liveWorker && (
           <div className="flex justify-center mt-4 px-4 relative z-20">
              <div className="bg-slate-800 p-1.5 rounded-2xl flex border border-slate-700 shadow-xl relative overflow-hidden">
                 <button onClick={() => setWorkerAvailability('active')} className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${liveWorker.status === 'active' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                    {liveWorker.status === 'active' && (<motion.span layoutId="active-glow" className="absolute inset-0 bg-white/20 blur-lg rounded-xl" transition={{ duration: 0.3 }} />)}
                    <UserCheck size={18} strokeWidth={2.5} />
                    <span>متاح للعمل</span>
                    {liveWorker.status === 'active' && (<span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>)}
                 </button>
                 <div className="w-px bg-slate-700 mx-1 self-stretch"></div>
                 <button onClick={() => setWorkerAvailability('suspended')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${liveWorker.status === 'suspended' || liveWorker.status !== 'active' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                    <UserX size={18} strokeWidth={2.5} />
                    <span>غير متاح</span>
                 </button>
              </div>
           </div>
        )}

        {role === 'worker' && liveWorker && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-emerald-950/30 border-b border-emerald-500/20 backdrop-blur cursor-pointer hover:bg-emerald-950/50 transition-colors relative z-20 group mt-4"
            onClick={() => setActiveTab('wallet')}
          >
             <div className="flex items-center justify-center py-2 gap-3">
                <span className="text-xs text-emerald-400/70 font-medium hidden sm:inline-block">الرصيد الافتتاحي الحالي:</span>
                <div className="flex items-center gap-2">
                   <Banknote size={16} className="text-emerald-500" />
                   <span className="text-lg font-bold text-white font-mono tracking-wider">{liveWorker.openingBalance || 0}</span>
                   <span className="text-xs text-emerald-500 font-bold">DA</span>
                </div>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs text-emerald-500/50 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                   <span>تحديث</span>
                   <Edit size={10} />
                </div>
             </div>
          </motion.div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode='wait'>
            <MotionDiv 
              key={activeTab + (selectedWorkerForReport ? '-detail' : '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
                {role === 'admin' ? renderAdminPanel() : renderWorkerPanel()}
            </MotionDiv>
          </AnimatePresence>
        </main>
      </div>

      {/* --- MODALS --- */}
      {role === 'admin' && isWorkerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingWorker ? 'تعديل بيانات العامل' : 'إنشاء حساب عامل جديد'}</h3>
            <form onSubmit={handleSaveWorker} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">الاسم الكامل</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                  value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">رقم الهاتف (يستخدم كاسم مستخدم)</label>
                <input required type="tel" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                   value={workerForm.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setWorkerForm({...workerForm, phone: val}) }} maxLength={10} placeholder="06xxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">كلمة المرور {editingWorker ? ' (اتركها فارغة لعدم التغيير)' : ' (مطلوب)'}</label>
                <input required={!editingWorker} type="password" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                   value={workerForm.password} onChange={e => setWorkerForm({...workerForm, password: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6">
                <Button fullWidth type="submit">حفظ التغييرات</Button>
                <Button fullWidth type="button" variant="secondary" onClick={() => setIsWorkerModalOpen(false)}>إلغاء</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isBalanceModalOpen && editingWorker && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-800 border border-emerald-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500"><Banknote size={32} /></div>
              <h3 className="text-xl font-bold mb-2 text-center">إدارة الرصيد الافتتاحي</h3>
              <p className="text-center text-sm text-slate-400 mb-6">تحديث الرصيد الافتتاحي للعامل: <span className="text-white font-bold">{editingWorker.name}</span></p>
              <form onSubmit={handleSaveBalance}>
                <div className="mb-6">
                   <label className="block text-sm text-slate-400 mb-1">المبلغ (DA)</label>
                   <input type="number" step="100" autoFocus className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-center text-xl font-bold focus:border-emerald-500 outline-none" 
                     value={balanceForm.amount} onChange={e => setBalanceForm({...balanceForm, amount: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <Button fullWidth type="submit" className="!bg-emerald-600 hover:!bg-emerald-500 !shadow-emerald-600/30">حفظ الرصيد</Button>
                  <Button fullWidth type="button" variant="secondary" onClick={() => setIsBalanceModalOpen(false)}>إلغاء</Button>
                </div>
              </form>
           </motion.div>
         </div>
      )}

      {isExpenseModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-800 border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Receipt size={32} /></div>
              <h3 className="text-xl font-bold mb-4 text-center">إضافة مصروف جديد</h3>
              <form onSubmit={handleSaveExpense}>
                <div className="mb-4">
                   <label className="block text-sm text-slate-400 mb-1">نوع المصروف</label>
                   <input type="text" autoFocus required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-red-500 outline-none" 
                     value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} placeholder="مثال: وقود، صيانة..." />
                </div>
                <div className="mb-6">
                   <label className="block text-sm text-slate-400 mb-1">السعر (DA)</label>
                   <input type="number" step="100" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-xl font-bold focus:border-red-500 outline-none" 
                     value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <Button fullWidth type="submit" className="!bg-red-600 hover:!bg-red-500 !shadow-red-600/30">حفظ المصروف</Button>
                  <Button fullWidth type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>إلغاء</Button>
                </div>
              </form>
           </motion.div>
         </div>
      )}

      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl shadow-red-900/20 text-center">
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={32} /></div>
             <h3 className="text-xl font-bold mb-2 text-white">حذف الحساب نهائياً؟</h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               {deleteConfirmation.isSelf ? "أنت على وشك حذف حسابك الشخصي نهائياً. سيؤدي هذا إلى تسجيل خروجك ومسح جميع بياناتك." : <span>أنت على وشك حذف حساب العامل <span className="text-white font-bold">"{deleteConfirmation.workerName}"</span>.</span>}
               <br/><span className="text-red-400 font-bold mt-2 block">هذا الإجراء لا يمكن التراجع عنه.</span>
             </p>
             <div className="flex gap-3">
               <button onClick={executeDeleteWorker} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/30">تأكيد الحذف</button>
               <button onClick={() => setDeleteConfirmation({isOpen: false, workerId: null, workerName: '', isSelf: false})} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">إلغاء</button>
             </div>
           </motion.div>
        </div>
      )}

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {editingOrder ? <Edit size={24} className="text-blue-500"/> : <Send size={24} className="text-green-500"/>}
                {editingOrder ? 'تعديل تفاصيل الطلب' : 'إرسال طلب جديد'}
            </h3>
            <form onSubmit={handleSaveOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">نقطة الاستلام</label>
                  <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                    value={orderForm.from} onChange={e => setOrderForm({...orderForm, from: e.target.value})} placeholder="مثال: وسط المدينة" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">نقطة التسليم</label>
                  <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                     value={orderForm.to} onChange={e => setOrderForm({...orderForm, to: e.target.value})} placeholder="مثال: حي النصر" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm text-slate-400 mb-1">السعر (DA)</label>
                  <input required type="number" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                     value={orderForm.price} onChange={e => setOrderForm({...orderForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">هاتف العميل</label>
                  <input required type="tel" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none" 
                     value={orderForm.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setOrderForm({...orderForm, phone: val}) }} maxLength={10} placeholder="06xxxxxxxx" />
                </div>
              </div>
              <div className="col-span-2">
                 <label className="block text-sm text-slate-400 mb-1">وصف الطلبية (اختياري)</label>
                 <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:border-red-500 outline-none h-20 resize-none"
                   value={orderForm.description} onChange={e => setOrderForm({...orderForm, description: e.target.value})} placeholder="مثال: طرد صغير، قابل للكسر، تفاصيل إضافية..." />
              </div>
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                <label className="block text-sm font-bold text-red-400 mb-2">إسناد الطلب إلى عامل (إجباري)</label>
                <div className="relative">
                    <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:border-red-500 outline-none text-white appearance-none"
                    value={orderForm.workerId} onChange={e => setOrderForm({...orderForm, workerId: e.target.value})} required>
                    <option value="" className="text-slate-500">-- اختر السائق المتاح --</option>
                    {workers.map(w => (
                        <option key={w.id} value={w.id} disabled={w.status !== 'active'} className={w.status !== 'active' ? 'text-slate-600' : 'text-white'}>
                            {w.name} ({w.status === 'active' ? 'متاح' : 'غير متاح'})
                        </option>
                    ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="rotate-90 text-slate-500" size={16} />
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={10} />
                    سيظهر إشعار فوري بشاشة كاملة عند العامل المحدد.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <Button fullWidth type="submit" className="!bg-green-600 hover:!bg-green-500 !shadow-green-600/30">{editingOrder ? 'حفظ التعديلات' : 'إرسال الطلب الآن'}</Button>
                <Button fullWidth type="button" variant="secondary" onClick={() => setIsOrderModalOpen(false)}>إلغاء</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;