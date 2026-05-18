import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo_famosa.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Delete, CheckCircle2, Lock, Activity } from 'lucide-react';

export const TabletLogin = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, login } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user && (user.role === 'operator' || user.role === 'supervisor')) {
            navigate('/forms');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (pin.length !== 4) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            const result = await login({ pin });
            if (result.success) {
                navigate('/forms');
            } else {
                setError('PIN INCORRETO');
                setPin('');
            }
        } catch (err) {
            setError('ERRO DE CONEXÃO');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinInput = (num) => {
        if(pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                // Auto-submit could be here, but let's keep the manual button for now or use a timeout
            }
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh', 
            padding: '24px', 
            backgroundColor: '#020617',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Abstract Background Orbs */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(5, 150, 105, 0.1)', filter: 'blur(120px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(251, 191, 36, 0.1)', filter: 'blur(120px)', borderRadius: '50%' }} />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="glass-panel" 
                style={{ 
                    padding: '64px 48px', 
                    maxWidth: '520px', 
                    width: '100%', 
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.8)',
                    zIndex: 10
                }}
            >
                <div style={{ marginBottom: '48px' }}>
                    <motion.img 
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        src={logo} 
                        alt="Agrícola Famosa" 
                        style={{ height: '80px', objectFit: 'contain', margin: '0 auto 24px' }} 
                    />
                    <h1 className="agro-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '4px' }}>PRODTECH</h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                        <Lock size={14} /> Módulo de Campo
                    </div>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '48px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
                            {[0, 1, 2, 3].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ 
                                        scale: pin.length > i ? 1.2 : 1,
                                        backgroundColor: pin.length > i ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'
                                    }}
                                    style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        borderRadius: '50%', 
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        boxShadow: pin.length > i ? '0 0 15px var(--color-primary)' : 'none'
                                    }} 
                                />
                            ))}
                        </div>
                        
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{ color: 'var(--color-danger)', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em' }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <motion.button 
                                key={num} 
                                type="button"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-secondary" 
                                onClick={() => handlePinInput(num.toString())}
                                style={{ 
                                    padding: '32px', 
                                    fontSize: '2rem', 
                                    fontWeight: 800, 
                                    borderRadius: '24px', 
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {num}
                            </motion.button>
                        ))}
                        <motion.button 
                            type="button" 
                            whileTap={{ scale: 0.95 }}
                            className="btn-secondary" 
                            onClick={handleBackspace} 
                            style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                        >
                            <Delete size={32} />
                        </motion.button>
                        <motion.button 
                            type="button" 
                            whileTap={{ scale: 0.95 }}
                            className="btn-secondary" 
                            onClick={() => handlePinInput('0')} 
                            style={{ 
                                padding: '32px', 
                                fontSize: '2rem', 
                                fontWeight: 800, 
                                borderRadius: '24px', 
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white'
                            }}
                        >
                            0
                        </motion.button>
                        <motion.button 
                            type="submit" 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary" 
                            disabled={pin.length !== 4 || isLoading} 
                            style={{ padding: '32px', borderRadius: '24px' }}
                        >
                            {isLoading ? (
                                <Activity className="animate-spin" size={32} />
                            ) : (
                                <CheckCircle2 size={32} />
                            )}
                        </motion.button>
                    </div>

                    <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        ProdTech 4.0 • Agrícola Famosa HQ
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
