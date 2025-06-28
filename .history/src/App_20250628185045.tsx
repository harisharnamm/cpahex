import React, { useState } from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/organisms/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Hub1099 } from './pages/Hub1099';
import { IRSNotices } from './pages/IRSNotices';
import { DeductionChat } from './pages/DeductionChat';
import { Settings } from './pages/Settings';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';

function AppContent() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    console.log('🔄 Route changed to:', location.pathname);
    // Close sidebar on route change (mobile)
    setSidebarOpen(false);
  }, [location]);

  // Main app layout component
  const AppLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-72 transition-all duration-300">
        {children}
      </div>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );

  return (
    <Routes>
      {/* Authentication routes - full width without sidebar */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Main app routes - with sidebar */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute>
          <AppLayout>
            <Clients onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/clients/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <ClientDetail onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/1099-hub" element={
        <ProtectedRoute>
          <AppLayout>
            <Hub1099 onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/irs-notices" element={
        <ProtectedRoute>
          <AppLayout>
            <IRSNotices onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/deduction-chat" element={
        <ProtectedRoute>
          <AppLayout>
            <DeductionChat onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout>
            <Settings onMenuClick={() => setSidebarOpen(true)} />
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;