import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionWithRecords, addRecord, editRecord, deleteRecord } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Save, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const TableLogEntry = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [sessionData, setSessionData] = useState(null);
    const [localRecords, setLocalRecords] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const loadSession = () => {
        getSessionWithRecords(sessionId).then(data => {
            setSessionData(data);
            if (data && data.records.length > 0) {
                setLocalRecords(data.records.map(r => ({ ...r.data, id: r.id })));
            } else if (data?.form?.preDefinedRows) {
                setLocalRecords(data.form.preDefinedRows.map((row, idx) => ({
                    ...row,
                    id: `new_${idx}`,
                    isNew: true
                })));
            }
        });
    };

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    if (!sessionData) return <div className="p-10 text-white animate-pulse">Carregando Registros...</div>;
    const { form, status } = sessionData;
    const isClosed = status === 'signed';

    const handleCellChange = (rowId, key, value) => {
        setLocalRecords(prev => prev.map(row => 
            row.id === rowId ? { ...row, [key]: value } : row
        ));
    };

    const addNewRow = () => {
        const newId = `new_${Date.now()}`;
        const newRow = { id: newId, isNew: true };
        form.columns.forEach(col => {
            if (col.defaultValue === 'today') newRow[col.key] = format(new Date(), 'yyyy-MM-dd');
        });
        setLocalRecords([...localRecords, newRow]);
    };

    const removeRow = async (id, isNew) => {
        if (window.confirm('Excluir este registro?')) {
            try {
                if (!isNew && !id.toString().startsWith('new_')) {
                    await deleteRecord(user.id, sessionId, id);
                }
                setLocalRecords(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const handleSaveAll = async (shouldSign = false) => {
        setIsSaving(true);
        try {
            // Salvar ou atualizar cada linha local no banco
            for (const row of localRecords) {
                const { id, isNew, ...data } = row;
                if (isNew || id.toString().startsWith('new_')) {
                    await addRecord(user.id, sessionId, data);
                } else {
                    await editRecord(user.id, sessionId, id, data);
                }
            }

            if (shouldSign) {
                navigate(`/forms/signature/${sessionId}`);
            } else {
                alert('Todos os registros foram salvos com sucesso!');
                // Recarrega o estado atualizado do banco de dados (reseta isNew)
                loadSession();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '10px' }}>
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '0', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/forms')} style={{ padding: '8px' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0 }}>{form.title}</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <small style={{ color: 'var(--color-text-muted)' }}>Versão: {form.version} | Frequência: {form.frequency}</small>
                            {form.haccp && <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '0.75rem', padding: '2px 6px', border: '1px solid var(--color-danger)', borderRadius: '4px' }}>HACCP</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {!isClosed && (
                        <>
                            <button className="btn-secondary" onClick={addNewRow} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} /> Nova Linha
                            </button>
                            <button className="btn-primary" onClick={() => handleSaveAll(false)} disabled={isSaving}>
                                <Save size={20} /> {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {form.description && (
                <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '16px', borderLeft: '4px solid var(--color-primary)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{form.description}</p>
                </div>
            )}

            <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            {form.columns.map((col, idx) => (
                                <th key={col.key} style={{ 
                                    padding: '12px', 
                                    textAlign: 'left', 
                                    borderBottom: '2px solid var(--color-primary-light)', 
                                    fontSize: '0.85rem',
                                    width: idx === 0 ? '300px' : 'auto' 
                                }}>
                                    {col.label}
                                </th>
                            ))}
                            {!isClosed && <th style={{ width: '60px' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {localRecords.map((row) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                {form.columns.map(col => (
                                    <td key={col.key} style={{ padding: '8px' }}>
                                        <RenderCell 
                                            column={col} 
                                            value={row[col.key]} 
                                            onChange={(val) => handleCellChange(row.id, col.key, val)}
                                            disabled={isClosed || col.disabled}
                                        />
                                    </td>
                                ))}
                                {!isClosed && (
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        {!row.isPreDefined && (
                                            <button 
                                                onClick={() => removeRow(row.id, row.isNew)}
                                                style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {form.legends && (
                <div className="glass-panel" style={{ marginTop: '20px', padding: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px' }}>Legendas / Instruções:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                        {Object.entries(form.legends).map(([key, value]) => (
                            <div key={key} style={{ fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 'bold' }}>{key}:</span> {value}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isClosed && (
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                    <button className="btn-primary" style={{ padding: '16px 32px' }} onClick={() => handleSaveAll(true)} disabled={isSaving}>
                        <CheckCircle size={20} style={{ marginRight: '8px' }} />
                        {isSaving ? 'Salvando para assinar...' : 'Finalizar e Assinar'}
                    </button>
                </div>
            )}
        </div>
    );
};

const RenderCell = ({ column, value, onChange, disabled }) => {
    const commonStyle = { 
        width: '100%', 
        padding: '8px', 
        borderRadius: '4px', 
        border: '1px solid #ddd',
        fontSize: '0.9rem',
        backgroundColor: disabled ? '#f9f9f9' : 'white'
    };

    if (column.type === 'boolean') {
        const isTrue = value === true || value === 'true' || value === 'SIM';
        return (
            <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                    onClick={() => onChange('SIM')}
                    className={isTrue ? 'btn-success' : 'btn-secondary'}
                    style={{ padding: '4px 8px', fontSize: '0.7rem', flex: 1, backgroundColor: isTrue ? 'var(--color-success)' : 'white', color: isTrue ? 'white' : '#666' }}
                    disabled={disabled}
                >SIM</button>
                <button 
                    onClick={() => onChange('NÃO')}
                    className={value === 'NÃO' ? 'btn-danger' : 'btn-secondary'}
                    style={{ padding: '4px 8px', fontSize: '0.7rem', flex: 1, backgroundColor: value === 'NÃO' ? 'var(--color-danger)' : 'white', color: value === 'NÃO' ? 'white' : '#666' }}
                    disabled={disabled}
                >NÃO</button>
            </div>
        );
    }

    if (column.type === 'select') {
        return (
            <select style={commonStyle} value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
                <option value="">--</option>
                {column.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    return (
        <input 
            type={column.type === 'date' ? 'date' : column.type === 'time' ? 'time' : 'text'}
            style={commonStyle}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={column.note}
        />
    );
};
