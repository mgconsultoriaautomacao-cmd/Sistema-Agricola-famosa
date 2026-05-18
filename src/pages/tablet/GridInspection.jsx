import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionWithRecords, addRecord } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Save, CheckCircle, AlertTriangle } from 'lucide-react';
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
                                <th key={col.key} style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid var(--color-primary-light)' }}>
                                    {col.label}
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
