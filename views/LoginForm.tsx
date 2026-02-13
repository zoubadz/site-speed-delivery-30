import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader2, AlertTriangle, ShieldAlert, User } from 'lucide-react';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { ViewState, Worker, Admin } from '../types';
import { INITIAL_WORKERS, INITIAL_ADMINS } from '../constants';

interface LoginFormProps {
  role: 'admin' | 'worker';
  onBack: () => void;
  onLoginSuccess: (view: ViewState, workerData?: Worker) => void;
}

// Fix for TS errors where motion props are not recognized
const MotionDiv = motion.div as any;

const LoginForm: React.FC<LoginFormProps> = ({ role, onBack, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Phone for worker, Username for admin
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const isWorker = role === 'worker';
  const accentColor = isWorker ? 'text-blue-500' : 'text-red-500';
  const focusRing = isWorker ? 'focus:ring-blue-500' : 'focus:ring-red-500';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Security: Check Rate Limiting
    if (isLocked) {
      setError('تم إيقاف الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة.');
      return;
    }

    if (attempts >= 5) {
      setIsLocked(true);
      setError('تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار.');
      setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        setError(null);
      }, 30000); // 30 seconds lockout
      return;
    }

    setLoading(true);

    // Simulate Network Latency
    setTimeout(() => {
      setLoading(false);

      if (role === 'admin') {
        // --- ADMIN LOGIN LOGIC (Dynamic) ---
        let currentAdmins: Admin[] = INITIAL_ADMINS;
        const storedAdmins = localStorage.getItem('speed_delivery_admins');
        
        if (storedAdmins) {
            try {
                currentAdmins = JSON.parse(storedAdmins);
            } catch (e) {
                console.error("Error parsing admins", e);
            }
        } else {
            // Initialize storage if empty
            localStorage.setItem('speed_delivery_admins', JSON.stringify(INITIAL_ADMINS));
        }

        const admin = currentAdmins.find(a => a.username === identifier.trim() && a.password === password);

        if (admin) {
          onLoginSuccess('dashboard-admin');
        } else {
          setAttempts(prev => prev + 1);
          setError('بيانات الدخول غير صحيحة');
        }
      } else {
        // --- WORKER LOGIN LOGIC ---
        // 1. Fetch latest workers from LocalStorage
        let currentWorkers: Worker[] = INITIAL_WORKERS;
        const storedWorkers = localStorage.getItem('speed_delivery_workers');
        if (storedWorkers) {
           try {
             currentWorkers = JSON.parse(storedWorkers);
           } catch (e) {
             console.error("Failed to parse workers", e);
           }
        }

        // 2. Find worker by phone
        const worker = currentWorkers.find(w => w.phone === identifier.trim());
        
        // 3. Check Password & Status
        if (worker && worker.password === password) {
          if (worker.status === 'active') {
             // Success - Pass worker data
             onLoginSuccess('dashboard-worker', worker);
          } else {
             // Account Suspended
             setError('تم إيقاف هذا الحساب. يرجى مراجعة الإدارة.');
          }
        } else {
          // 4. Failed Login
          setAttempts(prev => prev + 1);
          setError('رقم الهاتف أو كلمة المرور غير صحيحة');
        }
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${isWorker ? 'bg-blue-600' : 'bg-red-600'} rounded-full blur-[150px] opacity-10 transform translate-x-1/2 -translate-y-1/2`}></div>
        
        <button 
          onClick={onBack}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors flex items-center gap-2 z-20"
        >
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>

        <MotionDiv 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <Logo size="sm" showSubtitle={false} />
            <h2 className="text-2xl font-bold mt-4 text-white">
              {isWorker ? 'تسجيل دخول العمال' : 'تسجيل دخول الإدارة'}
            </h2>
            <p className="text-slate-400 text-sm mt-2 text-center">
              {isWorker 
                ? 'أدخل رقم الهاتف وكلمة المرور لبدء العمل' 
                : 'مرحباً بك مجدداً، يرجى إدخال بيانات الدخول للمتابعة'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-pulse">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {isWorker ? 'رقم الهاتف' : 'اسم المستخدم'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isWorker ? <Phone size={18} className="text-slate-500" /> : <User size={18} className="text-slate-500" />}
                </div>
                <input 
                  type={isWorker ? "tel" : "text"}
                  value={identifier}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (isWorker) {
                      // Restrict to numbers only and max 10 digits
                      val = val.replace(/\D/g, '').slice(0, 10);
                    }
                    setIdentifier(val);
                  }}
                  className={`w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-all placeholder-slate-600`}
                  placeholder={isWorker ? "06xxxxxxxx" : "أدخل اسم المستخدم"}
                  maxLength={isWorker ? 10 : undefined}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-all placeholder-slate-600`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              variant="primary" 
              className={isWorker ? '!bg-blue-600 hover:!bg-blue-500 !shadow-blue-600/30' : ''}
              disabled={loading || isLocked}
            >
              {loading ? <Loader2 className="animate-spin" /> : isLocked ? 'محاولة لاحقة...' : 'تسجيل الدخول'}
            </Button>

            {isWorker && (
              <div className="text-center mt-4">
                 <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                   <ShieldAlert size={12} />
                   <span>عدد المحاولات المتبقية: {5 - attempts}</span>
                 </p>
              </div>
            )}
          </form>
        </MotionDiv>
    </div>
  );
};

export default LoginForm;