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
  Power, PowerOff, UserCheck, UserX, Cloud, CloudOff, Volume2, Play, Square, Music,
  CheckCheck, ArrowDown, Database, RotateCcw, Upload, AlertOctagon, Map as MapIcon, Star, MessageCircle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight as ChevronRightIcon, X, Smartphone, MessageSquare,
  FileEdit, GitPullRequest, ArrowRightLeft, Info, Mic, Layers, Locate, Sun, Moon,
  Zap, ArrowLeft, Disc, Pause
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ViewState, DashboardStat, Worker, Order, Notification as AppNotification, Expense, OrderChangeRequest } from '@/types';
import Logo from '@/components/Logo';
import { MOCK_STATS_ADMIN, MOCK_STATS_WORKER, INITIAL_WORKERS, INITIAL_ORDERS } from '@/constants';
import Button from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { DB, isCloudActive } from '@/services/db';
import { messaging, getToken, onMessage } from '@/firebaseConfig';
import L from 'leaflet';

// Fix for TS errors
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;
const MotionSpan = motion.span as any;

// --- LEAFLET MAP COMPONENT ---
interface LiveMapProps {
  workers: Worker[];
  orders: Order[];
}

const LiveMap: React.FC<LiveMapProps> = ({ workers, orders }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{[id: string]: L.Marker}>({});
  const [mapTheme, setMapTheme] = useState<'dark' | 'street' | 'satellite'>('dark');
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  // Ouargla, Algeria Center
  const DEFAULT_CENTER: [number, number] = [31.9529, 5.3340];

  const updateTileLayer = (theme: string) => {
      if (!mapRef.current) return;
      if (tileLayerRef.current) {
          mapRef.current.removeLayer(tileLayerRef.current);
      }

      let url = '';
      let attribution = '';

      if (theme === 'dark') {
          url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
          attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
      } else if (theme === 'street') {
          url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          attribution = '&copy; OpenStreetMap contributors';
      } else if (theme === 'satellite') {
          url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
          attribution = 'Tiles &copy; Esri';
      }

      tileLayerRef.current = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(mapRef.current);
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Initialize only once

    // Initialize Map with dark theme settings
    mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false, // We will add custom controls
        attributionControl: false
    }).setView(DEFAULT_CENTER, 13);

    // Initial Tile Layer
    updateTileLayer('street'); // Default to street for better light mode visibility initially

    // Force resize after render
    setTimeout(() => {
       mapRef.current?.invalidateSize();
    }, 500);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update tiles when theme changes
  useEffect(() => {
      updateTileLayer(mapTheme);
  }, [mapTheme]);

  // Function to determine worker status color and text based on orders
  const getWorkerStatusInfo = (workerId: string) => {
      const activeOrder = orders.find(o => o.workerId === workerId && (o.status === 'pending' || o.status === 'accepted'));
      
      if (!activeOrder) {
          return { color: '#10b981', text: 'متاح للعمل', status: 'idle', glow: 'rgba(16, 185, 129, 0.6)' }; // Emerald-500
      }
      if (activeOrder.status === 'pending') {
          return { color: '#f59e0b', text: 'طلب جديد', status: 'pending', glow: 'rgba(245, 158, 11, 0.6)' }; // Amber-500
      }
      if (activeOrder.status === 'accepted') {
          return { color: '#3b82f6', text: 'جاري التوصيل', status: 'delivering', glow: 'rgba(59, 130, 246, 0.6)' }; // Blue-500
      }
      return { color: '#10b981', text: 'متاح للعمل', status: 'idle', glow: 'rgba(16, 185, 129, 0.6)' };
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const activeWorkers = workers.filter(w => w.status === 'active' && w.latitude && w.longitude);
    
    // Create Modern Icon based on dynamic color
    const createBikeIcon = (name: string, color: string, glow: string) => L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                <div class="marker-pulse" style="position: absolute; width: 100%; height: 100%; color: ${color}; opacity: 0.5;"></div>
                <div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.5); position: relative; z-index: 2;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
                </div>
                <div style="position: absolute; bottom: 42px; background: white; color: #0f172a; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); border: 2px solid ${color}; z-index: 3; transform: translateX(0%); pointer-events: none;">
                   ${name}
                   <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: white; border-bottom: 2px solid ${color}; border-right: 2px solid ${color};"></div>
                </div>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -30]
    });

    // Update markers
    activeWorkers.forEach(worker => {
        if (!worker.latitude || !worker.longitude) return;
        
        const statusInfo = getWorkerStatusInfo(worker.id);
        const icon = createBikeIcon(worker.name, statusInfo.color, statusInfo.glow);
        const latLng = new L.LatLng(worker.latitude, worker.longitude);

        if (markersRef.current[worker.id]) {
            // Update existing marker position with transition
            const marker = markersRef.current[worker.id];
            marker.setIcon(icon);
            marker.setLatLng(latLng);
            marker.setZIndexOffset(100);

            // Update popup content dynamically
            const popupContent = `
                <div style="text-align:right; font-family:sans-serif; min-width: 160px; padding: 5px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <div style="width:10px; height:10px; border-radius:50%; background-color:${statusInfo.color}; box-shadow: 0 0 5px ${statusInfo.color};"></div>
                        <b style="font-size:15px; color: #1e293b;">${worker.name}</b>
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight: 600;">${worker.phone}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                         <span style="padding:4px 8px; border-radius:6px; background-color:${statusInfo.color}15; color:${statusInfo.color}; font-size:11px; font-weight:800; border: 1px solid ${statusInfo.color}30;">${statusInfo.text}</span>
                         <span style="font-size:10px; color:#94a3b8;">${new Date(worker.lastLocationUpdate || '').toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            `;
            marker.setPopupContent(popupContent);

        } else {
            // Create new marker
            const marker = L.marker(latLng, { icon }).addTo(mapRef.current!);
            
            marker.bindPopup(`
                <div style="text-align:right; font-family:sans-serif; min-width: 160px; padding: 5px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <div style="width:10px; height:10px; border-radius:50%; background-color:${statusInfo.color}; box-shadow: 0 0 5px ${statusInfo.color};"></div>
                        <b style="font-size:15px; color: #1e293b;">${worker.name}</b>
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight: 600;">${worker.phone}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                         <span style="padding:4px 8px; border-radius:6px; background-color:${statusInfo.color}15; color:${statusInfo.color}; font-size:11px; font-weight:800; border: 1px solid ${statusInfo.color}30;">${statusInfo.text}</span>
                         <span style="font-size:10px; color:#94a3b8;">${new Date(worker.lastLocationUpdate || '').toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            `);
            markersRef.current[worker.id] = marker;
        }
    });

    // Remove markers for offline workers
    Object.keys(markersRef.current).forEach(id => {
        if (!activeWorkers.find(w => w.id === id)) {
            markersRef.current[id].remove();
            delete markersRef.current[id];
        }
    });

  }, [workers, orders]); 

  const handleCenterMap = () => {
      if (mapRef.current) mapRef.current.flyTo(DEFAULT_CENTER, 14, { duration: 1.5 });
  };

  return (
    <div className="w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full rounded-2xl z-0" style={{ background: '#0f172a' }} />
        
        {/* Map Controls */}
        <div className="absolute bottom-6 left-6 z-[400] flex flex-col gap-2">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-700 p-1 shadow-2xl flex flex-col gap-1">
                <button 
                  onClick={() => setMapTheme('dark')}
                  className={`p-2 rounded-lg transition-all ${mapTheme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  title="Dark Mode"
                >
                   <MapIcon size={20} />
                </button>
                <button 
                  onClick={() => setMapTheme('street')}
                  className={`p-2 rounded-lg transition-all ${mapTheme === 'street' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  title="Street Mode"
                >
                   <Navigation size={20} />
                </button>
                <button 
                  onClick={() => setMapTheme('satellite')}
                  className={`p-2 rounded-lg transition-all ${mapTheme === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  title="Satellite Mode"
                >
                   <Layers size={20} />
                </button>
            </div>
            <button 
                onClick={handleCenterMap}
                className="bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-2xl text-white hover:bg-blue-600 transition-colors"
            >
                <Locate size={20} />
            </button>
        </div>
    </div>
  );
};


// --- ANIMATED ICONS COMPONENT ---
const AnimatedStatusIcon = ({ status, size = 20 }: { status: string, size?: number }) => {
  switch (status) {
    case 'pending':
      return (
        <div className="relative flex items-center justify-center">
          <MotionDiv
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bg-orange-500/30 rounded-full w-full h-full"
          />
          <MotionDiv
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-orange-500 relative z-10"
          >
            <Clock size={size} />
          </MotionDiv>
        </div>
      );
    case 'accepted':
      return (
        <div className="relative flex items-center justify-center overflow-hidden w-8 h-8">
           <MotionDiv
             animate={{ x: [-2, 2, -2] }}
             transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
             className="text-blue-500 relative z-10"
           >
             <Bike size={size} />
           </MotionDiv>
           <MotionDiv 
             className="absolute bottom-1 right-0 w-4 h-0.5 bg-blue-400/50 rounded-full"
             animate={{ x: [10, -10], opacity: [0, 1, 0] }}
             transition={{ duration: 0.8, repeat: Infinity }}
           />
        </div>
      );
    case 'delivered':
      return (
        <div className="relative flex items-center justify-center">
           <MotionDiv
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 10 }}
             className="text-green-500"
           >
             <CheckCircle size={size} strokeWidth={2.5} />
           </MotionDiv>
           <MotionDiv
             initial={{ opacity: 0, scale: 0.5 }}
             animate={{ opacity: 0, scale: 2 }}
             transition={{ duration: 0.8, repeat: Infinity }}
             className="absolute inset-0 border border-green-500 rounded-full"
           />
        </div>
      );
    case 'cancelled':
        return <XCircle size={size} className="text-red-500" />;
    default:
      return <div className="w-5 h-5 rounded-full bg-slate-700" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    accepted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  
  const labels = {
    pending: 'قيد الانتظار',
    accepted: 'جاري التوصيل',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  };

  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 shadow-sm ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

// --- SOUND PRESETS (UPDATED 10 PROFESSIONAL 5s TONES) ---
const SOUND_PRESETS = [
    { id: 'tone-1', name: 'هدوء الصباح (Morning)', description: 'نغمة هادئة تصاعدية لبدء اليوم' },
    { id: 'tone-2', name: 'نبض النجاح (Success)', description: 'تسلسل موسيقي مفرح للإنجاز' },
    { id: 'tone-3', name: 'رنين الكريستال (Crystal)', description: 'صدى نقي وهادئ جداً' },
    { id: 'tone-4', name: 'الموجة الرقمية (Digital)', description: 'نغمة تكنولوجية حديثة وسلسة' },
    { id: 'tone-5', name: 'نسيم الفضاء (Cosmic)', description: 'نغمة واسعة وعميقة' },
    { id: 'tone-6', name: 'تنبيه لطيف (Gentle)', description: 'تنبيه متكرر بنعومة' },
    { id: 'tone-7', name: 'جرس الباب (Doorbell)', description: 'كلاسيكي ولكن بتوزيع حديث' },
    { id: 'tone-8', name: 'صدى السونار (Sonar)', description: 'تنبيه عميق ومتقطع' },
    { id: 'tone-9', name: 'إيقاع حيوي (Rhythm)', description: 'نغمة نشطة للعمل السريع' },
    { id: 'tone-10', name: 'اكتمال المهمة (Complete)', description: 'لحن ختامي مميز' },
];

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
  pendingRequestsCount?: number;
  onOpenRequests?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
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
  resetDockTimer,
  pendingRequestsCount = 0,
  onOpenRequests,
  isDarkMode,
  toggleTheme
}) => {
  const adminLinks = [
    { id: 'overview', icon: Home, label: 'الرئيسية', color: 'from-cyan-500 to-blue-600' },
    { id: 'map', icon: MapIcon, label: 'الخريطة الحية', color: 'from-pink-500 to-rose-600' },
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

  // New Dock Styles for Light Mode
  const dockContainerClass = isDarkMode 
      ? 'bg-slate-800/60 border-slate-700/50' 
      : 'bg-white/90 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl';

  const collapsedDockClass = isDarkMode
      ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500 text-white'
      : 'bg-white border-slate-200 hover:border-blue-500 text-slate-800 shadow-xl';

  return (
    <div 
      ref={dockRef}
      // Added safe area top padding support for iOS
      className="fixed right-6 top-[calc(1rem+env(safe-area-inset-top))] z-50 flex flex-col items-end transition-all duration-300"
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
              className={`w-12 h-12 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all relative ${collapsedDockClass}`}
           >
              <Grid size={24} />
              {/* Notification Badge for Collapsed State */}
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-slate-800 text-[10px] text-white justify-center items-center font-bold">
                     {pendingRequestsCount}
                  </span>
                </span>
              )}
           </MotionButton>
        ) : (
           <MotionDiv
              key="dock-expanded"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`flex flex-col gap-4 md:gap-6 p-3 md:p-4 rounded-3xl border shadow-2xl ${dockContainerClass}`}
           >
              {/* Notification Button for Expanded State */}
              {role === 'admin' && pendingRequestsCount > 0 && (
                 <>
                   <div className="relative group flex items-center justify-center">
                      <div className="hidden md:block absolute right-full mr-4 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-red-500 shadow-xl z-50">
                         طلبات التعديل ({pendingRequestsCount})
                      </div>

                      <button 
                        onClick={() => { onOpenRequests?.(); resetDockTimer(); }}
                        className="relative w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg border-t border-white/20 border-b border-black/40 animate-pulse hover:animate-none transition-all hover:scale-105"
                      >
                         <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl"></div>
                         <GitPullRequest size={20} className="md:w-6 md:h-6 text-white relative z-10" />
                         <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black h-6 w-6 flex items-center justify-center rounded-full border-2 border-slate-800 shadow-sm z-20">
                            {pendingRequestsCount}
                         </span>
                      </button>
                   </div>
                   <div className="w-6 md:w-10 h-px bg-slate-700/50 mx-auto my-1 md:my-2"></div>
                 </>
              )}

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
                           bg-gradient-to-br ${isActive ? link.color : (isDarkMode ? 'from-slate-700 to-slate-800' : 'from-slate-100 to-slate-200')}
                           ${isActive ? 'rounded-full' : 'rounded-2xl'}
                           shadow-lg border-t border-white/20 border-b border-black/40
                           transition-all duration-500 relative overflow-hidden
                         `}
                       >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                          
                          <link.icon 
                            size={20} 
                            className={`md:w-6 md:h-6 relative z-10 transition-colors duration-300 drop-shadow-md ${isActive ? 'text-white' : (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900')}`} 
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

              {/* Theme Toggle Button */}
               <button 
                onClick={toggleTheme}
                className={`group relative w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center transition-all mx-auto ${isDarkMode ? 'bg-slate-800 hover:bg-yellow-500/20 border-slate-700 hover:border-yellow-500/50 text-yellow-500' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-800 shadow-md'}`}
                title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
              >
                 {isDarkMode ? <Sun size={20} className="md:w-6 md:h-6" /> : <Moon size={20} className="md:w-6 md:h-6" />}
              </button>

              <button 
                onClick={onLogout}
                className={`group relative w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center transition-all mx-auto ${isDarkMode ? 'bg-slate-800/80 hover:bg-red-900/50 border-slate-700 hover:border-red-500/30' : 'bg-white/80 hover:bg-red-50 border-slate-200 hover:border-red-500/30 shadow-md'}`}
              >
                 <LogOut size={18} className={`md:w-5 md:h-5 ${isDarkMode ? 'text-slate-400 group-hover:text-red-400' : 'text-slate-600 group-hover:text-red-500'}`} />
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
  type: 'global' | 'worker-admin' | 'worker-daily';
  title: string;
  subtitle: string;
  worker?: Worker;
  orders: Order[];
  expenses?: Expense[];
  financials?: FinancialSummary;
  stats: { label: string; value: string; color: string }[];
  date: string;
  groupedOrders?: Record<string, Order[]>;
  totalOfficeShare?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ role, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>(role === 'admin' ? 'overview' : 'tasks');

  const [currentTime, setCurrentTime] = useState(new Date());

  // State to control visibility of active workers card on map
  const [isMapListOpen, setIsMapListOpen] = useState(true);

  // New state for Admin Edit Notifications
  const [activeAdminAlert, setActiveAdminAlert] = useState<AppNotification | null>(null);

  // State to track loading status of requests
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Wake Lock Reference
  const wakeLockRef = useRef<any>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
      const saved = localStorage.getItem('theme_preference');
      // Default to Light Mode if no preference saved for clearer Day Mode first impression
      return saved ? saved === 'dark' : false; 
  });

  const toggleTheme = () => {
      setIsDarkMode(prev => {
          const newMode = !prev;
          localStorage.setItem('theme_preference', newMode ? 'dark' : 'light');
          return newMode;
      });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [changeRequests, setChangeRequests] = useState<OrderChangeRequest[]>([]);

  const [pickupFavorites, setPickupFavorites] = useState<string[]>([]);
  const [dropoffFavorites, setDropoffFavorites] = useState<string[]>([]);

  useEffect(() => {
    const unsubWorkers = DB.subscribeToWorkers(setWorkers);
    const unsubOrders = DB.subscribeToOrders(setOrders);
    const unsubExpenses = DB.subscribeToExpenses(setExpenses);
    const unsubChangeRequests = DB.subscribeToChangeRequests(setChangeRequests);
    
    const unsubPickup = DB.subscribeToLocations('pickup', setPickupFavorites);
    const unsubDropoff = DB.subscribeToLocations('dropoff', setDropoffFavorites);

    let unsubNotifications: any;
    if (role === 'worker' && currentUser) {
        unsubNotifications = DB.subscribeToWorkerNotifications(currentUser.id, (notifs) => {
             // Filter for unread admin edit notifications
             const alert = notifs.find(n => n.type === 'admin_edit' && !n.isRead);
             if (alert) {
                 setActiveAdminAlert(alert);
                 playToneById('admin-alert-tone', 10);
             }
        });
    }

    return () => {
        if(unsubWorkers) (unsubWorkers as any)();
        if(unsubOrders) (unsubOrders as any)();
        if(unsubExpenses) (unsubExpenses as any)();
        if(unsubChangeRequests) (unsubChangeRequests as any)();
        if(unsubPickup) (unsubPickup as any)();
        if(unsubDropoff) (unsubDropoff as any)();
        if(unsubNotifications) (unsubNotifications as any)();
    };
  }, [role, currentUser]);

  // FCM Push Notifications Setup
  useEffect(() => {
    if (!currentUser || !messaging || !isCloudActive) return;

    const requestNotificationPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get FCM token
          // Note: In a real app, you need a VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration
          // For this demo, we'll try to get it without a specific vapidKey if it's not strictly required, or you can add it later.
          const currentToken = await getToken(messaging, { 
            // vapidKey: "YOUR_PUBLIC_VAPID_KEY_HERE" 
          });
          
          if (currentToken) {
            console.log('FCM Token generated successfully.');
            // Save token to database
            DB.saveFCMToken(currentUser.id, currentToken, role);
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Notification permission denied.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    requestNotificationPermission();

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can customize the foreground notification here if needed,
      // or just let the existing logic handle new orders.
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, role]);
  
  // GPS Tracking & Wake Lock Logic
  useEffect(() => {
      const requestWakeLock = async () => {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            wakeLockRef.current.addEventListener('release', () => {
              // console.log('Wake Lock released');
            });
          }
        } catch (err: any) {
          // Ignore NotAllowedError which happens in iframes/environments without permission
          if (err.name !== 'NotAllowedError') {
            console.error(`${err} - Wake Lock error`);
          }
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && role === 'worker' && currentUser) {
            // Re-acquire lock when app comes to foreground
            const liveStatus = workers.find(w => w.id === currentUser.id)?.status;
            if (liveStatus === 'active') {
                requestWakeLock();
            }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      if (role === 'worker' && currentUser) {
          const liveStatus = workers.find(w => w.id === currentUser.id)?.status;

          if (liveStatus === 'active') {
              // 1. Enable Wake Lock to keep screen on (critical for tracking in PWA)
              requestWakeLock();

              // 2. Start High Accuracy Tracking
              if (!navigator.geolocation) return;

              const watchId = navigator.geolocation.watchPosition(
                  (position) => {
                      const { latitude, longitude } = position.coords;
                      DB.updateWorkerLocation(currentUser.id, latitude, longitude);
                  },
                  (error) => console.error("GPS Error:", error),
                  {
                      enableHighAccuracy: true,
                      maximumAge: 0,
                      timeout: 10000
                  }
              );

              return () => {
                  navigator.geolocation.clearWatch(watchId);
                  if (wakeLockRef.current) {
                      wakeLockRef.current.release().catch((e:any) => console.log(e));
                      wakeLockRef.current = null;
                  }
                  document.removeEventListener('visibilitychange', handleVisibilityChange);
              };
          } else {
              // Release lock if not active
               if (wakeLockRef.current) {
                  wakeLockRef.current.release().catch((e:any) => console.log(e));
                  wakeLockRef.current = null;
              }
          }
      }
      return () => {
           document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [role, currentUser, workers]);


  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  
  // State for storing uploaded audio preview before saving
  const [pendingCustomAudio, setPendingCustomAudio] = useState<string | null>(null);
  const [pendingCustomAudioName, setPendingCustomAudioName] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'worker' && "Notification" in window) {
      if (window.Notification.permission !== "granted" && window.Notification.permission !== "denied") {
        window.Notification.requestPermission();
      }
    }
  }, [role]);

  // Handle uploaded audio playback
  const playCustomAudio = (base64Data: string, isLooping: boolean = false) => {
    if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.src = "";
    }
    const audio = new Audio(base64Data);
    audio.volume = 1.0; 
    audio.loop = isLooping; 
    
    customAudioRef.current = audio;
    
    // Add event listener to clear playing state when audio finishes (only if not looping)
    if (!isLooping) {
        audio.addEventListener('ended', () => {
            setPreviewPlayingId(null);
        });
    }

    audio.play().catch(e => console.error("Custom Audio Play Error:", e));
  };

  const playToneById = (soundId: string, duration: number = 5, isLooping: boolean = false) => {
      // 1. Check for Custom Sound
      if (soundId === 'custom') {
          // Priority: Pending Preview > Saved Custom Tone (Fetched from live workers state for accuracy)
          let activeWorkerCustomTone = null;
          if (currentUser) {
             const activeWorker = workers.find(w => w.id === currentUser.id);
             activeWorkerCustomTone = activeWorker?.customRingTone;
          }

          const toneToPlay = pendingCustomAudio || activeWorkerCustomTone || currentUser?.customRingTone;
          
          if (toneToPlay) {
              playCustomAudio(toneToPlay, isLooping);
              return;
          }
      }

      // 2. Fallback to Synth Tones
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      if (oscillatorRef.current) {
          try { oscillatorRef.current.stop(); } catch(e){}
          oscillatorRef.current = null;
      }
      
      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      
      // Helper function to play a single note in a sequence
      const playNote = (freq: number, startTime: number, dur: number, type: OscillatorType = 'sine', vol: number = 0.2) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          
          osc.type = type;
          osc.frequency.setValueAtTime(freq, startTime);
          
          // Envelope
          noteGain.gain.setValueAtTime(0, startTime);
          noteGain.gain.linearRampToValueAtTime(vol, startTime + (dur * 0.1));
          noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
          
          osc.connect(noteGain);
          noteGain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + dur);
          
          // Store ref to stop later
          if (!oscillatorRef.current) oscillatorRef.current = osc;
          
          return osc;
      };

      // 5-Second Melodic Sequences
      switch (soundId) {
          case 'admin-alert-tone':
              // Urgent Alert (System)
              for(let i=0; i<4; i++) {
                 playNote(880, now + (i*1.2), 0.4, 'sine', 0.4);
                 playNote(554, now + (i*1.2) + 0.2, 0.4, 'triangle', 0.3);
              }
              break;

          case 'tone-1': // Morning (Ethereal Ascending)
              // C Major 7 Arpeggio slow
              playNote(261.63, now, 2.0, 'sine', 0.3); // C4
              playNote(329.63, now + 0.5, 2.0, 'sine', 0.3); // E4
              playNote(392.00, now + 1.0, 2.0, 'sine', 0.3); // G4
              playNote(493.88, now + 1.5, 2.5, 'sine', 0.3); // B4
              playNote(523.25, now + 2.0, 3.0, 'sine', 0.2); // C5
              break;

          case 'tone-2': // Success (Triumphant)
              // Rapid Fanfare
              playNote(523.25, now, 0.2, 'square', 0.1); // C5
              playNote(523.25, now + 0.2, 0.2, 'square', 0.1); // C5
              playNote(523.25, now + 0.4, 0.2, 'square', 0.1); // C5
              playNote(659.25, now + 0.6, 0.6, 'square', 0.1); // E5
              playNote(523.25, now + 1.2, 0.4, 'square', 0.1); // C5
              playNote(659.25, now + 1.6, 2.0, 'square', 0.15); // E5
              break;

          case 'tone-3': // Crystal (High Pitch Pings)
              playNote(1567.98, now, 1.5, 'sine', 0.15); // G6
              playNote(1318.51, now + 0.5, 1.5, 'sine', 0.15); // E6
              playNote(1046.50, now + 1.0, 1.5, 'sine', 0.15); // C6
              playNote(1567.98, now + 1.5, 2.0, 'sine', 0.1); // G6
              break;

          case 'tone-4': // Digital (Fast Blips)
              for(let i=0; i<10; i++) {
                 playNote(400 + (i*100), now + (i*0.2), 0.1, 'sawtooth', 0.05);
              }
              playNote(1500, now + 2.0, 1.0, 'sine', 0.2);
              break;

          case 'tone-5': // Cosmic (Deep Swell)
              const osc5 = ctx.createOscillator();
              const gain5 = ctx.createGain();
              osc5.type = 'sine';
              osc5.frequency.setValueAtTime(220, now);
              osc5.frequency.linearRampToValueAtTime(880, now + 4); // Slide up over 4s
              gain5.gain.setValueAtTime(0, now);
              gain5.gain.linearRampToValueAtTime(0.3, now + 2);
              gain5.gain.linearRampToValueAtTime(0, now + 5);
              osc5.connect(gain5);
              gain5.connect(ctx.destination);
              osc5.start(now);
              osc5.stop(now + 5);
              break;

          case 'tone-6': // Gentle (Soft repeating)
              for(let i=0; i<3; i++) {
                 playNote(440, now + (i*1.5), 0.8, 'triangle', 0.2); // A4
                 playNote(349, now + (i*1.5) + 0.2, 0.8, 'triangle', 0.2); // F4
              }
              break;

          case 'tone-7': // Doorbell (Classic Ding-Dong sustained)
              playNote(659.25, now, 1.5, 'sine', 0.4); // E5 (Ding)
              playNote(523.25, now + 0.8, 2.5, 'sine', 0.4); // C5 (Dong)
              setTimeout(() => {
                 playNote(659.25, ctx.currentTime, 1.5, 'sine', 0.4);
                 playNote(523.25, ctx.currentTime + 0.8, 2.5, 'sine', 0.4);
              }, 2500); // Repeat once
              break;

          case 'tone-8': // Sonar (Ping with echo)
              playNote(800, now, 0.2, 'sine', 0.5);
              playNote(800, now + 0.5, 0.2, 'sine', 0.2); // Echo 1
              playNote(800, now + 1.0, 0.2, 'sine', 0.1); // Echo 2
              playNote(800, now + 2.5, 0.2, 'sine', 0.5); // Second Ping
              playNote(800, now + 3.0, 0.2, 'sine', 0.2);
              break;

          case 'tone-9': // Rhythm (Percussive)
              for(let i=0; i<8; i++) {
                  const t = now + (i * 0.5);
                  if (i % 2 === 0) playNote(220, t, 0.1, 'square', 0.1); // Bass
                  else playNote(440, t, 0.1, 'triangle', 0.1); // Snare-ish
              }
              break;

          case 'tone-10': // Complete (Final Chord)
              playNote(261.63, now, 4.0, 'sine', 0.2); // C4
              playNote(329.63, now + 0.1, 4.0, 'sine', 0.2); // E4
              playNote(392.00, now + 0.2, 4.0, 'sine', 0.2); // G4
              playNote(523.25, now + 0.3, 4.0, 'sine', 0.2); // C5
              break;

          default: // Default fallback
              playNote(880, now, 0.5, 'sine', 0.2);
              setTimeout(() => playNote(880, ctx.currentTime, 0.5, 'sine', 0.2), 1000);
              break;
      }
  };

  const playNotificationSound = (soundId?: string, isLooping: boolean = false) => {
    // Just play once because our tones are now ~5s long and complex
    const effectiveSound = soundId || 'tone-1';
    playToneById(effectiveSound, 5, isLooping);
  };
  
  // NEW: Stop Sound Function
  const stopNotificationSound = () => {
    // Stop Audio Element (Custom Sound)
    if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.currentTime = 0;
    }
    
    // Stop Oscillator (Synth Sound)
    if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch(e){}
        oscillatorRef.current = null;
    }
    
    // Reset Playing State
    setPreviewPlayingId(null);
  };

  const showSystemNotification = (order: Order) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("طلب جديد!", {
          body: `من: ${order.fromLocation} إلى: ${order.toLocation} (${order.price} DA)`,
          dir: 'rtl',
          tag: order.id
        });
      } catch (e) {
        console.error("System notification failed", e);
      }
    }
  };

  const prevOrdersRef = useRef<Order[]>([]);
  
  useEffect(() => {
    const currentOrders = orders;
    const prevOrders = prevOrdersRef.current;

    if (prevOrders.length > 0) {
        currentOrders.forEach(order => {
            const oldOrder = prevOrders.find(o => o.id === order.id);
            if (oldOrder && oldOrder.status !== order.status) {
                if (order.status === 'accepted') {
                   // Short blips for status changes are fine to keep simple
                   const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                   const osc = ctx.createOscillator();
                   const g = ctx.createGain();
                   osc.connect(g); g.connect(ctx.destination);
                   osc.frequency.setValueAtTime(600, ctx.currentTime);
                   g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                   osc.start(); osc.stop(ctx.currentTime + 0.5);
                } else if (order.status === 'delivered') {
                   const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                   const osc = ctx.createOscillator();
                   const g = ctx.createGain();
                   osc.connect(g); g.connect(ctx.destination);
                   osc.frequency.setValueAtTime(1000, ctx.currentTime);
                   g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
                   osc.start(); osc.stop(ctx.currentTime + 1.0);
                }
            }
        });
    }

    if (role === 'worker' && currentUser) {
        const prevPending = prevOrders.filter(o => o.workerId === currentUser.id && o.status === 'pending');
        const currentPending = currentOrders.filter(o => o.workerId === currentUser.id && o.status === 'pending');
        
        if (currentPending.length > prevPending.length) {
            const newOrder = currentPending.find(curr => !prevPending.some(prev => prev.id === curr.id));
            if (newOrder) {
                setIncomingOrder(newOrder);
                const workerProfile = workers.find(w => w.id === currentUser.id);
                // Play the tone with Loop enabled for alerts
                playNotificationSound(workerProfile?.notificationSound || 'tone-1', true);
                showSystemNotification(newOrder);
                if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000, 200, 500]); 
            }
        }
    }
    prevOrdersRef.current = currentOrders;
  }, [orders, role, currentUser, workers]);
  
  // Stop sound if incomingOrder is cleared (e.g. accepted from another device or closed)
  useEffect(() => {
    if (!incomingOrder) {
        stopNotificationSound();
    }
  }, [incomingOrder]);

  // --- AUDIO ALERT FOR CHANGE REQUESTS (5 Seconds) ---
  const prevChangeRequestsLengthRef = useRef(0);
  
  useEffect(() => {
    if (role === 'admin' && changeRequests.length > prevChangeRequestsLengthRef.current) {
         // Only play if requests INCREASED
         playToneById('tone-urgent-long'); // Or map to one of the new ones
    }
    prevChangeRequestsLengthRef.current = changeRequests.length;
  }, [changeRequests, role]);

  const setWorkerAvailability = (status: 'active' | 'suspended') => {
    if (!currentUser) return;
    const updatedWorker = { ...currentUser, status };
    DB.saveWorker(updatedWorker);
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

  const handleBackupData = async () => {
      try {
          const data = await DB.backupData();
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `speed_delivery_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (err) {
          alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
          console.error(err);
      }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRestoreClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (window.confirm("تحذير: استعادة البيانات ستقوم باستبدال البيانات الحالية بالبيانات الموجودة في الملف.\nهل أنت متأكد من المتابعة؟")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);
                await DB.restoreData(data);
                alert("تم استعادة البيانات بنجاح! سيتم تحديث الصفحة.");
                window.location.reload();
            } catch (error) {
                console.error("Restore failed", error);
                alert("حدث خطأ أثناء قراءة الملف أو استعادة البيانات. تأكد من أن الملف صالح.");
            }
        };
        reader.readAsText(file);
    }
    if (event.target) event.target.value = '';
  };

  const handleSystemReset = async () => {
      if (window.confirm("⚠️ تحذير شديد الخطورة ⚠️\n\nأنت على وشك القيام بعملية 'تصفير النظام'.\n\nسيؤدي هذا إلى:\n1. حذف جميع الطلبات (الحالية والمنتهية).\n2. حذف جميع المصاريف.\n3. تصفير عدادات الأرباح والطلبات لجميع العمال.\n\nهل أنت متأكد من أنك تريد البدء من الصفر؟")) {
          if (window.confirm("تأكيد نهائي: هل أنت متأكد تماماً؟ لا يمكن التراجع عن هذه الخطوة.")) {
              try {
                  // تحديث الواجهة فوراً (Optimistic UI)
                  setOrders([]);
                  setExpenses([]);
                  setWorkers(prev => prev.map(w => ({
                      ...w,
                      ordersCompleted: 0,
                      totalEarnings: 0,
                      latitude: undefined,
                      longitude: undefined
                  })));

                  // تنفيذ التصفير في قاعدة البيانات
                  await DB.fullSystemReset();
                  alert("تم تصفير النظام بنجاح وبدء فترة جديدة.");
              } catch(err) {
                  alert("حدث خطأ أثناء عملية التصفير.");
                  console.error(err);
              }
          }
      }
  };

  const prepareGlobalReport = () => {
    setGeneratingReportId('global');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((acc, curr) => acc + curr.price, 0);
    const totalOfficeShare = Math.round(totalRevenue / 3);

    const ordersByWorker: Record<string, Order[]> = {};
    deliveredOrders.forEach(order => {
        const workerId = order.workerId || 'unknown';
        if (!ordersByWorker[workerId]) {
            ordersByWorker[workerId] = [];
        }
        ordersByWorker[workerId].push(order);
    });

    setReportData({
      type: 'global',
      title: "التقرير المالي اليومي الشامل",
      subtitle: "ملخص أرباح المكتب والعمال",
      orders: deliveredOrders,
      date: new Date().toLocaleDateString('ar-DZ'),
      stats: [],
      groupedOrders: ordersByWorker,
      totalOfficeShare: totalOfficeShare
    });
  };

  const prepareWorkerReport = (worker: Worker) => {
    setGeneratingReportId(worker.id);
    const workerOrders = orders.filter(o => o.workerId === worker.id && o.status === 'delivered');
    const totalEarnings = workerOrders.reduce((acc, curr) => acc + curr.price, 0);
    
    const officeShare = Math.round(totalEarnings / 3);
    const workerShare = totalEarnings - officeShare; 

    setReportData({
      type: 'worker-admin',
      title: `تقرير أداء العامل: ${worker.name}`,
      subtitle: `تقسيم الأرباح (1/3 للمكتب - 2/3 للعامل)`,
      worker: worker,
      orders: workerOrders,
      date: new Date().toLocaleDateString('ar-DZ'),
      stats: [],
      financials: {
        openingBalance: 0,
        totalDelivery: totalEarnings,
        officeShare: officeShare,
        workerGrossShare: workerShare,
        totalExpenses: 0, 
        netCashHand: 0,
        totalLiquidity: 0,
        workerEquity: 0,
        workerNetProfit: 0
      }
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
    const netCashHand = totalLiquidity - totalExpenses; // Cash in hand formula from Wallet view logic
    
    const officeShare = Math.round(totalDelivery / 3);
    const workerGrossShare = totalDelivery - officeShare; 
    const workerNetProfit = workerGrossShare - totalExpenses; 
    const workerEquity = openingBalance + workerNetProfit; 

    setReportData({
      type: 'worker-daily',
      title: "الكشف المالي اليومي",
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
        netCashHand,
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
          ? `Report_${reportData.worker.name.replace(/\s/g, '_')}_${Date.now()}.pdf`
          : `Global_Admin_Report_${Date.now()}.pdf`;
       triggerPdfGeneration(filename);
    }
  }, [reportData]);

  const [selectedWorkerForReport, setSelectedWorkerForReport] = useState<Worker | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // New State for Save Confirmation
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ amount: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, workerId: string | null, workerName: string, isSelf?: boolean}>({ isOpen: false, workerId: null, workerName: '', isSelf: false });
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', password: '', status: 'active' as 'active' | 'suspended' });
  const [orderForm, setOrderForm] = useState({ from: '', to: '', price: '', phone: '', deliveryPhone: '', workerId: '', description: '' });
  
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [previewInterval, setPreviewInterval] = useState<any>(null);

  // New State for Change Requests Modal (Admin)
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const addNotification = (workerName: string, action: string, orderId: string, type: 'info' | 'success' | 'warning') => {
    const newNotif: AppNotification = { id: Date.now().toString(), workerName, action, orderId, time: new Date().toLocaleTimeString('ar-DZ'), type };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleWorkerOrderAction = (orderId: string, action: 'accept' | 'reject' | 'deliver') => {
    // STOP SOUND IMMEDIATELY
    stopNotificationSound();
    
    if (!currentUser) return;
    if (incomingOrder && incomingOrder.id === orderId) setIncomingOrder(null);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const updatedOrder = { ...orders[orderIndex] };
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    if (action === 'accept') {
      updatedOrder.status = 'accepted';
      updatedOrder.acceptedTime = currentTime; 
      addNotification('النظام', 'تم قبول المهمة وبدء التوصيل', orderId, 'info');
    } else if (action === 'reject') {
      updatedOrder.status = 'cancelled'; 
      updatedOrder.cancelledTime = currentTime; 
      updatedOrder.workerId = null; 
      addNotification('النظام', 'قام العامل برفض الطلب', orderId, 'warning');
    } else if (action === 'deliver') {
      updatedOrder.status = 'delivered';
      updatedOrder.deliveredTime = currentTime; 
      addNotification('النظام', 'تم توصيل الطلب بنجاح', orderId, 'success');
      
      const worker = workers.find(w => w.id === currentUser.id);
      if (worker) {
         const updatedWorker = { 
             ...worker, 
             ordersCompleted: (worker.ordersCompleted || 0) + 1, 
             totalEarnings: (worker.totalEarnings || 0) + updatedOrder.price 
         };
         DB.saveWorker(updatedWorker);
      }
    }
    DB.saveOrder(updatedOrder);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const newExpense: Expense = { id: `EXP-${Date.now()}`, workerId: currentUser.id, title: expenseForm.title, amount: parseFloat(expenseForm.amount), date: new Date().toLocaleDateString('ar-DZ'), time: new Date().toLocaleTimeString('ar-DZ') };
    DB.saveExpense(newExpense);
    setIsExpenseModalOpen(false);
    setExpenseForm({ title: '', amount: '' });
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) DB.deleteExpense(id);
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
      const updatedWorker: Worker = {
          ...editingWorker,
          name: workerForm.name,
          phone: workerForm.phone,
          password: workerForm.password ? workerForm.password : editingWorker.password,
          status: editingWorker.status 
      };
      DB.saveWorker(updatedWorker);
    } else {
      const newId = `W-${Math.floor(Math.random() * 10000)}`;
      const newWorker: Worker = { id: newId, name: workerForm.name, phone: workerForm.phone, password: workerForm.password, status: 'active', ordersCompleted: 0, totalEarnings: 0, openingBalance: 0, lastLogin: 'لم يسجل دخول بعد', notificationSound: 'tone-1' };
      DB.saveWorker(newWorker);
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
    
    const updatedWorker = { ...editingWorker, openingBalance: newBalance };
    DB.saveWorker(updatedWorker);
    
    setIsBalanceModalOpen(false);
    setEditingWorker(null);
  };

  const handleDeleteWorkerClick = (worker: Worker, e: React.MouseEvent, isSelf: boolean = false) => {
    if (e) e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, workerId: worker.id, workerName: worker.name, isSelf });
  };

  const executeDeleteWorker = () => {
    if (deleteConfirmation.workerId) {
      DB.deleteWorker(deleteConfirmation.workerId);
      setDeleteConfirmation({ isOpen: false, workerId: null, workerName: '', isSelf: false });
      if (deleteConfirmation.isSelf) onLogout();
    }
  };

  const openOrderModal = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({ 
          from: order.fromLocation, 
          to: order.toLocation, 
          price: order.price.toString(), 
          phone: order.customerPhone, 
          deliveryPhone: order.deliveryPhone || '', // Populate delivery phone
          workerId: order.workerId || '' , 
          description: order.description || '' 
      });
    } else {
      setEditingOrder(null);
      setOrderForm({ from: '', to: '', price: '', phone: '', deliveryPhone: '', workerId: '', description: '' });
    }
    setIsOrderModalOpen(true);
  };

  const onSubmitOrderForm = (e: React.FormEvent) => {
      e.preventDefault();
      // Show confirmation modal instead of saving immediately
      setIsSaveConfirmOpen(true);
  };

  const executeSaveOrder = async () => {
    // Check if user is a worker trying to edit an existing order
    if (role === 'worker' && editingOrder && currentUser) {
        // Create Change Request
        const newValues: Partial<Order> = {
            fromLocation: orderForm.from,
            toLocation: orderForm.to,
            price: Number(orderForm.price),
            customerPhone: orderForm.phone,
            deliveryPhone: orderForm.deliveryPhone,
            description: orderForm.description,
        };

        const changeRequest: OrderChangeRequest = {
            id: `REQ-${Date.now()}`,
            orderId: editingOrder.id,
            workerId: currentUser.id,
            workerName: currentUser.name,
            newValues: newValues,
            timestamp: new Date().toLocaleString('ar-DZ')
        };

        DB.createChangeRequest(changeRequest);
        setIsSaveConfirmOpen(false);
        setIsOrderModalOpen(false);
        return;
    }

    const selectedWorker = workers.find(w => w.id === orderForm.workerId);
    
    if (editingOrder) {
      // --- LOGIC FOR ADMIN EDITING ORDER ---
      const changes: string[] = [];
      const newPrice = Number(orderForm.price);
      
      if (editingOrder.price !== newPrice) changes.push(`السعر: ${editingOrder.price} -> ${newPrice}`);
      if (editingOrder.fromLocation !== orderForm.from) changes.push(`من: ${editingOrder.fromLocation} -> ${orderForm.from}`);
      if (editingOrder.toLocation !== orderForm.to) changes.push(`إلى: ${editingOrder.toLocation} -> ${orderForm.to}`);
      if (editingOrder.customerPhone !== orderForm.phone) changes.push(`هاتف المرسل: ${editingOrder.customerPhone} -> ${orderForm.phone}`);
      if (editingOrder.deliveryPhone !== orderForm.deliveryPhone) changes.push(`هاتف المستلم: ${editingOrder.deliveryPhone || 'لا يوجد'} -> ${orderForm.deliveryPhone}`);
      if (editingOrder.description !== orderForm.description) changes.push(`الوصف: ${editingOrder.description || 'لا يوجد'} -> ${orderForm.description || 'لا يوجد'}`);
      
      const updatedOrderData: Partial<Order> = {
          fromLocation: orderForm.from,
          toLocation: orderForm.to,
          price: newPrice,
          customerPhone: orderForm.phone,
          deliveryPhone: orderForm.deliveryPhone,
          workerId: orderForm.workerId,
          workerName: selectedWorker ? selectedWorker.name : 'غير محدد',
          description: orderForm.description,
      };

      // Perform partial update to DB
      DB.updateOrder(editingOrder.id, updatedOrderData);

      // If there are changes and the order is assigned to a worker, send a notification
      if (changes.length > 0 && orderForm.workerId) {
           const notification: AppNotification = {
               id: Date.now().toString(),
               workerId: orderForm.workerId,
               orderId: editingOrder.id,
               action: 'تم تعديل تفاصيل الطلب من الإدارة',
               time: new Date().toLocaleTimeString('ar-DZ'),
               type: 'admin_edit',
               isRead: false,
               changes: changes
           };
           DB.sendWorkerNotification(orderForm.workerId, notification);
      }

    } else {
      // --- NEW ORDER LOGIC ---
      const newId = await DB.generateOrderId();
      const newOrder: Order = { 
          id: newId, 
          fromLocation: orderForm.from, 
          toLocation: orderForm.to, 
          price: Number(orderForm.price), 
          customerPhone: orderForm.phone, 
          deliveryPhone: orderForm.deliveryPhone,
          workerId: orderForm.workerId, 
          workerName: selectedWorker?.name || 'غير محدد', 
          status: 'pending', 
          date: new Date().toLocaleDateString('en-GB'), 
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), 
          description: orderForm.description 
      };
      DB.saveOrder(newOrder);
      if (selectedWorker) addNotification(selectedWorker.name, `تم إرسال طلب جديد: ${orderForm.from} ◄ ${orderForm.to} (${orderForm.price} DA)`, newId, 'info');
    }
    
    setIsSaveConfirmOpen(false);
    setIsOrderModalOpen(false);
  };

  const handleReceiveAdminNotification = () => {
      if (!currentUser || !activeAdminAlert) return;
      
      // Stop sound (Handled by removing alert, but ensure we kill any potential loop)
      if (oscillatorRef.current) {
          try { oscillatorRef.current.stop(); } catch(e){}
      }
      
      // Mark as read in DB
      DB.markNotificationAsRead(currentUser.id, activeAdminAlert.id);
      
      // Clear state
      setActiveAdminAlert(null);
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm('تأكيد الحذف النهائي للطلب؟')) {
      // تحديث فوري للواجهة لضمان شعور المستخدم بالاستجابة
      setOrders(prev => prev.filter(o => o.id !== id));
      
      // تنفيذ الحذف الفعلي من قاعدة البيانات
      DB.deleteOrder(id).catch(err => {
        console.error("فشل حذف الطلب:", err);
        alert("حدث خطأ أثناء محاولة حذف الطلب من قاعدة البيانات.");
        // في حال فشل الحذف الفعلي، يمكن إعادة تحميل البيانات (اختياري)
      });
    }
  };
  
  const handleAddFavorite = async (type: 'pickup' | 'dropoff', value: string) => {
    if(!value.trim()) return;
    await DB.addLocation(type, value.trim());
  }

  const handleNudgeWorker = (e: React.MouseEvent, worker: Worker) => {
    e.stopPropagation();
    const phone = worker.phone.replace(/\D/g, '');
    let internationalPhone = phone;
    if (phone.startsWith('0')) {
        internationalPhone = '213' + phone.slice(1);
    } else if (!phone.startsWith('213')) {
        internationalPhone = '213' + phone;
    }

    const message = "ادخل الى الموقع";
    const url = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  const renderLocationInput = (
    label: string, 
    value: string, 
    setValue: (val: string) => void, 
    favorites: string[], 
    type: 'pickup' | 'dropoff', 
    placeholder: string
  ) => {
    const isFavorite = favorites.includes(value.trim());

    return (
        <div>
            <label className="block text-sm text-slate-400 mb-1">{label}</label>
            <div className="relative mb-2">
                <input 
                    required 
                    type="text" 
                    className={`w-full border rounded-lg p-2.5 pr-10 focus:border-red-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-300'}`} 
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                    placeholder={placeholder} 
                />
                <button 
                    type="button"
                    onClick={() => !isFavorite && handleAddFavorite(type, value)}
                    className={`absolute left-2 top1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isFavorite ? 'text-yellow-500 cursor-default' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}
                    title={isFavorite ? "موجود في المفضلة" : "إضافة للمفضلة"}
                >
                    {isFavorite ? <Star size={16} fill="currentColor"/> : <Plus size={16}/>}
                </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {favorites.map((loc, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setValue(loc)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all ${value === loc ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')}`}
                    >
                        {loc}
                    </button>
                ))}
            </div>
        </div>
    );
  };

  const getWorkerStats = (workerId: string) => {
    const workerOrders = orders.filter(o => o.workerId === workerId);
    const completed = workerOrders.filter(o => o.status === 'delivered').length;
    const totalEarnings = workerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.price, 0);
    const workerProfit = Math.round(totalEarnings * (2/3));
    const companyProfit = totalEarnings - workerProfit;
    return { total: workerOrders.length, completed, totalEarnings, workerProfit, companyProfit, workerOrders };
  };

  const handlePreviewTone = (id: string) => {
      // If same tone is clicked, stop it
      if (previewPlayingId === id) {
          stopPreview();
          return;
      }
      
      // Stop previous
      stopPreview();
      
      setPreviewPlayingId(id);
      // Play tone without loop for preview
      playToneById(id, 5, false);
      
      if (id !== 'custom') {
          // Only clear synthetic tones automatically, let songs play
          const timer = setTimeout(() => {
              setPreviewPlayingId(null);
          }, 5500);
          setPreviewInterval(timer);
      }
  };

  const stopPreview = () => {
      if (previewInterval) clearTimeout(previewInterval);
      setPreviewPlayingId(null);
      stopNotificationSound();
  };
  
  useEffect(() => {
      return () => { 
          if (previewInterval) clearTimeout(previewInterval); 
          stopNotificationSound();
      }
  }, [previewInterval]);


  const selectTone = (id: string) => {
      stopPreview();
      if (!currentUser) return;
      
      // If the user tries to activate 'custom' but hasn't uploaded anything or saved anything, show alert
      if (id === 'custom' && !currentUser.customRingTone && !pendingCustomAudio) {
           alert("يرجى رفع ملف صوتي أولاً.");
           return;
      }
      
      const updatedWorker = { ...currentUser, notificationSound: id };
      DB.saveWorker(updatedWorker);
      setIsSoundModalOpen(false);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) { // Increased to 15MB limit for full songs
          alert('حجم الملف كبير جداً. يرجى اختيار ملف صوتي أصغر من 15 ميغابايت.');
          return;
      }

      if (!file.type.startsWith('audio/')) {
          alert('يرجى اختيار ملف صوتي صحيح (MP3, WAV, etc).');
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          
          // DO NOT SAVE TO DB YET. Just set pending state and play it.
          setPendingCustomAudio(base64);
          setPendingCustomAudioName(file.name);
          
          // Stop any playing sound
          stopPreview();
          
          // Play the new uploaded sound immediately so user can hear it (no loop for preview)
          playCustomAudio(base64, false);
          
          // Mark 'custom' as playing for UI feedback
          setPreviewPlayingId('custom');
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
  };
  
  const handleSaveCustomTone = () => {
      if (!currentUser || !pendingCustomAudio) return;
      
      const updatedWorker = {
          ...currentUser,
          customRingTone: pendingCustomAudio,
          customRingToneName: pendingCustomAudioName || 'ملف صوتي مخصص',
          notificationSound: 'custom' // Auto select custom tone
      };
      
      DB.saveWorker(updatedWorker);
      setPendingCustomAudio(null);
      setPendingCustomAudioName(null);
      stopPreview();
      alert('تم حفظ الأغنية وتفعيلها بنجاح!');
      setIsSoundModalOpen(false);
  };
  
  const handleCancelCustomTone = () => {
      setPendingCustomAudio(null);
      setPendingCustomAudioName(null);
      stopPreview();
  };

  const handleApproveRequest = async (req: OrderChangeRequest) => {
    if (!window.confirm('هل أنت متأكد من قبول التعديلات؟')) return;
    
    setProcessingRequestId(req.id);
    try {
      await DB.approveChangeRequest(req);
      
      // Notify Worker
      const notification: AppNotification = {
          id: Date.now().toString(),
          workerId: req.workerId,
          orderId: req.orderId,
          action: 'تمت الموافقة على طلب التعديل',
          time: new Date().toLocaleTimeString('ar-DZ'),
          type: 'success',
          isRead: false
      };
      DB.sendWorkerNotification(req.workerId, notification);
      
    } catch (error) {
      console.error("Approve Request Error:", error);
      alert('حدث خطأ أثناء الموافقة على الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (req: OrderChangeRequest) => {
    if (!window.confirm('هل أنت متأكد من رفض/حذف الطلب؟')) return;

    setProcessingRequestId(req.id);
    try {
      await DB.rejectChangeRequest(req.id);
      
      // Notify Worker
      const notification: AppNotification = {
          id: Date.now().toString(),
          workerId: req.workerId,
          orderId: req.orderId,
          action: 'تم رفض طلب التعديل',
          time: new Date().toLocaleTimeString('ar-DZ'),
          type: 'warning',
          isRead: false
      };
      DB.sendWorkerNotification(req.workerId, notification);
      
    } catch (error) {
        console.error("Reject Request Error:", error);
        alert('حدث خطأ أثناء رفض الطلب.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Helper to render changes
  const renderChangeDiff = (label: string, oldVal: any, newVal: any) => {
      if (oldVal == newVal) return null; // loose equality for numbers/strings
      // Handle undefined/null gracefully
      const displayOld = oldVal === undefined || oldVal === null || oldVal === '' ? '---' : oldVal;
      const displayNew = newVal === undefined || newVal === null || newVal === '' ? '---' : newVal;
      
      return (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border-b pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
               <span className="text-slate-400 font-bold shrink-0">{label}</span>
               <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border w-full sm:w-auto justify-end ${isDarkMode ? 'bg-slate-900/50 border-slate-700/30' : 'bg-slate-50 border-slate-200'}`}>
                   <span className="text-red-400 line-through decoration-red-500/50 decoration-2 text-xs opacity-70 truncate max-w-[100px]">{displayOld}</span>
                   <ArrowRight size={12} className="text-slate-500 shrink-0"/>
                   <span className="text-green-500 font-bold truncate max-w-[150px]">{displayNew}</span>
               </div>
          </div>
      );
  }

  const renderWorkerPanel = () => {
    if (!currentUser) return <div>Loading...</div>;
    const myProfile = workers.find(w => w.id === currentUser.id) || currentUser;
    const myOrders = orders.filter(o => o.workerId === currentUser.id);
    const myStats = getWorkerStats(currentUser.id);
    const pendingOrders = myOrders.filter(o => o.status === 'pending');
    const activeOrders = myOrders.filter(o => o.status === 'accepted');
    const historyOrders = myOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    
    // Improved Card Style Class for Light/Dark modes
    const cardClass = isDarkMode 
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-slate-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] border-b-4 hover:shadow-lg transition-shadow';

    const renderWorkerOverview = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div onClick={() => setActiveTab('tasks')} className={`cursor-pointer hover:scale-[1.02] transition-transform p-4 rounded-2xl border flex flex-col items-center text-center ${cardClass} ${!isDarkMode && 'border-b-blue-500'}`}>
            <div className={`w-10 h-10 ${pendingOrders.length > 0 ? 'bg-orange-500 text-white animate-bounce' : 'bg-blue-500/20 text-blue-500'} rounded-full flex items-center justify-center mb-2`}>
              <Package size={20} />
            </div>
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pendingOrders.length}</span>
            <span className="text-xs text-slate-400">طلب جديد</span>
          </div>
          <div onClick={() => setActiveTab('tasks')} className={`cursor-pointer hover:scale-[1.02] transition-transform p-4 rounded-2xl border flex flex-col items-center text-center ${cardClass} ${!isDarkMode && 'border-b-yellow-500'}`}>
            <div className="w-10 h-10 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-2">
              <Bike size={20} />
            </div>
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{activeOrders.length}</span>
            <span className="text-xs text-slate-400">قيد التوصيل</span>
          </div>
          <div onClick={() => setActiveTab('history')} className={`cursor-pointer hover:scale-[1.02] transition-transform p-4 rounded-2xl border flex flex-col items-center text-center ${cardClass} ${!isDarkMode && 'border-b-green-500'}`}>
            <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={20} />
            </div>
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{myStats.completed}</span>
            <span className="text-xs text-slate-400">مكتمل</span>
          </div>
          <div onClick={() => setActiveTab('wallet')} className={`cursor-pointer hover:scale-[1.02] transition-transform p-4 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden group ${cardClass} ${!isDarkMode && 'border-b-emerald-500'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <Banknote size={20} />
            </div>
            <span className="text-2xl font-bold text-green-500">{myStats.workerProfit}</span>
            <span className="text-xs text-slate-400">صافي الربح (DA)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <ClipboardList size={20} className="text-slate-400" />
              المهام الحالية
            </h3>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
            {pendingOrders.map(order => (
              <MotionDiv 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={order.id} 
                className={`rounded-2xl p-1 border-2 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800 border-yellow-500/50 shadow-xl shadow-yellow-500/10' : 'bg-white border-yellow-500/50 shadow-[0_10px_40px_-10px_rgba(234,179,8,0.2)]'}`}
              >
                 <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} p-5 rounded-xl h-full`}>
                    <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg z-10 flex items-center gap-2">
                       <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
                        </span>
                       طلب جديد!
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 mt-4">
                        <div className="flex flex-col gap-3 w-full">
                          <div className={`flex items-center gap-3 p-2 rounded-lg ${isDarkMode ? 'text-slate-200 bg-slate-800' : 'text-slate-700 bg-white border border-slate-200 shadow-sm'}`}>
                              <MapPin size={18} className="text-red-500 shrink-0" /> 
                              <span className="text-sm font-bold truncate">من: {order.fromLocation}</span>
                          </div>
                          <div className={`flex items-center gap-3 p-2 rounded-lg ${isDarkMode ? 'text-slate-200 bg-slate-800' : 'text-slate-700 bg-white border border-slate-200 shadow-sm'}`}>
                              <MapPin size={18} className="text-green-500 shrink-0" /> 
                              <span className="text-sm font-bold truncate">إلى: {order.toLocation}</span>
                          </div>
                        </div>
                        <div className="text-2xl font-black text-yellow-500 mr-4 whitespace-nowrap drop-shadow-sm">{order.price} <span className="text-xs text-slate-500 font-medium">DA</span></div>
                    </div>

                    {order.description && (
                        <div className={`p-3 rounded-lg border mb-6 text-sm relative ${isDarkMode ? 'bg-slate-800/80 border-slate-700/50 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                             <span className={`absolute -top-2.5 right-3 text-xs px-2 py-0.5 rounded border ${isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>وصف الطلبية</span>
                             <p className="mt-1 flex items-start gap-2">
                                <FileText size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                {order.description}
                             </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button 
                          onClick={() => handleWorkerOrderAction(order.id, 'accept')}
                          variant='primary'
                          fullWidth
                          className="!bg-green-600 hover:!bg-green-500 !border-green-800 !shadow-[0_4px_14px_rgba(22,163,74,0.4)]"
                          icon={<Check size={20} strokeWidth={3} />}
                        >
                          قبول المهمة
                        </Button>
                        <button 
                          onClick={() => handleWorkerOrderAction(order.id, 'reject')}
                          className="px-5 bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 rounded-xl font-bold transition-colors"
                        >
                          <XCircle size={24} />
                        </button>
                    </div>
                 </div>
              </MotionDiv>
            ))}
            </AnimatePresence>

            {activeOrders.map(order => (
              <div key={order.id} className={`rounded-2xl p-5 border-l-4 border-blue-500 relative overflow-hidden ${isDarkMode ? 'bg-slate-800 shadow-lg' : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100'}`}>
                 <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl animate-pulse">جاري التوصيل...</div>
                 
                 <div className="flex justify-between items-start mb-6 mt-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-slate-400 text-xs">رقم الطلب: {order.id}</span>
                       <span className="text-slate-400 text-xs">{order.time}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border backdrop-blur ${isDarkMode ? 'bg-slate-900/50 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                        <span className="text-2xl font-black text-yellow-500">{order.price}</span>
                        <span className="text-xs text-slate-500 font-bold mr-1">DA</span>
                    </div>
                 </div>
                 
                 <div className={`h-px w-full mb-6 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                 <div className="flex flex-col gap-2 mb-6">
                    <div className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-red-500 ${isDarkMode ? 'bg-slate-700' : 'bg-red-50 border border-red-100'}`}><Navigation size={16}/></div>
                       <span className="font-bold">{order.fromLocation}</span>
                    </div>
                    <div className="h-4 border-l-2 border-dashed border-slate-300 mr-4"></div>
                    <div className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-green-500 ${isDarkMode ? 'bg-slate-700' : 'bg-green-50 border border-green-100'}`}><MapPin size={16}/></div>
                       <span className="font-bold">{order.toLocation}</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2 mb-4">
                     <div className={`flex-1 p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50 border border-slate-100'}`}>
                         <span className="text-[10px] text-slate-400 block mb-1">هاتف المرسل (استلام)</span>
                         <a href={`tel:${order.customerPhone}`} className="text-blue-500 font-bold text-sm block hover:underline">{order.customerPhone}</a>
                     </div>
                     {order.deliveryPhone && (
                         <div className={`flex-1 p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50 border border-slate-100'}`}>
                             <span className="text-[10px] text-slate-400 block mb-1">هاتف المستلم (تسليم)</span>
                             <a href={`tel:${order.deliveryPhone}`} className="text-green-500 font-bold text-sm block hover:underline">{order.deliveryPhone}</a>
                         </div>
                     )}
                 </div>

                 {order.description && (
                    <div className={`p-3 rounded-lg border mb-6 text-sm flex items-start gap-2 ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50 text-slate-300' : 'bg-yellow-50 border-yellow-200 text-slate-700'}`}>
                         <FileText size={16} className="text-slate-500 mt-0.5 shrink-0" />
                         <span>{order.description}</span>
                    </div>
                 )}

                 <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <a 
                          href={`tel:${order.deliveryPhone || order.customerPhone}`}
                          className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'}`}
                        >
                          <PhoneCall size={18} /> اتصال
                        </a>
                        <a 
                          href={`sms:${order.deliveryPhone || order.customerPhone}?body=${encodeURIComponent(
                            `السلام عليكم\nمعكم عامل توصيل الطلبيات لي مؤسسة speed delivery service ouargla\nنعلمكم اننا استلمنا طلبيتكم من "${order.fromLocation}" و نحن في طريقنا إلى "${order.toLocation}" لتسليمكم طلبيتكم\nشكرا لكم على تعاملكم معنا و ثقتكم بنا`
                          )}`}
                          className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-blue-500/30"
                        >
                          <MessageSquare size={18} /> رسالة نصية
                        </a>
                    </div>
                    <div className="flex gap-3">
                       <button 
                         onClick={() => openOrderModal(order)}
                         className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border ${isDarkMode ? 'bg-slate-700 hover:bg-orange-500/20 hover:text-orange-500 text-slate-300 border-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'}`}
                       >
                         <FileEdit size={22} /> تعديل
                       </button>
                       <Button
                         onClick={() => handleWorkerOrderAction(order.id, 'deliver')}
                         className="flex-[2] !text-lg"
                         icon={<CheckCircle size={22} />}
                       >
                          تم التوصيل
                       </Button>
                    </div>
                 </div>
              </div>
            ))}

            {pendingOrders.length === 0 && activeOrders.length === 0 && (
              <div className={`text-center py-12 rounded-2xl border border-dashed ${isDarkMode ? 'text-slate-500 bg-slate-800/50 border-slate-700' : 'text-slate-400 bg-white border-slate-300'}`}>
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
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
        <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
           <History size={20} className="text-slate-400" />
           سجل الطلبات
        </h3>
        {historyOrders.length === 0 ? (
           <div className="text-center py-12 text-slate-500">لا يوجد سجل سابق</div>
        ) : (
          historyOrders.map(order => (
            <div key={order.id} className={`p-4 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.05)]'}`}>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{order.toLocation}</span>
                     <StatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-slate-400 flex gap-2">
                     <span>{order.date}</span>
                     <span>•</span>
                     <span>{order.time}</span>
                  </div>
               </div>
               <div className="text-green-500 font-bold">
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
             <div className={`rounded-2xl border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center shadow-md">
                   <div className="flex items-center gap-2 text-white">
                      <Banknote size={20} />
                      <span className="font-bold">الرصيد الافتتاحي</span>
                   </div>
                   <span className="font-black text-2xl text-white tracking-wide drop-shadow-sm">{openingBalance.toFixed(2)}</span>
                </div>
                <div className={`grid grid-cols-2 divide-x divide-x-reverse ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                   <div className="flex flex-col">
                      <div className={`flex justify-between items-center p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                         <span className="text-sm text-slate-400">مجموع التوصيل</span>
                         <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{deliveryTotal.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between items-center p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                         <span className="text-sm text-slate-400">فائدة المكتب</span>
                         <span className="font-bold text-blue-500">{officeShare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-500/10">
                         <span className="text-sm text-green-600 font-bold">الفائدة (2/3)</span>
                         <span className="font-bold text-green-600">{workerGrossProfit.toFixed(2)}</span>
                      </div>
                   </div>
                   <div className="flex flex-col">
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-blue-500/10">
                         <span className="text-sm text-blue-600 font-bold">مجموع المصروف</span>
                         <span className="font-bold text-blue-600">{totalExpenses.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-yellow-500/10">
                         <span className="text-sm text-yellow-600 font-bold">الباقي من السعر الكلي</span>
                         <span className="font-bold text-yellow-600">{netCashHand.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between items-center p-3 border-b ${isDarkMode ? 'border-slate-700 bg-green-900/10' : 'border-slate-100 bg-slate-50'}`}>
                         <span className="text-sm text-slate-400">السعر الكلي</span>
                         <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{totalLiquidity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-yellow-500/20">
                         <span className="text-sm text-yellow-600 font-bold">السعر الكلي الصافي</span>
                         <span className="font-bold text-yellow-600">{workerEquity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-400/20">
                         <span className="text-sm text-yellow-600 font-bold">الباقي من الفائدة</span>
                         <span className="font-bold text-yellow-600">{workerNetProfit.toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {(!myProfile.openingBalance || myProfile.openingBalance === 0) ? (
                 <Button onClick={() => openBalanceModal(myProfile)} variant="secondary" icon={<Plus size={16} />}>إدخال الرصيد الافتتاحي</Button>
               ) : (
                 <Button onClick={() => openBalanceModal(myProfile)} variant="secondary" icon={<RefreshCw size={16} />}>تعديل الرصيد الافتتاحي</Button>
               )}
               <Button onClick={prepareWorkerDailyReport} variant="secondary" icon={generatingReportId === 'daily-worker' ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18} />}>
                  تصدير التقرير (PDF)
               </Button>
             </div>

             <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                   <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><Receipt size={20} className="text-red-500" />المصاريف</h3>
                   <button onClick={() => setIsExpenseModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors shadow-lg shadow-red-600/20"><Plus size={16} /> إضافة مصروف</button>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                   {myExpenses.length === 0 ? <div className="p-8 text-center text-slate-500"><Receipt size={32} className="mx-auto mb-2 opacity-20" /><p className="text-sm">لا توجد مصاريف مسجلة</p></div> : (
                      <table className="w-full text-right text-sm">
                         <thead className={`sticky top-0 ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-600 font-bold'}`}><tr><th className="p-3 font-medium">التفاصيل</th><th className="p-3 font-medium">المبلغ</th><th className="p-3 font-medium w-10"></th></tr></thead>
                         <tbody className={isDarkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-100'}>
                            {myExpenses.map(expense => (
                               <tr key={expense.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                                  <td className="p-3"><p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{expense.title}</p><p className="text-[10px] text-slate-500">{expense.date} • {expense.time}</p></td>
                                  <td className="p-3 font-bold text-red-500">-{expense.amount} DA</td>
                                  <td className="p-3 text-center"><button onClick={() => handleDeleteExpense(expense.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   )}
                </div>
             </div>
          </div>
        );
    }
    const renderWorkerSettings = () => (
      <div className="space-y-6">
        <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><Settings size={20} className="text-slate-400" />إعدادات الحساب</h3>
        <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-md'}`}>
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white border-4 border-white/10 shadow-lg">{myProfile.name.charAt(0)}</div>
              <div><h3 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{myProfile.name}</h3><p className="text-slate-400">{myProfile.phone}</p><span className="inline-block mt-2 px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded-full border border-green-500/20 font-bold">حساب نشط</span></div>
           </div>
           <div className={`border-t pt-6 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
               <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500"><Volume2 size={20} />إعدادات الإشعارات</h4>
               <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                           {myProfile.notificationSound === 'custom' ? <Mic size={24} /> : <Music size={24} />}
                       </div>
                       <div>
                           <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>نغمة التنبيه</p>
                           <p className="text-xs text-slate-400 mt-1">
                               {myProfile.notificationSound === 'custom' 
                                   ? (myProfile.customRingToneName || 'ملف صوتي مخصص')
                                   : SOUND_PRESETS.find(s => s.id === (myProfile.notificationSound || 'tone-1'))?.name || 'الافتراضي'}
                           </p>
                       </div>
                   </div>
                   <button onClick={() => setIsSoundModalOpen(true)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'}`}>تغيير النغمة</button>
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

  const renderAdminPanel = () => {
     const renderAdminOverview = () => {
        const totalOrders = orders.length;
        const activeWorkersCount = workers.filter(w => w.status === 'active').length;
        const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.price, 0);
        const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
        
        const recentOrders = [...orders].sort((a, b) => {
            const splitA = a.id.split('-');
            const splitB = b.id.split('-');
            
            if (splitA.length < 2 || splitB.length < 2) return 0;
            
            const dateA = splitA[0]; 
            const seqA = parseInt(splitA[1]);
            
            const dateB = splitB[0];
            const seqB = parseInt(splitB[1]);

            const isoA = dateA.substr(4,4) + dateA.substr(2,2) + dateA.substr(0,2);
            const isoB = dateB.substr(4,4) + dateB.substr(2,2) + dateB.substr(0,2);

            if (isoA !== isoB) {
                return isoB.localeCompare(isoA); 
            }
            return seqB - seqA; 
        });

        const adminProfit = Math.round(totalRevenue / 3);

        const adminStats = [
            { label: 'الطلبات الكلية', value: totalOrders.toString(), color: 'bg-blue-500', icon: Package },
            { label: 'السائقين النشطين', value: activeWorkersCount.toString(), color: 'bg-green-500', icon: Bike },
            { label: 'طلبات قيد الانتظار', value: pendingOrdersCount.toString(), color: 'bg-orange-500', icon: Clock },
            { label: 'الأرباح (DA)', value: adminProfit.toLocaleString(), color: 'bg-yellow-500', icon: BarChart3 },
        ];

        // Light Mode Card Class for Stats
        const statCardClass = isDarkMode 
           ? 'bg-slate-800 border-slate-700' 
           : 'bg-white border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-b-4';

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminStats.map((stat, idx) => (
                 <div key={idx} className={`p-4 rounded-2xl border flex flex-col items-center text-center hover:scale-[1.02] transition-transform ${statCardClass} ${!isDarkMode && `border-b-${stat.color.replace('bg-', '')}`}`}>
                    <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center mb-2 text-white shadow-lg`}>
                       <stat.icon size={20} />
                    </div>
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stat.value}</span>
                    <span className="text-xs text-slate-400">{stat.label}</span>
                 </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className={`p-6 rounded-2xl border flex flex-col h-[600px] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
                  <h3 className={`font-bold text-lg mb-4 flex items-center justify-between border-b pb-2 ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-100 text-slate-800'}`}>
                     <div className="flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        سجل الطلبات المباشر
                     </div>
                     <span className="text-xs text-slate-500 flex items-center gap-1">
                        <ArrowDown size={14} /> الأحدث أولاً
                     </span>
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                     {recentOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                           <Package size={48} className="opacity-20 mb-2" />
                           <p>لا توجد طلبات حديثة</p>
                        </div>
                     ) : (
                        recentOrders.map(order => (
                           <div key={order.id} className={`p-4 rounded-2xl border flex flex-col gap-3 hover:border-slate-500 transition-colors shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'}`}>
                              <div className={`absolute top-0 right-0 w-1 h-full ${order.status === 'pending' ? 'bg-orange-500' : order.status === 'accepted' ? 'bg-blue-500' : order.status === 'delivered' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              
                              <div className="flex items-start gap-4">
                                  {/* Left Side (RTL Right): Icon & Edit Button Container */}
                                  <div className="flex flex-col items-center gap-3 shrink-0">
                                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border shrink-0 shadow-inner relative z-10 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                         <AnimatedStatusIcon status={order.status} size={28} />
                                      </div>
                                      
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); openOrderModal(order); }}
                                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm group ${isDarkMode ? 'bg-slate-800 hover:bg-blue-600 text-blue-500 hover:text-white border-slate-700 hover:border-blue-500' : 'bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-slate-200 hover:border-blue-500'}`}
                                          title="تعديل الطلب"
                                      >
                                          <Edit size={18} className="group-hover:scale-110 transition-transform"/>
                                      </button>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-center mb-2">
                                        <div className="flex flex-col">
                                            <span className={`font-black text-lg truncate tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                               {order.workerName || <span className="text-red-400 italic text-sm">غير محدد</span>}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono tracking-widest">#{order.id}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-2xl font-black font-mono tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{order.time}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                     </div>
                                     <div className={`h-px w-full mb-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}></div>
                                     <div className={`flex items-center gap-2 text-xs mb-3 p-2 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-1 max-w-[45%] truncate">
                                           <span className="text-red-500 font-bold">من:</span>
                                           <span className={`truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{order.fromLocation}</span>
                                        </div>
                                        <ArrowRight size={10} className="text-slate-400 shrink-0" />
                                        <div className="flex items-center gap-1 max-w-[45%] truncate">
                                           <span className="text-green-500 font-bold">إلى:</span>
                                           <span className={`truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{order.toLocation}</span>
                                        </div>
                                     </div>
                                     
                                     {/* Timeline Section */}
                                     <div className={`mt-3 pt-3 border-t relative ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                        <div className="flex items-center justify-between relative px-2">
                                            {/* Background Line */}
                                            <div className={`absolute top-1.5 left-4 right-4 h-0.5 -z-10 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                                            
                                            {/* Creation Point (Right) */}
                                            <div className="flex flex-col items-center gap-1">
                                                 <div className={`w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)] ring-2 ${isDarkMode ? 'ring-slate-800' : 'ring-white'}`}></div>
                                                 <span className="text-[10px] font-bold text-orange-400">{order.time}</span>
                                                 <span className="text-[9px] text-slate-500">إنشاء</span>
                                            </div>

                                            {/* Connector 1 */}
                                            <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${order.acceptedTime ? 'bg-blue-500' : (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}`}></div>

                                            {/* Accepted Point (Center) */}
                                            <div className="flex flex-col items-center gap-1">
                                                 <div className={`w-3 h-3 rounded-full ring-2 ${isDarkMode ? 'ring-slate-800' : 'ring-white'} ${order.acceptedTime ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}></div>
                                                 <span className={`text-[10px] font-bold ${order.acceptedTime ? 'text-blue-500' : 'text-slate-400'}`}>{order.acceptedTime || '--:--'}</span>
                                                 <span className="text-[9px] text-slate-500">قبول</span>
                                            </div>

                                            {/* Connector 2 */}
                                            <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${order.deliveredTime ? 'bg-green-500' : (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}`}></div>

                                            {/* Delivered Point (Left) */}
                                            <div className="flex flex-col items-center gap-1">
                                                 <div className={`w-3 h-3 rounded-full ring-2 ${isDarkMode ? 'ring-slate-800' : 'ring-white'} ${order.deliveredTime ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}></div>
                                                 <span className={`text-[10px] font-bold ${order.deliveredTime ? 'text-green-500' : 'text-slate-400'}`}>{order.deliveredTime || '--:--'}</span>
                                                 <span className="text-[9px] text-slate-500">توصيل</span>
                                            </div>
                                        </div>
                                     </div>

                                  </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               <div className={`p-6 rounded-2xl border flex flex-col h-[600px] relative overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                  <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 relative z-10 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-green-400' : 'bg-green-100 text-green-600'}`}>
                          <TrendingUp size={20} />
                      </div>
                      مركز العمليات السريع
                  </h3>
                  
                  <div className="flex-1 flex flex-col gap-4 relative z-10">
                     {/* Add Order Card */}
                     <button 
                        onClick={() => openOrderModal()} 
                        className={`flex-1 relative overflow-hidden group rounded-2xl border transition-all duration-300 text-right p-6 flex flex-col justify-center gap-2
                        ${isDarkMode 
                           ? 'bg-slate-700/30 hover:bg-slate-700 border-slate-600 hover:border-orange-500/50' 
                           : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-orange-500 hover:shadow-lg'
                        }`}
                     >
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 group-hover:w-2 transition-all"></div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 group-hover:rotate-3 ${isDarkMode ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-100 text-orange-600'}`}>
                           <Plus size={24} strokeWidth={3} />
                        </div>
                        <div>
                           <h4 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>تسجيل طلب جديد</h4>
                           <p className="text-sm text-slate-400 group-hover:text-slate-500">إدخال بيانات طلبية جديدة وإسنادها لسائق</p>
                        </div>
                        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0">
                           <ArrowLeft size={20} className="text-orange-500" />
                        </div>
                     </button>
                     
                     {/* Add Worker Card */}
                     <button 
                        onClick={() => openWorkerModal()} 
                        className={`flex-1 relative overflow-hidden group rounded-2xl border transition-all duration-300 text-right p-6 flex flex-col justify-center gap-2
                        ${isDarkMode 
                           ? 'bg-slate-700/30 hover:bg-slate-700 border-slate-600 hover:border-blue-500/50' 
                           : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg'
                        }`}
                     >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 group-hover:rotate-3 ${isDarkMode ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-100 text-blue-600'}`}>
                           <Users size={24} strokeWidth={3} />
                        </div>
                        <div>
                           <h4 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>إضافة سائق جديد</h4>
                           <p className="text-sm text-slate-400 group-hover:text-slate-500">تسجيل حساب عامل جديد وتفعيل الصلاحيات</p>
                        </div>
                        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0">
                           <ArrowLeft size={20} className="text-blue-500" />
                        </div>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        );
    }
    const renderAdminMap = () => (
       <div className={`h-[calc(100vh-140px)] w-full relative rounded-3xl overflow-hidden border shadow-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
          <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2">
              <AnimatePresence>
                {!isMapListOpen ? (
                  <MotionButton
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    onClick={() => setIsMapListOpen(true)}
                    className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl text-white group hover:border-blue-500/50 transition-all"
                  >
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    <span className="text-sm font-bold">عرض السائقين</span>
                    <Users size={20} className="text-blue-400 group-hover:text-white transition-colors" />
                  </MotionButton>
                ) : (
                  <MotionDiv 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl max-w-xs w-64 relative"
                  >
                      <button 
                        onClick={() => setIsMapListOpen(false)}
                        className="absolute -top-2 -left-2 w-7 h-7 bg-slate-800 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all flex items-center justify-center shadow-lg"
                      >
                        <X size={16} />
                      </button>

                      <h3 className="font-bold mb-2 flex items-center gap-2 text-white">
                          <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </div>
                          السائقين النشطين
                      </h3>
                      <p className="text-[10px] text-slate-400 mb-3">يتم تحديث الموقع تلقائياً عند تحرك السائقين</p>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {workers.filter(w => w.status === 'active' && w.latitude).map(w => (
                              <div key={w.id} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 group hover:border-green-500/50 transition-colors">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="font-bold flex-1 truncate">{w.name}</span>
                                  <Bike size={14} className="text-slate-600 group-hover:text-green-500 transition-colors" />
                              </div>
                          ))}
                          {workers.filter(w => w.status === 'active' && w.latitude).length === 0 && (
                              <div className="text-slate-500 text-[10px] text-center py-4 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">لا يوجد سائقين متصلين حالياً</div>
                          )}
                      </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
          </div>
          <LiveMap workers={workers} orders={orders} />
       </div>
    );
    const renderAdminWorkers = () => (
      <div className="space-y-8">
          <div className="flex justify-between items-center px-2">
              <div>
                  <h3 className={`text-3xl font-black flex items-center gap-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <Users className="text-blue-500" size={32} strokeWidth={2.5}/> فريق العمل
                  </h3>
                  <p className="text-sm text-slate-500 font-bold mt-1">إدارة حسابات السائقين وصلاحياتهم</p>
              </div>
              <Button onClick={() => openWorkerModal()} className="!w-14 !h-14 !rounded-2xl flex items-center justify-center p-0" icon={<Plus size={32} strokeWidth={3}/>} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workers.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-600 border-2 border-dashed border-slate-700/50 rounded-[3rem]">
                    <Users size={64} className="mx-auto mb-4 opacity-10" />
                    <p className="font-black">لا يوجد سائقين مسجلين</p>
                </div>
            ) : (
                workers.map((w, idx) => (
                    <MotionDiv 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: idx * 0.05 }}
                      key={w.id} 
                      className={`p-6 rounded-[2.5rem] border flex justify-between items-center transition-all shadow-lg group ${isDarkMode ? 'bg-slate-800 border-slate-700/50 hover:border-blue-500/30 hover:bg-slate-700/30' : 'bg-white border-slate-200 hover:border-blue-500/30 hover:shadow-xl'}`}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-2xl border-2 border-white/5 shadow-2xl text-blue-500 group-hover:scale-110 transition-transform">
                               {w.name.charAt(0)}
                            </div>
                            <div>
                                <p className={`font-black text-xl group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{w.name}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1 font-bold"><Phone size={14} className="text-slate-600"/> {w.phone}</p>
                                <div className="mt-3">
                                   <span className={`px-3 py-1 rounded-xl text-[10px] font-black border ${w.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                      {w.status === 'active' ? 'نشط الآن' : 'موقف مؤقتاً'}
                                   </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openWorkerModal(w)} className={`p-4 rounded-2xl transition-all shadow-md ${isDarkMode ? 'bg-slate-700/50 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}>
                                <Edit size={22}/>
                            </button>
                            <button onClick={(e) => handleDeleteWorkerClick(w, e)} className="p-4 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-md">
                                <Trash2 size={22}/>
                            </button>
                        </div>
                    </MotionDiv>
                ))
            )}
          </div>
      </div>
    );
    const renderAdminOrders = () => {
        const sortedOrders = [...orders].sort((a, b) => {
            const splitA = a.id.split('-');
            const splitB = b.id.split('-');
            
            if (splitA.length < 2 || splitB.length < 2) return 0;
            
            const dateA = splitA[0]; 
            const seqA = parseInt(splitA[1]);
            
            const dateB = splitB[0];
            const seqB = parseInt(splitB[1]);

            const isoA = dateA.substr(4,4) + dateA.substr(2,2) + dateA.substr(0,2);
            const isoB = dateB.substr(4,4) + dateB.substr(2,2) + dateB.substr(0,2);

            if (isoA !== isoB) {
                return isoB.localeCompare(isoA); 
            }
            return seqB - seqA; 
        });

      return (
      <div className="space-y-6">
         {changeRequests.length > 0 && (
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500 rounded-xl p-4 flex justify-between items-center animate-pulse shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 text-white p-2 rounded-lg">
                        <GitPullRequest size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">توجد طلبات تعديل معلقة</h4>
                        <p className="text-xs text-slate-300">يوجد {changeRequests.length} طلبات تعديل من العمال بانتظار الموافقة</p>
                    </div>
                </div>
                <button 
                  onClick={() => setIsRequestsModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg"
                >
                    مراجعة الطلبات
                </button>
            </div>
         )}

         <div className="flex justify-between items-center">
            <h3 className={`font-bold text-xl flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
               <Package size={24} className="text-orange-500" />
               إدارة الطلبات
            </h3>
            <Button onClick={() => openOrderModal()} icon={<Plus size={18} />} className="!bg-orange-600 hover:!bg-orange-500 !border-orange-700 !shadow-[0_4px_14px_rgba(234,88,12,0.4)]">طلب جديد</Button>
         </div>

         <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="overflow-x-auto">
               <table className="w-full text-right">
                  <thead>
                     <tr className={`text-sm ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-700 font-bold border-b border-slate-200'}`}>
                        <th className="p-4">رقم الطلب</th>
                        <th className="p-4">من - إلى</th>
                        <th className="p-4">السائق</th>
                        <th className="p-4">السعر</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">الإجراءات</th>
                     </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-100'}>
                     {sortedOrders.map(order => (
                        <tr key={order.id} className={isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}>
                           <td className="p-4 font-mono text-sm text-slate-400 font-bold" dir="ltr">{order.id}</td>
                           <td className="p-4">
                              <div className="flex flex-col gap-1 text-sm">
                                 <span className="flex items-center gap-1"><MapPin size={12} className="text-red-500"/> {order.fromLocation}</span>
                                 <span className="flex items-center gap-1"><MapPin size={12} className="text-green-500"/> {order.toLocation}</span>
                              </div>
                           </td>
                           <td className="p-4 text-sm font-medium">
                              {order.workerName || <span className="text-slate-400 italic">غير محدد</span>}
                           </td>
                           <td className="p-4 font-black text-yellow-500">{order.price} DA</td>
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
    };
    const renderAdminReports = () => (
      <div className="space-y-6">
         <div className={`p-6 rounded-2xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
             <div className="relative z-10">
                 <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <Database size={24} className="text-blue-400" />
                    مركز إدارة البيانات
                 </h3>
                 <div className="flex flex-wrap gap-4">
                     <button onClick={handleBackupData} className="flex-1 min-w-[200px] bg-slate-700 hover:bg-blue-600 text-white p-4 rounded-xl border border-slate-600 hover:border-blue-500 transition-all flex flex-col items-center gap-2 group shadow-lg">
                        <div className="p-2 rounded-full bg-slate-800 group-hover:bg-blue-500/20 text-blue-400 group-hover:text-white transition-colors">
                            <Save size={24} />
                        </div>
                        <span className="font-bold">حفظ نسخة احتياطية</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-100">تنزيل ملف JSON لكامل البيانات</span>
                     </button>

                     <button onClick={handleRestoreClick} className="flex-1 min-w-[200px] bg-slate-700 hover:bg-purple-600 text-white p-4 rounded-xl border border-slate-600 hover:border-purple-500 transition-all flex flex-col items-center gap-2 group shadow-lg">
                        <div className="p-2 rounded-full bg-slate-800 group-hover:bg-purple-500/20 text-purple-400 group-hover:text-white transition-colors">
                            <Upload size={24} />
                        </div>
                        <span className="font-bold">استعادة البيانات</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-purple-100">رفع ملف JSON لاسترجاع البيانات</span>
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleFileChange} 
                           className="hidden" 
                           accept=".json"
                        />
                     </button>

                     <button onClick={handleSystemReset} className="flex-1 min-w-[200px] bg-slate-700 hover:bg-red-600 text-white p-4 rounded-xl border border-slate-600 hover:border-red-500 transition-all flex flex-col items-center gap-2 group relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">خطر</div>
                        <div className="p-2 rounded-full bg-slate-800 group-hover:bg-red-500/20 text-red-400 group-hover:text-white transition-colors">
                            <AlertOctagon size={24} />
                        </div>
                        <span className="font-bold">تصفير النظام</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-red-100">حذف الطلبات + تصفير العدادات</span>
                     </button>
                 </div>
             </div>
         </div>

         <div className={`w-full h-px my-2 ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}></div>

         <h3 className={`font-bold text-xl flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <FileText size={24} className="text-green-500" />
            التقارير المالية
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={prepareGlobalReport} className={`cursor-pointer p-6 rounded-2xl border transition-all group text-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-green-500' : 'bg-white border-slate-200 shadow-xl hover:border-green-500 hover:border-green-500 hover:shadow-2xl'}`}>
               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 group-hover:scale-110 transition-transform">
                  <BarChart3 size={32} />
               </div>
               <h4 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>التقرير العام</h4>
               <p className="text-sm text-slate-400 mb-4">توليد تقرير شامل لجميع العمليات والمدخولات المالية للنظام.</p>
               <span className="text-green-500 text-sm font-bold flex items-center justify-center gap-1">
                  {generatingReportId === 'global' ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                  تحميل PDF
               </span>
            </div>

            <div className={`md:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
               <h4 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>تقارير العمال (أرباح الشركة)</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workers.map(worker => (
                     <div key={worker.id} onClick={() => prepareWorkerReport(worker)} className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-white shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-600">
                           {worker.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                           <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{worker.name}</p>
                           <p className="text-xs text-slate-500">الأرباح: {worker.totalEarnings} DA</p>
                        </div>
                        {generatingReportId === worker.id ? <Loader2 className="animate-spin text-blue-500" size={16} /> : <Download size={16} className="text-slate-400" />}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    );

    switch(activeTab) {
       case 'overview': return renderAdminOverview();
       case 'map': return renderAdminMap();
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

  // Background style for main dashboard container
  const dashboardBg = isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900';

  return (
    <div className={`min-h-screen flex font-sans relative transition-colors duration-300 ${dashboardBg}`}>
      
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
        pendingRequestsCount={role === 'admin' ? changeRequests.length : 0}
        onOpenRequests={() => setIsRequestsModalOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* ... (Report Data & PDF Generation - Same content as before) ... */}
      {reportData && (
        <div id="printable-report" className="fixed top-0 left-0 -z-50 w-[210mm] min-h-[297mm] bg-white text-slate-900 font-sans flex flex-col p-8" dir="rtl">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                     <Bike size={48} strokeWidth={2.5} />
                  </div>
                  <div>
                     <h1 className="text-4xl font-black text-slate-900 tracking-tighter">SPEED <span className="text-red-600">DELIVERY</span></h1>
                     <p className="text-sm font-bold text-slate-500 tracking-[0.3em] mt-1">OUARGLA</p>
                  </div>
               </div>
               <div className="text-left">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">{reportData.title}</h2>
                  <p className="text-slate-500 font-medium">{reportData.date}</p>
                  <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
                     رقم التقرير: #{Math.floor(Math.random() * 100000)}
                  </div>
               </div>
            </div>
            
            {reportData.type === 'global' && reportData.groupedOrders && (
                <div className="flex-1 flex flex-col gap-8">
                    {Object.entries(reportData.groupedOrders).map(([workerId, workerOrders]) => {
                        const worker = workers.find(w => w.id === workerId) || { name: 'غير معروف', phone: '---' };
                        const workerTotalRevenue = workerOrders.reduce((acc, o) => acc + o.price, 0);
                        const workerOfficeShare = Math.round(workerTotalRevenue / 3);

                        return (
                            <div key={workerId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
                                <div className="bg-slate-900 px-6 py-3 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{worker.name.charAt(0)}</div>
                                        <div>
                                            <h3 className="font-bold text-sm">{worker.name}</h3>
                                            <p className="text-[10px] text-slate-400">{worker.phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 block">عدد الطلبيات</span>
                                        <span className="font-bold">{workerOrders.length}</span>
                                    </div>
                                </div>
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                            <th className="px-4 py-2">رقم الطلب</th>
                                            <th className="px-4 py-2">التوقيت</th>
                                            <th className="px-4 py-2">من</th>
                                            <th className="px-4 py-2">إلى</th>
                                            <th className="px-4 py-2">السعر</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {workerOrders.map(order => (
                                            <tr key={order.id}>
                                                <td className="px-4 py-2 font-mono text-slate-400">{order.id}</td>
                                                <td className="px-4 py-2">{order.time}</td>
                                                <td className="px-4 py-2">{order.fromLocation}</td>
                                                <td className="px-4 py-2">{order.toLocation}</td>
                                                <td className="px-4 py-2 font-bold">{order.price} DA</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-200">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-2 font-bold text-left pl-4 text-slate-600">المجموع الكلي للعامل:</td>
                                            <td className="px-4 py-2 font-bold text-slate-800">{workerTotalRevenue} DA</td>
                                        </tr>
                                        <tr className="bg-green-50 border-t border-green-100">
                                            <td colSpan={4} className="px-4 py-3 font-bold text-left pl-4 text-green-700">أرباح المكتب (1/3):</td>
                                            <td className="px-4 py-3 font-black text-green-700 text-sm">{workerOfficeShare} DA</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        );
                    })}

                    <div className="mt-8 bg-slate-900 text-white p-6 rounded-2xl shadow-xl break-inside-avoid">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold mb-1">المجموع الكلي لأرباح المكتب</h3>
                                <p className="text-slate-400 text-sm">مجموع نسب المكتب (1/3) من جميع العمال لهذا اليوم</p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-green-400">{reportData.totalOfficeShare?.toLocaleString()} <span className="text-lg text-slate-500">DA</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(reportData.type === 'worker-daily' || reportData.type === 'worker-admin') && (
                <div className="flex-1 flex flex-col gap-6">
                    {/* Order Details Table - Common for both */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                            <ClipboardList size={20} className="text-slate-500" />
                            <h3 className="font-bold text-slate-800">تفاصيل الطلبيات المكتملة</h3>
                        </div>
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-3">#</th>
                                    <th className="px-6 py-3">التوقيت</th>
                                    <th className="px-6 py-3">من</th>
                                    <th className="px-6 py-3">إلى</th>
                                    <th className="px-6 py-3">السعر</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.orders.map((order, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                        <td className="px-6 py-3 font-mono text-slate-400 text-sm">{order.id}</td>
                                        <td className="px-6 py-3 text-sm">{order.time}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-600">{order.fromLocation}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-600">{order.toLocation}</td>
                                        <td className="px-6 py-3">
                                            <span className="font-bold text-slate-900">{order.price} DA</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 font-bold text-left pl-8 text-slate-600">المجموع الكلي:</td>
                                    <td className="px-6 py-4 font-black text-xl text-slate-900">{reportData.financials?.totalDelivery.toLocaleString()} DA</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {reportData.expenses && reportData.expenses.length > 0 && (
                        <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
                            <div className="bg-red-50 px-6 py-3 border-b border-red-100 flex items-center gap-2">
                                <Receipt size={20} className="text-red-500" />
                                <h3 className="font-bold text-red-800">المصاريف</h3>
                            </div>
                            <table className="w-full text-right text-sm">
                                <thead className="bg-red-50/50 text-red-600">
                                    <tr>
                                        <th className="px-6 py-2">التفاصيل</th>
                                        <th className="px-6 py-2">التوقيت</th>
                                        <th className="px-6 py-2">المبلغ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100">
                                    {reportData.expenses.map((exp, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-2">{exp.title}</td>
                                            <td className="px-6 py-2 text-slate-500 text-xs">{exp.time}</td>
                                            <td className="px-6 py-2 font-bold text-red-600">-{exp.amount} DA</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-red-100">
                                        <td colSpan={2} className="px-6 py-2 font-bold text-left pl-8 text-red-800">مجموع المصاريف:</td>
                                        <td className="px-6 py-2 font-bold text-red-800">-{reportData.financials?.totalExpenses} DA</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* --- ADMIN REPORT SPECIFIC SECTION --- */}
                    {reportData.type === 'worker-admin' && (
                         <div className="break-inside-avoid mt-2">
                             <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-2">
                                 <PieChart className="text-blue-600" size={28} />
                                 <h3 className="text-2xl font-black text-slate-800">ملخص توزيع الأرباح</h3>
                             </div>

                             <div className="grid grid-cols-1 gap-6">
                                 {/* 1. Worker Share Card (2/3) */}
                                 <div className="bg-emerald-50 rounded-3xl p-8 border-2 border-emerald-100 flex items-center justify-between relative overflow-hidden">
                                     <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                     <div className="relative z-10 flex items-center gap-6">
                                         <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-md border border-emerald-100">
                                             <UserCheck size={40} strokeWidth={2} />
                                         </div>
                                         <div>
                                             <h4 className="text-emerald-900 font-black text-xl">أرباح العامل</h4>
                                             <div className="inline-flex items-center gap-1 bg-emerald-200/50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mt-2">
                                                 <span>حصة 2/3</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="text-right relative z-10">
                                         <p className="text-5xl font-black text-emerald-600 tracking-tight">{reportData.financials?.workerGrossShare.toLocaleString()}</p>
                                         <p className="text-emerald-800 font-bold mt-1">دينار جزائري (DA)</p>
                                     </div>
                                 </div>

                                 {/* 2. Office Share Card (1/3) */}
                                 <div className="bg-blue-50 rounded-3xl p-8 border-2 border-blue-100 flex items-center justify-between relative overflow-hidden">
                                     <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                     <div className="relative z-10 flex items-center gap-6">
                                         <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-md border border-blue-100">
                                             <Shield size={40} strokeWidth={2} />
                                         </div>
                                         <div>
                                             <h4 className="text-blue-900 font-black text-xl">أرباح المكتب</h4>
                                             <div className="inline-flex items-center gap-1 bg-blue-200/50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mt-2">
                                                 <span>حصة 1/3</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="text-right relative z-10">
                                         <p className="text-5xl font-black text-blue-600 tracking-tight">{reportData.financials?.officeShare.toLocaleString()}</p>
                                         <p className="text-blue-800 font-bold mt-1">دينار جزائري (DA)</p>
                                     </div>
                                 </div>
                             </div>

                             {/* Total Summary Footer */}
                             <div className="mt-6 bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-xl">
                                 <div className="flex items-center gap-4">
                                     <div className="bg-white/10 p-3 rounded-xl">
                                         <Package size={24} />
                                     </div>
                                     <div>
                                         <p className="text-slate-400 font-medium">المجموع الكلي (Total)</p>
                                         <p className="text-sm text-slate-500">{reportData.orders.length} طلبية ناجحة</p>
                                     </div>
                                 </div>
                                 <p className="text-4xl font-black">{reportData.financials?.totalDelivery.toLocaleString()} DA</p>
                             </div>
                         </div>
                    )}

                     {/* --- WORKER DAILY REPORT (OLD WALLET TABLE) --- */}
                     {reportData.type === 'worker-daily' && (
                        <div className="break-inside-avoid">
                           <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                              <Wallet size={20} className="text-blue-600" />
                              الخلاصة المالية (المحفظة)
                           </h3>
                           <div className="border-2 border-slate-900 rounded-xl overflow-hidden text-sm">
                               <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                                   <span className="font-bold">الرصيد الافتتاحي (بداية اليوم)</span>
                                   <span className="font-black text-xl">{reportData.financials?.openingBalance.toLocaleString()} DA</span>
                               </div>
                               
                               <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-200 border-b border-slate-200 bg-white">
                                   <div>
                                       <div className="flex justify-between p-3 border-b border-slate-100">
                                           <span className="text-slate-600">مجموع التوصيل</span>
                                           <span className="font-bold">{reportData.financials?.totalDelivery.toLocaleString()}</span>
                                       </div>
                                       <div className="flex justify-between p-3 border-b border-slate-100 bg-slate-50">
                                           <span className="text-slate-600">فائدة المكتب (1/3)</span>
                                           <span className="font-bold text-blue-600">{reportData.financials?.officeShare.toLocaleString()}</span>
                                       </div>
                                       <div className="flex justify-between p-3 bg-green-50">
                                           <span className="text-green-700 font-bold">الفائدة (2/3)</span>
                                           <span className="font-bold text-green-700">{reportData.financials?.workerGrossShare.toLocaleString()}</span>
                                       </div>
                                   </div>
                                   
                                   <div>
                                        <div className="flex justify-between p-3 border-b border-slate-100">
                                           <span className="text-slate-600">مجموع المصروف</span>
                                           <span className="font-bold text-red-500">-{reportData.financials?.totalExpenses.toLocaleString()}</span>
                                       </div>
                                       <div className="flex justify-between p-3 border-b border-slate-100 bg-yellow-50">
                                           <span className="text-yellow-700 font-bold">الباقي من السعر الكلي (كاش)</span>
                                           <span className="font-bold text-yellow-700">{reportData.financials?.netCashHand.toLocaleString()}</span>
                                       </div>
                                       <div className="flex justify-between p-3 bg-slate-100">
                                           <span className="font-bold text-slate-800">السعر الكلي (Liquidity)</span>
                                           <span className="font-bold text-slate-800">{reportData.financials?.totalLiquidity.toLocaleString()}</span>
                                       </div>
                                   </div>
                               </div>

                               <div className="bg-yellow-100 p-3 flex justify-between items-center border-b border-yellow-200 text-yellow-900">
                                   <span className="font-bold">السعر الكلي الصافي (الرصيد النهائي)</span>
                                   <span className="font-black text-lg">{reportData.financials?.workerEquity.toLocaleString()} DA</span>
                               </div>
                               <div className="bg-green-100 p-3 flex justify-between items-center text-green-900">
                                   <span className="font-bold">صافي الربح الحقيقي (بعد المصاريف)</span>
                                   <span className="font-black text-lg">{reportData.financials?.workerNetProfit.toLocaleString()} DA</span>
                               </div>
                           </div>
                       </div>
                    )}
                </div>
            )}

            <div className="mt-auto border-t border-slate-200 pt-6 flex justify-between items-center text-slate-400 text-xs">
                <p>© {new Date().getFullYear()} Speed Delivery Ouargla - All Rights Reserved.</p>
                <p>تم استخراج التقرير آلياً من النظام</p>
            </div>
        </div>
      )}

      {/* Notifications and Modals */}
      <AnimatePresence>
        {incomingOrder && !activeAdminAlert && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                {/* ... Incoming Order Modal ... */}
                <MotionDiv 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-full max-w-sm relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-500/20 blur-[50px] rounded-full animate-pulse"></div>
                    <div className="bg-slate-800 border-2 border-yellow-500 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500 animate-pulse"></div>
                        <div className="text-center mb-6"><div className="w-20 h-20 bg-yellow-500 text-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-bounce"><Bell size={40} className="animate-wiggle" /></div><h2 className="text-3xl font-black text-white mb-1">طلب جديد!</h2><p className="text-yellow-400 font-bold">يرجى الاستجابة فوراً</p></div>
                        <div className="space-y-4 mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                             <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-red-500 border border-slate-700"><Navigation size={16}/></div><div className="flex-1"><p className="text-xs text-slate-500">من</p><p className="font-bold text-white text-sm">{incomingOrder.fromLocation}</p></div></div>
                             <div className="flex justify-center -my-2 pl-4"><div className="h-6 border-l-2 border-dashed border-slate-700"></div></div>
                             <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-green-500 border border-slate-700"><MapPin size={16}/></div><div className="flex-1"><p className="text-xs text-slate-500">إلى</p><p className="font-bold text-white text-sm">{incomingOrder.toLocation}</p></div></div>
                             {incomingOrder.description && (<div className="mt-3 pt-3 border-t border-slate-700/50"><p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><FileText size={10}/> ملاحظات:</p><p className="text-sm text-slate-200 bg-slate-800 p-2 rounded-lg border border-slate-700">{incomingOrder.description}</p></div>)}
                             <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center"><span className="text-slate-400 text-sm">السعر المقترح</span><span className="text-2xl font-black text-white">{incomingOrder.price} <span className="text-xs text-slate-500 font-normal">DA</span></span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => handleWorkerOrderAction(incomingOrder.id, 'accept')} className="bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"><CheckCircle size={24} /> قبول</button>
                             <button onClick={() => handleWorkerOrderAction(incomingOrder.id, 'reject')} className="bg-slate-700 hover:bg-red-600/20 hover:text-red-500 text-slate-300 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><XCircle size={24} /> رفض</button>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAdminAlert && (
            <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                {/* ... Admin Alert Modal ... */}
                <MotionDiv 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-full max-w-md relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/20 blur-[60px] rounded-full animate-pulse"></div>
                    <div className="bg-slate-800 border-2 border-orange-500 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-red-500"></div>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-orange-500/10 border-2 border-orange-500 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                <FileEdit size={40} className="animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">تحديث من الإدارة</h2>
                            <p className="text-slate-400 text-sm">تم إجراء تعديلات على الطلب <span className="text-orange-400 font-mono font-bold">#{activeAdminAlert.orderId}</span></p>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 mb-8 max-h-48 overflow-y-auto custom-scrollbar">
                             {activeAdminAlert.changes && activeAdminAlert.changes.length > 0 ? (
                                <ul className="space-y-3">
                                    {activeAdminAlert.changes.map((change, idx) => (
                                        <li key={idx} className="text-sm text-slate-200 flex items-start gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700/30">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></div>
                                            <span className="leading-relaxed">{change}</span>
                                        </li>
                                    ))}
                                </ul>
                             ) : (
                                <p className="text-center text-slate-500 text-sm">لا توجد تفاصيل إضافية</p>
                             )}
                        </div>

                        <button onClick={handleReceiveAdminNotification} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                            <CheckCheck size={24} /> استلام التنبيه
                        </button>
                    </div>
                </MotionDiv>
            </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pr-4 md:pr-10">
        {/* Header - Light Mode Optimized */}
        <header className={`h-20 backdrop-blur-xl border-b flex items-center justify-center px-6 sticky top-0 z-30 relative transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-white/80 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'}`}>
          <div className="flex items-center gap-2">
            {/* UPDATED: Show Animated Logo only for Admin */}
            <Logo size="sm" showSubtitle={false} variant={role === 'admin' ? 'header-3d-anime' : 'default'} />
          </div>
          <div className="absolute left-6 flex items-center gap-4 transition-all">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${role === 'admin' ? (isDarkMode ? 'bg-red-900/30 border-red-500/50 text-red-200' : 'bg-red-50 border-red-200 text-red-600') : (isDarkMode ? 'bg-blue-900/30 border-blue-500/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-600')}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white shadow-sm border border-slate-100'}`}>{role === 'admin' ? 'A' : (currentUser?.name.charAt(0) || 'W')}</div>
              <span className="text-xs font-bold">{role === 'admin' ? 'الإدارة' : currentUser?.name}</span>
            </div>
          </div>
        </header>

        {/* Info Bar - Light Mode Optimized */}
        <div className={`w-full border-b backdrop-blur-md py-2 px-4 md:px-8 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 z-20 relative ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/60 border-slate-200'}`}>
            <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${isDarkMode ? 'text-slate-300 bg-slate-800/50 border-slate-700/50' : 'text-slate-600 bg-white border-slate-200 shadow-sm'}`}><CalendarDays size={16} className="text-red-500" /><span className="tracking-wide text-xs md:text-sm">{currentTime.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${isDarkMode ? 'text-slate-300 bg-slate-800/50 border-slate-700/50' : 'text-slate-600 bg-white border-slate-200 shadow-sm'}`}><Clock size={16} className="text-blue-500" /><span className={`font-mono font-bold tracking-widest text-sm md:text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{currentTime.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span></div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 text-[10px] md:text-xs px-3 py-1 rounded-full border ${isCloudActive ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20' : 'text-orange-500 bg-orange-500/5 border-orange-500/20'}`}>
                    <span className="relative flex h-2 w-2"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCloudActive ? 'bg-emerald-400' : 'bg-orange-400'}`}></span><span className={`relative inline-flex rounded-full h-2 w-2 ${isCloudActive ? 'bg-emerald-500' : 'bg-orange-500'}`}></span></span>
                    <span className="font-bold flex items-center gap-1">{isCloudActive ? 'متصل (Firebase)' : 'محلي (Offline)'}{isCloudActive ? <Cloud size={12}/> : <CloudOff size={12}/>}</span>
                </div>
            </div>
        </div>

        {role === 'worker' && liveWorker && (
           <div className="flex justify-center mt-4 px-4 relative z-20">
              <div className={`p-1.5 rounded-2xl flex border shadow-xl relative overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)]'}`}>
                 <button onClick={() => setWorkerAvailability('active')} className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${liveWorker.status === 'active' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-700/10'}`}>
                    {liveWorker.status === 'active' && (<motion.span layoutId="active-glow" className="absolute inset-0 bg-white/20 blur-lg rounded-xl" transition={{ duration: 0.3 }} />)}
                    <UserCheck size={18} strokeWidth={2.5} />
                    <span>متاح للعمل</span>
                    {liveWorker.status === 'active' && (<span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>)}
                 </button>
                 <div className={`w-px mx-1 self-stretch ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                 <button onClick={() => setWorkerAvailability('suspended')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${liveWorker.status === 'suspended' || liveWorker.status !== 'active' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-700/10'}`}>
                    <UserX size={18} strokeWidth={2.5} />
                    <span>غير متاح</span>
                 </button>
              </div>
           </div>
        )}
        
        {/* Wake Lock Hint */}
        {role === 'worker' && liveWorker?.status === 'active' && (
           <div className="flex justify-center mt-2 z-10">
               <span className={`text-[10px] text-slate-500 flex items-center gap-1 px-3 py-1 rounded-full border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                   <Smartphone size={10} className="animate-pulse text-green-500" />
                   ابقِ الشاشة مفتوحة لضمان دقة التتبع
               </span>
           </div>
        )}

        {role === 'worker' && liveWorker && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={`border-b backdrop-blur cursor-pointer transition-colors relative z-20 group mt-2 ${isDarkMode ? 'bg-emerald-950/30 border-emerald-500/20 hover:bg-emerald-950/50' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`} onClick={() => setActiveTab('wallet')}>
             <div className="flex items-center justify-center py-2 gap-3"><span className={`text-xs font-medium hidden sm:inline-block ${isDarkMode ? 'text-emerald-400/70' : 'text-emerald-700'}`}>الرصيد الافتتاحي الحالي:</span><div className="flex items-center gap-2"><Banknote size={16} className="text-emerald-500" /><span className={`text-lg font-bold font-mono tracking-wider ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>{liveWorker.openingBalance || 0}</span><span className="text-xs text-emerald-500 font-bold">DA</span></div><div className={`absolute left-6 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1 transition-colors ${isDarkMode ? 'text-emerald-500/50 group-hover:text-emerald-400' : 'text-emerald-600/70 group-hover:text-emerald-800'}`}><span>تحديث</span><Edit size={10} /></div></div>
          </motion.div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <AnimatePresence mode='wait'>
            <MotionDiv key={activeTab + (selectedWorkerForReport ? '-detail' : '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {role === 'admin' ? renderAdminPanel() : renderWorkerPanel()}
            </MotionDiv>
          </AnimatePresence>
        </main>
      </div>

      {isSoundModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}><h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><Music size={24} className="text-blue-500" /> اختيار نغمة الإشعارات</h3><button onClick={() => { setIsSoundModalOpen(false); stopPreview(); }} className="p-2 hover:bg-slate-700/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><XCircle size={20} /></button></div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                  {/* ... Sound Content ... */}
                   <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-white border-blue-100'}`}>
                      {/* ... (Upload logic same as before) ... */}
                      <div className="flex justify-between items-center mb-3">
                          <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><Upload size={18} className="text-blue-400"/> موسيقى خاصة (أغاني)</h4>
                          <span className={`text-[10px] px-2 py-1 rounded ${isDarkMode ? 'text-slate-500 bg-slate-900' : 'text-slate-500 bg-white border border-slate-200'}`}>Max 15MB (MP3)</span>
                      </div>
                      
                      {!pendingCustomAudio ? (
                        <>
                          <input 
                              type="file" 
                              accept="audio/*" 
                              ref={audioFileRef} 
                              className="hidden" 
                              onChange={handleAudioUpload} 
                          />
                          <button 
                              onClick={() => audioFileRef.current?.click()}
                              className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-all group ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white border-slate-600 hover:border-blue-500' : 'bg-white hover:bg-blue-50 text-blue-500 hover:text-blue-600 border-slate-300 hover:border-blue-500'}`}
                          >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-slate-900' : 'bg-blue-100'}`}>
                                 <Upload size={20} />
                              </div>
                              <span className="font-bold text-sm">اضغط لاختيار ملف أغنية من الهاتف</span>
                          </button>
                        </>
                      ) : (
                         <div className="bg-blue-600 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl overflow-hidden relative">
                             {/* Music Visualizer Effect Background */}
                             <div className="absolute inset-0 flex items-end justify-center gap-1 opacity-20 pointer-events-none px-4 pb-2">
                                 {[...Array(20)].map((_, i) => (
                                     <MotionDiv
                                        key={i}
                                        className="w-full bg-white rounded-t-sm"
                                        animate={{ height: ['20%', '80%', '40%'] }}
                                        transition={{ 
                                            duration: 0.5 + Math.random(), 
                                            repeat: Infinity, 
                                            repeatType: "reverse",
                                            delay: Math.random() * 0.5 
                                        }}
                                     />
                                 ))}
                             </div>

                             <div className="relative z-10">
                                 <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-inner">
                                        <Disc size={24} className={previewPlayingId === 'custom' ? "animate-spin-slow" : ""} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-white text-lg truncate">{pendingCustomAudioName || 'أغنية جديدة'}</p>
                                        <div className="flex items-center gap-2 text-blue-100 text-xs mt-1">
                                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                            جاري المعاينة...
                                        </div>
                                    </div>
                                 </div>
                                 
                                 <div className="flex gap-2">
                                    <button onClick={handleSaveCustomTone} className="flex-1 bg-white text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95">
                                        <Check size={18} strokeWidth={3} /> حفظ وتعيين
                                    </button>
                                    <button onClick={handleCancelCustomTone} className="w-12 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                 </div>
                             </div>
                         </div>
                      )}

                      {/* Display Saved Custom Tone with Player UI */}
                      {(liveWorker?.customRingTone && !pendingCustomAudio) && (
                          <div 
                             onClick={() => !((previewPlayingId === 'custom')) && handlePreviewTone('custom')}
                             className={`mt-3 p-4 rounded-xl border relative overflow-hidden group cursor-pointer transition-all ${liveWorker.notificationSound === 'custom' ? (isDarkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-500 shadow-md') : (isDarkMode ? 'bg-slate-900 border-slate-700 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-300')}`}
                          >
                             {previewPlayingId === 'custom' && (
                                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                             )}

                             <div className="flex items-center justify-between relative z-10">
                                 <div className="flex items-center gap-4 flex-1 min-w-0">
                                     <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${previewPlayingId === 'custom' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110' : (isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-100 text-blue-500')}`}>
                                         {previewPlayingId === 'custom' ? <Pause size={20} fill="currentColor"/> : <Play size={20} className="ml-0.5" fill="currentColor"/>}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <p className={`font-bold text-base truncate ${liveWorker.notificationSound === 'custom' ? 'text-blue-500' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>
                                            {liveWorker.customRingToneName || 'أغنيتي المفضلة'}
                                         </p>
                                         <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-500 bg-slate-200/50 dark:bg-slate-700 px-1.5 py-0.5 rounded">MP3/Audio</span>
                                            {previewPlayingId === 'custom' && <span className="text-[10px] text-green-500 font-bold animate-pulse">جاري التشغيل...</span>}
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-2">
                                    {previewPlayingId === 'custom' ? (
                                        <button onClick={(e) => { e.stopPropagation(); stopPreview(); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Square size={18} fill="currentColor" /></button>
                                    ) : null}
                                    
                                    <button onClick={(e) => { e.stopPropagation(); selectTone('custom'); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${liveWorker.notificationSound === 'custom' ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2 ring-offset-slate-900' : (isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}>
                                        {liveWorker.notificationSound === 'custom' ? 'مفعل' : 'تفعيل'}
                                    </button>
                                 </div>
                             </div>
                             
                             {/* Mini Progress Bar Animation (Fake) */}
                             {previewPlayingId === 'custom' && (
                                <div className="absolute bottom-0 left-0 h-1 bg-green-500/30 w-full">
                                    <MotionDiv 
                                        className="h-full bg-green-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 30, ease: "linear" }} // Arbitrary long duration since we don't know file length easily
                                    />
                                </div>
                             )}
                          </div>
                      )}
                  </div>
                  
                  {/* Preset Tones List */}
                  <div className="space-y-2">
                      <h4 className="font-bold text-slate-400 text-xs px-2 pt-2">نغمات النظام القصيرة</h4>
                      {SOUND_PRESETS.map((sound) => { 
                          const isSelected = (liveWorker?.notificationSound || 'tone-1') === sound.id; 
                          const isPlaying = previewPlayingId === sound.id; 
                          return (
                              <div key={sound.id} onClick={() => !isPlaying && handlePreviewTone(sound.id)} className={`p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${isSelected ? (isDarkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500') : (isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm')}`}>
                                  <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-green-500 text-white animate-pulse' : isSelected ? 'bg-blue-500 text-white' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400')}`}>
                                          {isPlaying ? <Volume2 size={24} /> : <Music size={24} />}
                                      </div>
                                      <div>
                                          <p className={`font-bold ${isSelected ? 'text-blue-500' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>{sound.name}</p>
                                          <p className="text-xs text-slate-400">{sound.description}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      {isPlaying ? (
                                          <button onClick={(e) => { e.stopPropagation(); stopPreview(); }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"><Square size={20} fill="currentColor" /></button>
                                      ) : (
                                          <button onClick={(e) => { e.stopPropagation(); handlePreviewTone(sound.id); }} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-green-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white'}`}><Play size={20} fill="currentColor" /></button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); selectTone(sound.id); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : (isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50')}`}>
                                          {isSelected ? 'مفعل' : 'تفعيل'}
                                      </button>
                                  </div>
                              </div>
                          ); 
                      })}
                  </div>
              </div>
           </MotionDiv>
        </div>
      )}

      {/* Modals for Editing (Styles preserved but classes updated for light mode compatibility) */}
      {role === 'admin' && isWorkerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`border w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{editingWorker ? 'تعديل بيانات العامل' : 'إنشاء حساب عامل جديد'}</h3>
            <form onSubmit={handleSaveWorker} className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">الاسم الكامل</label><input required type="text" className={`w-full border rounded-lg p-2.5 focus:border-red-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} /></div>
              <div><label className="block text-sm text-slate-400 mb-1">رقم الهاتف (يستخدم كاسم مستخدم)</label><input required type="tel" className={`w-full border rounded-lg p-2.5 focus:border-red-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={workerForm.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setWorkerForm({...workerForm, phone: val}) }} maxLength={10} placeholder="06xxxxxxxx" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">كلمة المرور {editingWorker ? ' (اتركها فارغة لعدم التغيير)' : ' (مطلوب)'}</label><input required={!editingWorker} type="password" className={`w-full border rounded-lg p-2.5 focus:border-red-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={workerForm.password} onChange={e => setWorkerForm({...workerForm, password: e.target.value})} /></div>
              <div className="flex gap-3 mt-6"><Button fullWidth type="submit">حفظ التغييرات</Button><Button fullWidth type="button" variant="secondary" onClick={() => setIsWorkerModalOpen(false)}>إلغاء</Button></div>
            </form>
          </motion.div>
        </div>
      )}

      {isBalanceModalOpen && editingWorker && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`border border-emerald-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500"><Banknote size={32} /></div><h3 className={`text-xl font-bold mb-2 text-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>إدارة الرصيد الافتتاحي</h3><p className="text-center text-sm text-slate-400 mb-6">تحديث الرصيد الافتتاحي للعامل: <span className="font-bold">{editingWorker.name}</span></p><form onSubmit={handleSaveBalance}><div className="mb-6"><label className="block text-sm text-slate-400 mb-1">المبلغ (DA)</label><input type="number" step="100" autoFocus className={`w-full border rounded-lg p-3 text-center text-xl font-bold focus:border-emerald-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={balanceForm.amount} onChange={e => setBalanceForm({...balanceForm, amount: e.target.value})} /></div><div className="flex gap-3"><Button fullWidth type="submit" className="!bg-emerald-600 hover:!bg-emerald-500 !shadow-emerald-600/30">حفظ الرصيد</Button><Button fullWidth type="button" variant="secondary" onClick={() => setIsBalanceModalOpen(false)}>إلغاء</Button></div></form></motion.div>
         </div>
      )}

      {isExpenseModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}><div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Receipt size={32} /></div><h3 className={`text-xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>إضافة مصروف جديد</h3><form onSubmit={handleSaveExpense}><div className="mb-4"><label className="block text-sm text-slate-400 mb-1">نوع المصروف</label><input type="text" autoFocus required className={`w-full border rounded-lg p-3 focus:border-red-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} placeholder="مثال: وقود، صيانة..." /></div><div className="mb-6"><label className="block text-sm text-slate-400 mb-1">السعر (DA)</label><input type="number" step="100" required className={`w-full border rounded-lg p-3 text-xl font-bold focus:border-red-500 outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} /></div><div className="flex gap-3"><Button fullWidth type="submit" className="!bg-red-600 hover:!bg-red-500 !shadow-red-600/30">حفظ المصروف</Button><Button fullWidth type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>إلغاء</Button></div></form></motion.div>
         </div>
      )}

      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl shadow-red-900/20 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={32} /></div>
             <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>حذف الحساب نهائياً؟</h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               {deleteConfirmation.isSelf ? "أنت على وشك حذف حسابك الشخصي نهائياً. سيؤدي هذا إلى تسجيل خروجك ومسح جميع بياناتك." : <span>أنت على وشك حذف حساب العامل <span className="font-bold">"{deleteConfirmation.workerName}"</span>.</span>}
               <br/><span className="text-red-400 font-bold mt-2 block">هذا الإجراء لا يمكن التراجع عنه.</span>
             </p>
             <div className="flex gap-3">
               <button onClick={executeDeleteWorker} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/30">تأكيد الحذف</button>
               <button onClick={() => setDeleteConfirmation({isOpen: false, workerId: null, workerName: '', isSelf: false})} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">إلغاء</button>
             </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;