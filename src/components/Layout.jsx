import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { initDB } from '../services/db';
import { LogOut, User, Sun, Moon, LayoutDashboard, MapPin, FolderOpen, Users, Tag } from 'lucide-react';
import logo from '../assets/logo_famosa.png';

export const Layout = ({ adminMode = false }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize DB on first load
  React.useEffect(() => {
    initDB();
  }, []);

  const handleLogout = () => {
    logout();
    navigate(adminMode ? '/admin/login' : '/');
  };

  const isAdminLoggedIn = adminMode && user && location.pathname !== '/admin/login';
  const isTabletMode = !adminMode;

  return (
    <div className="app-container">
      <header className="glass-panel app-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="header-logo" />
          <h2 className="header-title">
            {adminMode ? 'HQ Admin Dashboard' : 'Tablet Operacional'}
          </h2>
        </div>
        
        {user && (
          <div className="header-right">
            <button 
              onClick={toggleTheme} 
              className="btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', width: '40px', height: '40px' }}
              title="Alternar Tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="user-profile">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                <User size={16} />
                <span>{user.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {user.role}
              </span>
            </div>
            
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', border: '1px solid #e2e8f0' }}>
              <LogOut size={16} />
              Sair
            </button>

            {/* Quick Link to alternate between tablet/admin for easier access */}
            <button 
              onClick={() => navigate(adminMode ? '/' : '/admin/login')} 
              className="btn-secondary" 
              style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              title={adminMode ? "Módulo de Campo" : "HQ Administrativo"}
            >
              {adminMode ? "📱 PWA Campo" : "🔒 HQ Admin"}
            </button>
          </div>
        )}
      </header>

      {/* Premium Sub Navigation Bar for Admin HQ */}
      {isAdminLoggedIn && (
        <nav className="glass-panel admin-nav">
          <NavButton 
            active={location.pathname.startsWith('/admin/dashboard')} 
            onClick={() => navigate('/admin/dashboard')}
            icon={<LayoutDashboard size={18} />}
            label="Dashboard Monitoramento" 
          />
          <NavButton 
            active={location.pathname.startsWith('/admin/farms')} 
            onClick={() => navigate('/admin/farms')}
            icon={<MapPin size={18} />}
            label="Fazendas & Setores" 
          />
          <NavButton 
            active={location.pathname.startsWith('/admin/documents')} 
            onClick={() => navigate('/admin/documents')}
            icon={<FolderOpen size={18} />}
            label="Central de Arquivos" 
          />
          <NavButton 
            active={location.pathname.startsWith('/admin/labels')} 
            onClick={() => navigate('/admin/labels')}
            icon={<Tag size={18} />}
            label="Etiquetas" 
          />
          <NavButton 
            active={location.pathname.startsWith('/admin/users')} 
            onClick={() => navigate('/admin/users')}
            icon={<Users size={18} />}
            label="Gestão de Equipe" 
          />
        </nav>
      )}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        border: 'none',
        borderRadius: '8px',
        background: active ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
        color: active ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
        fontWeight: active ? '700' : '600',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: active ? 'inset 0 0 0 1px rgba(5, 150, 105, 0.15)' : 'none'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
