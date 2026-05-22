import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFarms, getForms, openSession } from '../../services/db';
import { FileText, MapPin, Layers, ArrowLeft, ChevronRight, Search, Activity, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FormSelection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [farms, setFarms] = useState([]);
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const isRestricted = !['admin', 'sede', 'validator', 'certifier'].includes(user?.role);
    
    // Form Selection State
    const [step, setStep] = useState(1); // 1: farm, 2: sector, 3: form
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [farmsData, formsData] = await Promise.all([getFarms(), getForms()]);
                setFarms(farmsData);
                setForms(formsData);

                // Check localStorage
                const savedFarmId = localStorage.getItem('agricola_selected_farm');
                const savedSector = localStorage.getItem('agricola_selected_sector');
                
                if (savedFarmId) {
                    const farm = farmsData.find(f => f.id === savedFarmId);
                    if (farm) {
                        setSelectedFarm(farm);
                        if (savedSector && farm.sectors.includes(savedSector)) {
                            setSelectedSector(savedSector);
                            setStep(3);
                        } else {
                            setStep(2);
                        }
                    }
                } else if (isRestricted && user?.farmId) {
                    const farm = farmsData.find(f => f.id === user.farmId);
                    if (farm) {
                        setSelectedFarm(farm);
                        setStep(2);
                    }
                }
            } catch (err) {
                console.error("Error loading selection data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [user, isRestricted]);

    const handleSelectFarm = (farm) => {
        setSelectedFarm(farm);
        localStorage.setItem('agricola_selected_farm', farm.id);
        setStep(2);
    };

    const handleSelectSector = (sector) => {
        setSelectedSector(sector);
        localStorage.setItem('agricola_selected_sector', sector);
        setStep(3);
    };

    const handleGoBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedSector(null);
            localStorage.removeItem('agricola_selected_sector');
        } else if (step === 2 && !isRestricted) {
            setStep(1);
            setSelectedFarm(null);
            localStorage.removeItem('agricola_selected_farm');
            localStorage.removeItem('agricola_selected_sector');
        }
    };

    const handleSelectForm = async (form) => {
        try {
            const session = await openSession(user.id, form.id, selectedFarm.id);
            
            // Redirect based on form type
            if (form.type === 'checklist') {
                navigate(`/forms/checklist/${session.id}`);
            } else if (form.type === 'grid-inspection') {
                navigate(`/forms/grid/${session.id}`);
            } else if (form.type === 'table-log') {
                navigate(`/forms/table/${session.id}`);
            } else {
                navigate(`/forms/session/${session.id}`);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const filteredForms = useMemo(() => {
        if (!selectedSector) return forms;
        return forms.filter(form => {
            if (!form.sectors) return true;
            return form.sectors.includes(selectedSector);
        });
    }, [forms, selectedSector]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
            <Activity className="animate-spin" size={48} />
            <p style={{ marginTop: '16px', fontWeight: 600 }}>Carregando Operações...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '48px' }}>
                <StepCircle num={1} active={step >= 1} done={step > 1} label="Unidade" />
                <div style={{ width: '60px', height: '2px', background: step > 1 ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)' }} />
                <StepCircle num={2} active={step >= 2} done={step > 2} label="Setor" />
                <div style={{ width: '60px', height: '2px', background: step > 2 ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)' }} />
                <StepCircle num={3} active={step >= 3} done={step > 3} label="Checklist" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
                {(step > 1 && (!isRestricted || step === 3)) && (
                    <motion.button 
                        whileHover={{ x: -4 }}
                        className="btn-secondary" 
                        onClick={handleGoBack} 
                        style={{ padding: '12px', borderRadius: '50%' }}
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                )}
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem' }} className="agro-gradient-text">
                        {step === 1 ? 'Qual fazenda você está?' : step === 2 ? `Setor em ${selectedFarm?.name}` : 'Selecione o Formulário'}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {step === 3 ? `${selectedFarm?.name} • Setor ${selectedSector}` : 'Módulo de Registro Operacional'}
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    {step === 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                            {farms.map(farm => (
                                <SelectionCard 
                                    key={farm.id}
                                    icon={MapPin}
                                    title={farm.name}
                                    subtitle={`${farm.sectors.length} Setores Disponíveis`}
                                    onClick={() => handleSelectFarm(farm)}
                                />
                            ))}
                        </div>
                    )}

                    {step === 2 && selectedFarm && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                            {selectedFarm.sectors.map(sector => (
                                <SelectionCard 
                                    key={sector}
                                    icon={Layers}
                                    title={sector}
                                    subtitle="Iniciar Operação"
                                    onClick={() => handleSelectSector(sector)}
                                    color="var(--color-accent)"
                                />
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {filteredForms.map(form => (
                                <motion.div 
                                    key={form.id}
                                    whileHover={{ y: -5 }}
                                    className="glass-panel" 
                                    style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                            <FileText size={24} />
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{form.id}</div>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{form.title}</h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{form.description}</p>
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        style={{ width: '100%', padding: '16px' }}
                                        onClick={() => handleSelectForm(form)}
                                    >
                                        Abrir Registro do Dia <ChevronRight size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const StepCircle = ({ num, active, done, label }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: done ? 'var(--color-primary)' : active ? 'white' : 'transparent',
            border: active ? `2px solid var(--color-primary)` : '2px solid rgba(0,0,0,0.1)',
            color: done ? 'white' : active ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            margin: '0 auto 8px',
            boxShadow: active ? '0 0 15px rgba(5, 150, 105, 0.2)' : 'none'
        }}>
            {done ? <Check size={18} strokeWidth={3} /> : num}
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
);

const SelectionCard = ({ icon: Icon, title, subtitle, onClick, color = 'var(--color-primary)' }) => (
    <motion.div 
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass-panel" 
        style={{ padding: '40px 24px', textAlign: 'center', cursor: 'pointer' }}
        onClick={onClick}
    >
        <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: `${color}10`, 
            color: color, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px' 
        }}>
            <Icon size={32} />
        </div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{subtitle}</p>
    </motion.div>
);
