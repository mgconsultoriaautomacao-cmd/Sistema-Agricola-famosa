import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSessionWithRecords, addRecord, editRecord, getUsers } from '../../services/db';
import { Lock, Save, X, Edit2, ArrowLeft, User, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export const FormEntry = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingRecordId, setEditingRecordId] = useState(null);
    const [inputValue, setInputValue] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sessionVal, usersVal] = await Promise.all([
                getSessionWithRecords(sessionId),
                getUsers()
            ]);
            if (!sessionVal) {
                alert('Sessão não encontrada');
                navigate('/forms');
                return;
            }
            setSession(sessionVal);
            setUsers(usersVal);
        } catch (error) {
            console.error("Error loading form entry data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [sessionId, refreshKey]);

    const handleAddRecord = async (e) => {
        e.preventDefault();
        try {
            if (editingRecordId) {
                await editRecord(user.id, sessionId, editingRecordId, inputValue);
                setEditingRecordId(null);
            } else {
                await addRecord(user.id, sessionId, inputValue);
            }
            setInputValue({});
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            alert(error.message);
        }
    };

    const startEditRecord = (record) => {
        setEditingRecordId(record.id);
        setInputValue({ ...record.data });
    };

    const cancelEdit = () => {
        setEditingRecordId(null);
        setInputValue({});
    };

    const handleFieldChange = (fieldName, value) => {
        setInputValue(prev => ({ ...prev, [fieldName]: value }));
    };

    const renderFieldInput = (field) => {
        if (field.type === 'section') {
            return (
                <div key={field.label} style={{ width: '100%', margin: '16px 0 8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '4px', color: 'var(--color-primary-dark)' }}>{field.label}</h4>
                </div>
            );
        }

        const value = inputValue[field.name] ?? '';
        const commonStyle = { width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc' };

        return (
            <div key={field.name} style={{ flex: '1 1 250px', minWidth: 250, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 500 }}>{field.label}</label>
                {field.type === 'textarea' ? (
                    <textarea
                        style={{ ...commonStyle, minHeight: 100, resize: 'vertical' }}
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                ) : field.type === 'boolean' ? (
                    <select
                        style={commonStyle}
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    >
                        <option value="">Selecione</option>
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                    </select>
                ) : (
                    <input
                        style={commonStyle}
                        type={field.type === 'date' || field.type === 'time' ? field.type : 'text'}
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.type === 'date' ? 'dd/mm/aaaa' : field.type === 'time' ? 'HH:MM' : ''}
                    />
                )}
            </div>
        );
    };

    if (loading) return <div className="p-10 text-white animate-pulse">Carregando formulário...</div>;
    if (!session) return <div className="p-10 text-white">Sessão não encontrada</div>;

    const { form, records, status } = session;
    const isClosed = status === 'signed';

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>{form.title}</h2>
                        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0', display: 'flex', gap: '12px' }}>
                            <span><strong>Data:</strong> {format(new Date(session.date), 'dd/MM/yyyy')}</span>
                            <span>•</span>
                            <span><strong>Fazenda:</strong> {session.farmName || session.farmId}</span>
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>{form.description}</p>
                    </div>
                    <div>
                        {isClosed ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', fontWeight: 'bold' }}>
                                <Lock size={20} /> Sessão Encerrada
                            </div>
                        ) : (
                            <button className="btn-secondary" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => navigate(`/forms/signature/${sessionId}`)}>
                                Encerrar e Assinar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!isClosed && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h3>{editingRecordId ? 'Editar Registro' : 'Novo Registro'}</h3>
                    </div>
                    <form onSubmit={handleAddRecord} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {(form.fields || []).map(renderFieldInput)}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%', marginTop: '16px' }}>
                            <button type="submit" className="btn-primary" style={{ height: '46px', width: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={18} /> {editingRecordId ? 'Salvar' : 'Adicionar'}
                            </button>
                            {editingRecordId && (
                                <button type="button" className="btn-secondary" style={{ height: '46px', width: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={cancelEdit}>
                                    <X size={18} /> Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0 }}>Registros Lançados ({records.length})</h3>
                </div>
                {records.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', padding: '24px', margin: 0, fontStyle: 'italic' }}>Nenhum registro adicionado ainda.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="agro-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Horário</th>
                                    <th>Detalhes da Medição</th>
                                    <th>Operador</th>
                                    {!isClosed && <th style={{ textAlign: 'right' }}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => {
                                    const operatorName = users.find(u => u.id === record.userId)?.name || record.userId;
                                    return (
                                        <tr key={record.id}>
                                            <td style={{ fontWeight: 700, color: 'var(--color-primary-dark)', width: '120px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={14} />
                                                    {format(new Date(record.timestamp), 'HH:mm')}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {Object.entries(record.data).map(([key, value]) => (
                                                        <div key={key}>
                                                            <strong>{form.fields?.find(f => f.name === key)?.label || key}:</strong> {String(value)}
                                                        </div>
                                                    ))}
                                                </div>
                                                {record.lastEditedAt && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '6px', fontWeight: 600 }}>Editado às: {format(new Date(record.lastEditedAt), 'HH:mm')}</div>}
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <User size={14} />
                                                    {operatorName}
                                                </div>
                                            </td>
                                            {!isClosed && (
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100px' }}
                                                        onClick={() => startEditRecord(record)}
                                                    >
                                                        <Edit2 size={14} /> Editar
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                className="btn-secondary"
                onClick={() => navigate('/forms')}
              >
                Voltar aos Formulários
              </button>
            </div>
        </div>
    );
};

export default FormEntry;
