
import React, { useState, useEffect } from 'react';
import { ViewState, Worker } from './types';
import SplashScreen from './views/SplashScreen';
import RoleSelection from './views/RoleSelection';
import LoginForm from './views/LoginForm';
import Dashboard from './views/Dashboard';
import DeveloperDashboard from './views/DeveloperDashboard';
import Button from './components/Button';
import Logo from './components/Logo';
import { ArrowLeft, Code, Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const SESSION_KEY = 'speed_delivery_session';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const { role } = JSON.parse(savedSession);
        return role === 'admin' ? 'dashboard-admin' : 'dashboard-worker';
      }
    } catch (e) {
      localStorage.removeItem(SESSION_KEY);
    }
    return 'splash';
  });

  const [currentUser, setCurrentUser] = useState<Worker | null>(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const { user } = JSON.parse(savedSession);
        return user || null;
      }
    } catch (e) { return null; }
    return null;
  });

  // PWA Install Prompt Logic
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Android / Desktop Detection
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    });

    // 2. iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    // Check if running in standalone mode (already installed)
    const isStandalone = ('standalone' in window.navigator) && ((window.navigator as any).standalone);

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowInstallBanner(true);
    }
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
        // iOS users just need the banner to stay open so they can read instructions
        return; 
    }
    
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
    });
  };

  const handleSplashComplete = () => {
    if (currentView === 'splash') setCurrentView('landing');
  };

  const handleLoginSuccess = (view: ViewState, workerData?: Worker) => {
    const role = view === 'dashboard-admin' ? 'admin' : 'worker';
    localStorage.setItem(SESSION_KEY, JSON.stringify({ role, user: workerData }));
    if (workerData) setCurrentUser(workerData);
    setCurrentView(view);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const renderLanding = () => (
    <div className="min-h-screen flex flex-col relative overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <MotionDiv 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-0 left-0 right-0 z-[100] p-4 shadow-2xl border-t border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))] ${isIOS ? 'bg-slate-800/95 backdrop-blur-xl' : 'bg-gradient-to-r from-red-600 to-red-800'}`}
          >
            {isIOS ? (
              // iOS Specific Layout (Instructional)
              <div className="flex flex-col gap-4 max-w-md mx-auto relative">
                <button onClick={() => setShowInstallBanner(false)} className="absolute top-0 left-0 p-1 text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2.5 rounded-xl shadow-lg">
                      <img src="https://cdn-icons-png.flaticon.com/512/2830/2830305.png" alt="Icon" className="w-10 h-10 object-contain" />
                   </div>
                   <div>
                      <h4 className="font-bold text-white text-lg">تثبيت التطبيق على الآيفون</h4>
                      <p className="text-slate-300 text-xs">احصل على تجربة كاملة بدون متصفح</p>
                   </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3 text-sm text-slate-200 space-y-3 border border-slate-600">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center font-bold text-xs">1</span>
                        <span>اضغط على زر المشاركة <Share size={16} className="inline mx-1 text-blue-400" /> في الأسفل</span>
                    </div>
                    <div className="w-px h-4 bg-slate-600 mr-3"></div>
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center font-bold text-xs">2</span>
                        <span>اختر <span className="font-bold text-white">"إضافة إلى الصفحة الرئيسية"</span> <PlusSquare size={16} className="inline mx-1 text-white" /></span>
                    </div>
                </div>
                {/* Arrow pointing down to Safari toolbar */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
                    <ArrowDownIcon /> 
                </div>
              </div>
            ) : (
              // Android / Chrome Layout (Action Button)
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg text-white backdrop-blur-sm">
                    <Smartphone size={24} />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-white">تطبيق أندرويد متوفر</p>
                    <p className="text-[10px] text-white/80">ثبت التطبيق للوصول السريع والإشعارات</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleInstallClick} className="bg-white text-red-600 px-5 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-100 transition-colors">تثبيت الآن</button>
                  <button onClick={() => setShowInstallBanner(false)} className="text-white/70 text-xs px-2 hover:text-white">إغلاق</button>
                </div>
              </div>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 w-full h-full bg-slate-900 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 px-6 py-6 flex items-center justify-between container mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setCurrentView('developer-dashboard')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-purple-500 text-slate-400 hover:text-purple-400 transition-all text-sm font-bold backdrop-blur-md"
            >
                <Code size={18} />
                <span className="hidden sm:inline">المطور</span>
            </button>
            <Button variant="outline" className="hidden sm:flex text-sm px-4 py-2 rounded-lg" onClick={() => setCurrentView('role-selection')}>
            تسجيل الدخول
            </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold animate-pulse">
            <Smartphone size={14} />
            <span>متوفر الآن كـ تطبيق {isIOS ? 'آيفون' : 'أندرويد'}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            نحن نوصل <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
              السرعة والثقة
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            مرحباً بكم في بوابة موظفي Speed Delivery Ouargla. النظام المتكامل لإدارة عمليات التوصيل بكفاءة واحترافية عالية.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button 
               onClick={() => setCurrentView('role-selection')}
               className="text-lg px-10 py-4 shadow-red-500/40 hover:shadow-red-500/60"
               icon={<ArrowLeft className="transform rotate-180" />}
             >
               ابدأ العمل
             </Button>
             {!isIOS && (
                 <button onClick={handleInstallClick} className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-slate-700 hover:border-white transition-all font-bold">
                    <Download size={20} />
                    تثبيت التطبيق
                 </button>
             )}
          </div>
        </MotionDiv>
      </main>

      <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-blue-600 via-red-600 to-blue-600 opacity-50"></div>
    </div>
  );

  return (
    <div className="antialiased text-slate-50 min-h-screen bg-slate-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {currentView === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {currentView === 'landing' && renderLanding()}
      {currentView === 'role-selection' && <RoleSelection onSelect={(view) => setCurrentView(view)} onBack={() => setCurrentView('landing')} />}
      {currentView === 'login-admin' && <LoginForm role="admin" onBack={() => setCurrentView('role-selection')} onLoginSuccess={handleLoginSuccess} />}
      {currentView === 'login-worker' && <LoginForm role="worker" onBack={() => setCurrentView('role-selection')} onLoginSuccess={handleLoginSuccess} />}
      {currentView === 'developer-dashboard' && <DeveloperDashboard onBack={() => setCurrentView('landing')} />}
      {currentView === 'dashboard-admin' && <Dashboard role="admin" onLogout={handleLogout} />}
      {currentView === 'dashboard-worker' && <Dashboard role="worker" currentUser={currentUser} onLogout={handleLogout} />}
    </div>
  );
};

// Simple icon for the visual cue
const ArrowDownIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M19 12l-7 7-7-7"/>
    </svg>
);

export default App;
