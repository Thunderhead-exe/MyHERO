import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChildProfile from './pages/ChildProfile';
import StoryWizard from './pages/StoryWizard';
import StoryReader from './pages/StoryReader';
import Login from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/child/new" element={<ProtectedRoute><ChildProfile /></ProtectedRoute>} />
      <Route path="/child/edit/:id" element={<ProtectedRoute><ChildProfile /></ProtectedRoute>} />
      <Route path="/create-story" element={<ProtectedRoute><StoryWizard /></ProtectedRoute>} />
      <Route path="/story/:id" element={<ProtectedRoute><StoryReader /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  );
};

export default App;