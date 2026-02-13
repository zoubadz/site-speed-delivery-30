import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Shield, Plus, Trash2, Key, Code, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import { Admin } from '../types';
import { DB, isCloudActive } from '../services/db';

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [isDeleting, setIsDeleting] = useState(false);

  // Load admins via DB subscription
  useEffect(() => {
    const unsubscribe = DB.subscribeToAdmins((data) => {
        setAdmins(Array.isArray(data) ? data : []);
    });
    return () => {
      if(unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanUsername === 'zoubalovemama' && cleanPassword === 'zouba0699') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('بيانات المطور غير صحيحة');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!newAdminName || !newAdminPass) return;

    const safeAdmins = Array.isArray(admins) ? admins : [];
    if (safeAdmins.some(a => a.username === newAdminName)) {
      alert('اسم المشرف موجود مسبقاً');
      return;
    }

    setIsSaving(true);
    const newAdmin: Admin = {
      id: `admin-${Date.now()}`,
      username: newAdminName,
      password: newAdminPass
    };

    try {
        await DB.saveAdmin(newAdmin);
        setNewAdminName('');
        setNewAdminPass('');
    } catch (err: any) {
        if (err.message?.includes('permission_denied') || err.code === 'PERMISSION_DENIED') {
            setSaveError("خطأ في الصلاحيات: اذهب إلى Firebase Console > Realtime Database > Rules واجعل .read و .write قيمتها true");
        } else {
            setSaveError("فشل الاتصال: تأكد من إعدادات Firebase والإنترنت.");
        }
    } finally {
        setIsSaving(false);
    }
  };

  const initiateDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;

    const safeAdmins = Array.isArray(admins) ? admins : [];
    if (safeAdmins.length <= 1) {
        alert('لا يمكنك حذف آخر مشرف! يجب أن يظل هناك مسؤول واحد على الأقل للنظام.');
        setDeleteModal({ isOpen: false, id: null });
        return;
    }
    
    setIsDeleting(true);
    try {
        await DB.deleteAdmin(id);
        setDeleteModal({ isOpen: false, id: null });
    } catch(err: any) {
        alert("خطأ أثناء الحذف: تأكد من صلاحيات Firebase Rules (يجب أن تكون true).");
    } finally {
        setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative">
        <button onClick={onBack} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors flex items-center gap-2 z-20">
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>
        <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/30">
                <Code size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">منطقة المطورين</h2>
          </div>
          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-pulse"><AlertTriangle size={18} />{error}</div>}
          <form onSubmit={handleDevLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">اسم المطور</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-left" dir="ltr" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-left" dir="ltr" required />
            </div>
            <Button type="submit" fullWidth className="!bg-purple-600 hover:!bg-purple-500">تسجيل الدخول</Button>
          </form>
        </MotionDiv>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 relative">
       <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/30"><Code size={24} /></div>
                  <div>
                      <h1 className="text-2xl font-bold">لوحة تحكم المطور</h1>
                      <p className="text-slate-400 text-sm">إدارة صلاحيات الوصول</p>
                  </div>
              </div>
              <Button variant="secondary" onClick={onBack} icon={<ArrowRight size={18}/>}>خروج</Button>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Plus size={20} className="text-green-500"/>إضافة مشرف جديد</h3>
                  {saveError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><p>{saveError}</p></div>}
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div>
                          <label className="text-sm text-slate-400 mb-1 block">اسم المستخدم</label>
                          <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} required disabled={isSaving} />
                      </div>
                      <div>
                          <label className="text-sm text-slate-400 mb-1 block">كلمة المرور</label>
                          <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-green-500 outline-none" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} required disabled={isSaving} />
                      </div>
                      <Button type="submit" fullWidth className="!bg-green-600 hover:!bg-green-500 mt-4" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={20} /> : 'حفظ المشرف'}</Button>
                  </form>
              </MotionDiv>
              <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20} className="text-blue-500"/>قائمة المشرفين</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">{admins.length}</span>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {admins.length === 0 ? <p className="text-center text-slate-500 text-sm py-8">جاري التحميل أو لا يوجد مشرفين...</p> : admins.map(admin => (
                          <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700 group hover:border-blue-500/50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-600">{admin.username.charAt(0)}</div>
                                  <div><p className="font-bold text-white">{admin.username}</p><p className="text-xs text-slate-500 flex items-center gap-1"><Key size={10} />{admin.password}</p></div>
                              </div>
                              <button type="button" onClick={() => initiateDelete(admin.id)} className={`p-2 rounded-lg transition-colors ${admins.length <= 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'}`} disabled={admins.length <= 1} title={admins.length <= 1 ? "لا يمكن حذف المشرف الوحيد" : "حذف"}><Trash2 size={18} /></button>
                          </div>
                      ))}
                  </div>
              </MotionDiv>
          </div>
       </div>
       <AnimatePresence>
       {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <MotionDiv key="delete-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={32} /></div>
             <h3 className="text-xl font-bold mb-2 text-white">حذف حساب المشرف؟</h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">أنت على وشك حذف صلاحيات الدخول لهذا المشرف نهائياً.</p>
             <div className="flex gap-3">
               <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/30 flex items-center justify-center gap-2">
                 {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'حذف نهائي'}
               </button>
               <button onClick={() => setDeleteModal({isOpen: false, id: null})} disabled={isDeleting} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">إلغاء</button>
             </div>
           </MotionDiv>
        </div>
       )}
       </AnimatePresence>
    </div>
  );
};

export default DeveloperDashboard;