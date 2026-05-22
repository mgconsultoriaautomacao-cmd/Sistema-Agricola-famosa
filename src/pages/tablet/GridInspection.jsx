import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionWithRecords, addRecord } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Save, CheckCircle, AlertTriangle, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

export const GridInspection = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [sessionData, setSessionData] = useState(null);
    const [gridData, setGridData] = useState({});

    useEffect(() => {
        getSessionWithRecords(sessionId).then(data => {
            setSessionData(data);
            if (data) {
                const initial = {};
                if (data.form?.items) {
                    data.form.items.forEach(item => {
                        initial[item.id] = data.form.columns.reduce((acc, col) => ({
                            ...acc, [col.key]: false
                        }), {});
                    });
                }
                
                // Recarregar os dados do último registro salvo
                if (data.records && data.records.length > 0) {
                    const latestRecord = [...data.records].reverse().find(r => r.data && r.data.grid);
                    if (latestRecord && latestRecord.data.grid) {
                        setGridData(latestRecord.data.grid);
                        return;
                    }
                }
                setGridData(initial);
            }
        });
    }, [sessionId]);

    if (!sessionData) return <div className="p-10 text-white animate-pulse">Carregando Inspeção...</div>;
    const { form } = sessionData;

    const toggleCell = (itemId, columnKey) => {
        setGridData(prev => {
            const newRow = { ...prev[itemId] };
            Object.keys(newRow).forEach(key => newRow[key] = false);
            newRow[columnKey] = true;
            
            return {
                ...prev,
                [itemId]: newRow
            };
        });
    };

    const handleFillDown = (columnKey) => {
        if (!form || !form.items || form.items.length === 0) return;
        
        const firstItemId = form.items[0].id;
        const isFirstSelected = !!gridData[firstItemId]?.[columnKey];
        
        setGridData(prev => {
            const updated = { ...prev };
            
            form.items.forEach(item => {
                const currentItemState = { ...(updated[item.id] || {}) };
                
                if (isFirstSelected) {
                    // Se o primeiro item está selecionado para a coluna target,
                    // definimos essa coluna como true e todas as outras colunas como false para todos os itens (exclusividade mútua)
                    Object.keys(currentItemState).forEach(key => {
                        currentItemState[key] = false;
                    });
                    currentItemState[columnKey] = true;
                } else {
                    // Se o primeiro item NÃO está selecionado para a coluna target,
                    // apenas definimos essa coluna específica como false para todos os itens,
                    // mantendo as outras colunas intactas.
                    currentItemState[columnKey] = false;
                }
                
                updated[item.id] = currentItemState;
            });
            
            return updated;
        });
    };

    const handleSave = async (shouldSign = false) => {
        try {
            await addRecord(user.id, sessionId, { grid: gridData });
            if (shouldSign) {
                navigate(`/forms/signature/${sessionId}`);
            } else {
                alert('Inspeção salva com sucesso!');
                navigate('/forms');
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '10px', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/forms')} style={{ padding: '8px' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0 }}>{form.title}</h2>
                        <small style={{ color: 'var(--color-text-muted)' }}>Versão: {form.version} | Frequência: {form.frequency}</small>
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

            <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-primary-light)' }}>Equipamento / Local</th>
                            {form.columns.map(col => (
                                <th key={col.key} style={{ padding: '16px', borderBottom: '2px solid var(--color-primary-light)', minWidth: '120px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{col.label}</span>
                                        <button 
                                            type="button"
                                            className="btn-secondary" 
                                            title={`Replicar "${col.label}" para todas as linhas`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFillDown(col.key);
                                            }}
                                            style={{ 
                                                padding: '4px 8px', 
                                                fontSize: '0.75rem', 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '4px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                color: 'var(--color-primary-light)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                userSelect: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                                                e.currentTarget.style.transform = 'translateY(1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                                e.currentTarget.style.transform = 'none';
                                            }}
                                        >
                                            <ArrowDown size={12} /> Copiar
                                        </button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {form.items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: '500' }}>{item.label}</div>
                                    <code style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.id}</code>
                                </td>
                                {form.columns.map(col => {
                                    const isSelected = gridData[item.id]?.[col.key];
                                    const isNegative = ['broken', 'burned', 'removed', 'quebrada', 'queimada', 'retirada'].includes(col.key.toLowerCase());
                                    
                                    return (
                                        <td 
                                            key={col.key} 
                                            onClick={() => toggleCell(item.id, col.key)}
                                            style={{ 
                                                textAlign: 'center', 
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? (isNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)') : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? (isNegative ? 'var(--color-danger)' : 'var(--color-success)') : '#ccc'}`,
                                                color: isSelected ? (isNegative ? 'var(--color-danger)' : 'var(--color-success)') : '#ccc'
                                            }}>
                                                {isSelected && (isNegative ? <AlertTriangle size={18} /> : <CheckCircle size={18} />)}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
