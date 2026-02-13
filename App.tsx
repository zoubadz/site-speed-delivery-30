import React, { useState } from 'react';
import { ViewState, Worker } from './types';
import SplashScreen from './views/SplashScreen';
import RoleSelection from './views/RoleSelection';
import LoginForm from './views/LoginForm';
import Dashboard from './views/Dashboard';
import DeveloperDashboard from './views/DeveloperDashboard';
import Button from './components/Button';
import Logo from './components/Logo';
import { ArrowLeft, Code } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for TS errors where motion props are not recognized
const MotionDiv = motion.div as any;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('splash');
  const [currentUser, setCurrentUser] = useState<Worker | null>(null);

  // Handle Splash Complete
  const handleSplashComplete = () => {
    setCurrentView('landing');
  };

  const handleLoginSuccess = (view: ViewState, workerData?: Worker) => {
    if (workerData) {
      setCurrentUser(workerData);
    }
    setCurrentView(view);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
  };

  // Render Landing Page (Hero)
  const renderLanding = () => (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-900 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between container mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-3">
            {/* Developer Button - Made more visible */}
            <button 
                onClick={() => setCurrentView('developer-dashboard')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-purple-500 text-slate-400 hover:text-purple-400 transition-all text-sm font-bold backdrop-blur-md"
                title="دخول المطورين"
            >
                <Code size={18} />
                <span className="hidden sm:inline">المطور</span>
            </button>
            <Button variant="outline" className="hidden sm:flex text-sm px-4 py-2 rounded-lg" onClick={() => setCurrentView('role-selection')}>
            تسجيل الدخول
            </Button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
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
               icon={<ArrowLeft className="transform rotate-180" />} // RTL Arrow
             >
               ابدأ العمل
             </Button>
          </div>
        </MotionDiv>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-blue-600 via-red-600 to-blue-600 opacity-50"></div>
    </div>
  );

  return (
    <div className="antialiased text-slate-50 min-h-screen bg-slate-900">
      {currentView === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {currentView === 'landing' && renderLanding()}

      {currentView === 'role-selection' && (
        <RoleSelection 
          onSelect={(view) => setCurrentView(view)} 
          onBack={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'login-admin' && (
        <LoginForm 
          role="admin" 
          onBack={() => setCurrentView('role-selection')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === 'login-worker' && (
        <LoginForm 
          role="worker" 
          onBack={() => setCurrentView('role-selection')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* New Developer View */}
      {currentView === 'developer-dashboard' && (
        <DeveloperDashboard onBack={() => setCurrentView('landing')} />
      )}

      {currentView === 'dashboard-admin' && (
        <Dashboard role="admin" onLogout={handleLogout} />
      )}

      {currentView === 'dashboard-worker' && (
        <Dashboard role="worker" currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;