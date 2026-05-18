import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';

import { TabletLogin } from './pages/tablet/Login';
import { FormSelection } from './pages/tablet/FormSelection';
import { FormEntry } from './pages/tablet/FormEntry';
import { DayForms } from './pages/tablet/DayForms';
import { ContinuousRegister } from './pages/tablet/ContinuousRegister';
import { Checklist } from './pages/tablet/Checklist';
import { SignatureFinish } from './pages/tablet/SignatureFinish';

import { AdminLogin } from './pages/admin/Login';
import { GridInspection } from './pages/tablet/GridInspection';
import { TableLogEntry } from './pages/tablet/TableLogEntry';
import { Dashboard } from './pages/admin/Dashboard';
import { SessionDetail } from './pages/admin/SessionDetail';
import { FarmsDashboard } from './pages/admin/FarmsDashboard';
import { DocumentsTable } from './pages/admin/DocumentsTable';
import { DocumentView } from './pages/admin/DocumentView';
import { DocumentPDFView } from './pages/admin/DocumentPDFView';
import { UserManagement } from './pages/admin/UserManagement';

// Protected Route HOC
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/'} replace />;
  
  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* OPERATIONAL (TABLET) FLOW */}
          <Route element={<Layout />}>
            <Route path="/" element={<TabletLogin />} />
            <Route path="/day-forms" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <DayForms />
              </ProtectedRoute>
            } />
            <Route path="/forms/continuous/:sessionId" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <ContinuousRegister />
              </ProtectedRoute>
            } />
            <Route path="/forms/checklist/:sessionId" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <Checklist />
              </ProtectedRoute>
            } />
            <Route path="/forms/signature/:sessionId" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <SignatureFinish />
              </ProtectedRoute>
            } />
            <Route path="/forms/grid/:sessionId" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <GridInspection />
              </ProtectedRoute>
            } />
            <Route path="/forms/table/:sessionId" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <TableLogEntry />
              </ProtectedRoute>
            } />
            <Route path="/forms" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <FormSelection />
              </ProtectedRoute>
            } />
            <Route path="/forms/session/:sessionId" element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor']}>
                <FormEntry />
              </ProtectedRoute>
            } />
          </Route>

          {/* HEADQUARTERS (ADMIN) FLOW */}
          <Route path="/admin" element={<Layout adminMode={true} />}>
            <Route index element={<Navigate to="/admin/login" replace />} />
            <Route path="login" element={<AdminLogin />} />
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'sede']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="farms" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'sede']}>
                <FarmsDashboard />
              </ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'sede']}>
                <DocumentsTable />
              </ProtectedRoute>
            } />
            <Route path="document/:docId" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'sede']}>
                <DocumentView />
              </ProtectedRoute>
            } />
            <Route path="document-pdf/:docId" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'sede']}>
                <DocumentPDFView />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['admin', 'supervisor', 'sede']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="session/:sessionId" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'sede']}>
                <SessionDetail />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
