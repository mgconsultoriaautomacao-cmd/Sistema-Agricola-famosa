import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionWithRecords, addRecord } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Save, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

export const Checklist = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [sessionData, setSessionData] = useState(null);
    const [responses, setResponses] = useState({});

    useEffect(() => {
        getSessionWithRecords(sessionId).then(data => {
            setSessionData(data);
            if (data && data.records && data.records.length > 0) {
                // Encontrar o registro mais recente que contém dados do checklist
                const latestRecord = [...data.records].reverse().find(r => r.data && r.data.checklist);
                if (latestRecord) {
                    setResponses(latestRecord.data.checklist || {});
                }
            }
        });
    }, [sessionId]);

    // Normalization for forms without explicit sections
    const sections = useMemo(() => {
        if (!sessionData) return [];
        const { form } = sessionData;
        if (form.sections) return form.sections;
        if (form.items) return [{ title: 'Geral', items: form.items }];
        return [];
    }, [sessionData]);

    if (!sessionData) return <div className="p-10 text-white animate-pulse">Carregando Checklist...</div>;
    const { form } = sessionData;

    const handleStatusChange = (itemId, status) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], status }
        }));
    };

    const handleActionPlanChange = (itemId, plan) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], actionPlan: plan }
        }));
    };

    const handleSave = async (shouldSign = false) => {
        try {
            // Validate that all items were answered
            const totalItems = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
            const answeredItems = Object.keys(responses).length;
            
            if (answeredItems < totalItems) {
                if (!window.confirm(`Você respondeu ${answeredItems} de ${totalItems} itens. Deseja salvar assim mesmo?`)) return;
            }

            await addRecord(user.id, sessionId, { checklist: responses });
            
            if (shouldSign) {
                navigate(`/forms/signature/${sessionId}`);
            } else {
                alert('Checklist salvo com sucesso!');
                navigate('/forms');
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Header Fixo */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '10px', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/forms')} style={{ padding: '8px' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0 }}>{form.title}</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '12px' }}>
                            <span>Versão: {form.version}</span>
                            <span><b>{form.frequency}</b></span>
                            {form.haccp && <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>HACCP</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => handleSave(false)}>
                        <Save size={20} /> Salvar
                    </button>
                    <button className="btn-primary" onClick={() => handleSave(true)}>
                        <CheckCircle size={20} /> Finalizar e Assinar
                    </button>
                </div>
            </div>

            {/* Seções */}
            {sections.map((section, sIdx) => (
                <div key={section.title} style={{ marginBottom: '32px' }}>
                    <h3 style={{ 
                        padding: '12px 20px', 
                        backgroundColor: 'var(--color-primary)', 
                        color: 'white', 
                        borderRadius: '8px 8px 0 0',
                        margin: 0,
                        fontSize: '1.1rem'
                    }}>{section.title}</h3>
                    
                    <div className="glass-panel" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none', padding: 0 }}>
                        {section.items.map((item, iIdx) => {
                            const current = responses[item.id] || {};
                            const isNo = current.status === 'NÃO';
                            
                            return (
                                <div key={item.id} style={{ 
                                    padding: '20px', 
                                    borderBottom: iIdx === section.items.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                    backgroundColor: isNo ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: isNo ? '16px' : 0 }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: '500', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>{iIdx + 1}. {item.label}</span>
                                            {item.note && <small style={{ color: 'var(--color-text-muted)' }}>* {item.note}</small>}
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <StatusButton 
                                                active={current.status === 'SIM'} 
                                                type="SIM" 
                                                onClick={() => handleStatusChange(item.id, 'SIM')} 
                                            />
                                            <StatusButton 
                                                active={current.status === 'NÃO'} 
                                                type="NÃO" 
                                                onClick={() => handleStatusChange(item.id, 'NÃO')} 
                                            />
                                            <StatusButton 
                                                active={current.status === 'NA'} 
                                                type="NA" 
                                                onClick={() => handleStatusChange(item.id, 'NA')} 
                                            />
                                        </div>
                                    </div>

                                    {isNo && (
                                        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>
                                                <AlertCircle size={16} /> PLANO DE AÇÃO CORRETIVA (OBRIGATÓRIO)
                                            </label>
                                            <textarea 
                                                placeholder="Descreva qual ação foi tomada para corrigir esta irregularidade..."
                                                value={current.actionPlan || ''}
                                                onChange={(e) => handleActionPlanChange(item.id, e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '12px', 
                                                    borderRadius: '8px', 
                                                    border: '2px solid var(--color-danger)',
                                                    minHeight: '80px',
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

const StatusButton = ({ active, type, onClick }) => {
    const config = {
        'SIM': { color: 'var(--color-success)', icon: <CheckCircle size={18} /> },
        'NÃO': { color: 'var(--color-danger)', icon: <AlertCircle size={18} /> },
        'NA': { color: 'var(--color-text-muted)', icon: <HelpCircle size={18} /> }
    }[type];

    return (
        <button 
            onClick={onClick}
            className="btn-secondary"
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '10px 16px',
                borderColor: active ? config.color : '#ccc',
                backgroundColor: active ? config.color : 'white',
                color: active ? 'white' : '#666',
                fontWeight: 'bold',
                minWidth: '85px',
                justifyContent: 'center',
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
        >
            {type}
        </button>
    );
};

export default Checklist;

