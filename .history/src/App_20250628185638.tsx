import React from 'react';
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
  
  useEffect(() => {
    console.log('🔄 Route changed to:', location.pathname);
  }, [location]);

  return (
    <Routes>
      {/* Authentication routes - full width without sidebar */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Main app routes - with sidebar */}
      <Route path="/" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <Dashboard />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <Clients />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/clients/:id" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <ClientDetail />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/1099-hub" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <Hub1099 />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/irs-notices" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <IRSNotices />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/deduction-chat" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <DeductionChat />
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated font-inter">
            <Sidebar />
            <div className="ml-72">
              <Settings />
            </div>
          </div>
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