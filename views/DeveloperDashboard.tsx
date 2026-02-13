import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Shield, Plus, Trash2, Key, Code, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { Admin } from '../types';
import { INITIAL_ADMINS } from '../constants';

interface DeveloperDashboardProps {
  onBack: () => void;
}

// Fix for TS errors
const MotionDiv = motion.div as any;

const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Admin Management State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  
  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  // Load admins on mount
  useEffect(() => {
    const stored = localStorage.getItem('speed_delivery_admins');
    if (stored) {
      setAdmins(JSON.parse(stored));
    } else {
      setAdmins(INITIAL_ADMINS);
    }
  }, []);

  // Sync admins to localStorage
  useEffect(() => {
    if (admins.length > 0) {
      localStorage.setItem('speed_delivery_admins', JSON.stringify(admins));
    }
  }, [admins]);

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize inputs: trim whitespace and lowercase username
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanUsername === 'zoubalovemama' && cleanPassword === 'zouba0699') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('بيانات المطور غير صحيحة');
    }
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminPass) return;

    if (admins.some(a => a.username === newAdminName)) {
      alert('اسم المشرف موجود مسبقاً');
      return;
    }

    const newAdmin: Admin = {
      id: `admin-${Date.now()}`,
      username: newAdminName,
      password: newAdminPass
    };

    setAdmins([...admins, newAdmin]);
    setNewAdminName('');
    setNewAdminPass('');
  };

  const initiateDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    const id = deleteModal.id;
    if (id) {
        if (admins.length <= 1) {
            alert('لا يمكن حذف المشرف الوحيد. قم بإضافة مشرف آخر أولاً.');
            setDeleteModal({ isOpen: false, id: null });
            return;
        }
        setAdmins(prevAdmins => prevAdmins.filter(a => a.id !== id));
        setDeleteModal({ isOpen: false, id: null });
    }
  };

  // --- RENDER LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative">
        <button 
          onClick={onBack}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors flex items-center gap-2 z-20"
        >
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        </div>

        <MotionDiv 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/30">
                <Code size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">منطقة المطورين</h2>
            <p className="text-slate-400 text-sm mt-2">
              الرجاء إدخال بيانات المطور للوصول إلى إعدادات النظام الحساسة.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-pulse">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleDevLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">اسم المطور</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-left"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-left"
                dir="ltr"
                required
              />
            </div>
            <Button 
              type="submit" 
              fullWidth 
              className="!bg-purple-600 hover:!bg-purple-500 !shadow-purple-600/30"
            >
              تسجيل الدخول
            </Button>
          </form>
        </MotionDiv>
      </div>
    );
  }

  // --- RENDER DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 relative">
       <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/30">
                      <Code size={24} />
                  </div>
                  <div>
                      <h1 className="text-2xl font-bold">لوحة تحكم المطور</h1>
                      <p className="text-slate-400 text-sm">إدارة صلاحيات الوصول للمشرفين</p>
                  </div>
              </div>
              <Button variant="secondary" onClick={onBack} icon={<ArrowRight size={18}/>}>
                  خروج
              </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add New Admin */}
              <MotionDiv 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
              >
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Plus size={20} className="text-green-500"/>
                      إضافة مشرف جديد
                  </h3>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div>
                          <label className="text-sm text-slate-400 mb-1 block">اسم المستخدم</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                            value={newAdminName}
                            onChange={e => setNewAdminName(e.target.value)}
                            required
                          />
                      </div>
                      <div>
                          <label className="text-sm text-slate-400 mb-1 block">كلمة المرور</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                            value={newAdminPass}
                            onChange={e => setNewAdminPass(e.target.value)}
                            required
                          />
                      </div>
                      <Button type="submit" fullWidth className="!bg-green-600 hover:!bg-green-500 mt-4">
                          حفظ المشرف
                      </Button>
                  </form>
              </MotionDiv>

              {/* List Admins */}
              <MotionDiv 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
              >
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Shield size={20} className="text-blue-500"/>
                      قائمة المشرفين المسجلين
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {admins.map(admin => (
                          <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700 group hover:border-blue-500/50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-600">
                                      {admin.username.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-white">{admin.username}</p>
                                      <p className="text-xs text-slate-500 flex items-center gap-1">
                                          <Key size={10} />
                                          {admin.password}
                                      </p>
                                  </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   if (admins.length > 1) {
                                      initiateDelete(admin.id);
                                   }
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  admins.length <= 1 
                                    ? 'text-slate-700 cursor-not-allowed' 
                                    : 'text-slate-500 hover:text-red-500 hover:bg-red-500/10'
                                }`}
                                disabled={admins.length <= 1}
                                title={admins.length <= 1 ? "لا يمكن حذف المشرف الوحيد" : "حذف المشرف"}
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))}
                  </div>
              </MotionDiv>
          </div>
       </div>

       {/* Delete Confirmation Modal */}
       <AnimatePresence>
       {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <MotionDiv 
             key="delete-modal"
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }} 
             exit={{ scale: 0.9, opacity: 0 }} 
             className="bg-slate-800 border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl shadow-red-900/20 text-center"
           >
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={32} /></div>
             <h3 className="text-xl font-bold mb-2 text-white">حذف حساب المشرف؟</h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               أنت على وشك حذف صلاحيات الدخول لهذا المشرف. <br />
               <span className="text-red-400 font-bold">لن يتمكن من الدخول للنظام بعد الآن.</span>
             </p>
             <div className="flex gap-3">
               <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/30">حذف نهائي</button>
               <button onClick={() => setDeleteModal({isOpen: false, id: null})} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">إلغاء</button>
             </div>
           </MotionDiv>
        </div>
       )}
       </AnimatePresence>
    </div>
  );
};

export default DeveloperDashboard;