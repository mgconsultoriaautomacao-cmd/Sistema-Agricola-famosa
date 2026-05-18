import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await login({ username, password });
        if (result.success) {
            navigate('/admin/dashboard');
        } else {
            setError('Credenciais Inválidas.');
            setPassword('');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel" 
                style={{ padding: '48px', maxWidth: '440px', width: '100%', textAlign: 'center' }}
            >
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '24px', 
                        background: 'var(--agro-gradient)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 16px rgba(5, 150, 105, 0.2)'
                    }}>
                        <Building size={40} color="white" />
                    </div>
                    <h2 className="agro-gradient-text" style={{ fontSize: '2rem', marginBottom: '8px' }}>Portal HQ</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Governança & Auditoria Agrícola</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>USUÁRIO</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ex: admin"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>SENHA</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    {error && <div style={{ color: 'var(--color-danger)', marginBottom: '20px', fontWeight: 600, fontSize: '0.9rem' }}>⚠️ {error}</div>}

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                        Entrar no Painel de Controle
                    </button>
                    
                    <div style={{ 
                        marginTop: '32px', 
                        padding: '16px', 
                        backgroundColor: 'rgba(0,0,0,0.02)', 
                        borderRadius: '12px',
                        fontSize: '0.8rem', 
                        color: 'var(--color-text-muted)',
                        textAlign: 'left'
                    }}>
                        <p style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--color-primary)' }}>ACESSO RÁPIDO:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <span><strong>Admin:</strong> admin</span>
                            <span><strong>Senha:</strong> adminpassword</span>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
