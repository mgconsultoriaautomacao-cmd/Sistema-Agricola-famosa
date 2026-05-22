import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSessionWithRecords, addRecord, editRecord, getUsers, getLabels, getAutocompleteSuggestions } from '../../services/db';
import { Lock, Save, X, Edit2, ArrowLeft, User, Calendar, Clock, Camera, Upload, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export const FormEntry = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [users, setUsers] = useState([]);
    const [availableLabels, setAvailableLabels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingRecordId, setEditingRecordId] = useState(null);
    const [inputValue, setInputValue] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeSelectorField, setActiveSelectorField] = useState(null);

    // Estados de autocomplete
    const [responsibles, setResponsibles] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [companies, setCompanies] = useState([]);

    const loadAutocompletes = () => {
        setResponsibles(getAutocompleteSuggestions('responsibles'));
        setVisitors(getAutocompleteSuggestions('visitors'));
        setCompanies(getAutocompleteSuggestions('companies'));
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [sessionVal, usersVal, labelsVal] = await Promise.all([
                getSessionWithRecords(sessionId),
                getUsers(),
                getLabels()
            ]);
            if (!sessionVal) {
                alert('Sessão não encontrada');
                navigate('/forms');
                return;
            }
            setSession(sessionVal);
            setUsers(usersVal);
            setAvailableLabels(labelsVal);
            loadAutocompletes();
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

        if (field.type === 'label-image-selector') {
            const selectedImage = inputValue[field.name];
            return (
                <div key={field.name} style={{ flex: '1 1 250px', minWidth: 250, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontWeight: 500 }}>{field.label}</label>
                    {selectedImage ? (
                        <div style={{
                            border: '1px solid var(--color-primary)',
                            borderRadius: '8px',
                            padding: '10px',
                            background: 'rgba(16, 185, 129, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <img src={selectedImage} alt="Selecionada" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>Amostra Anexada!</span>
                            </div>
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '6px', minWidth: 'auto', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                onClick={() => handleFieldChange(field.name, '')}
                                title="Limpar Seleção"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setActiveSelectorField(field.name)}
                            style={{
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.01)',
                                cursor: 'pointer',
                                gap: '8px',
                                width: '100%',
                                minHeight: '82px',
                                color: 'var(--color-text)'
                            }}
                            className="label-selector-btn"
                        >
                            <Upload size={18} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Escolher Rótulo ou Anexar</span>
                        </button>
                    )}
                </div>
            );
        }

        const value = inputValue[field.name] ?? '';
        const commonStyle = { width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc' };
        const listId = getDatalistId(field.name);

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
                        list={listId || undefined}
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
                                                    {Object.entries(record.data).map(([key, value]) => {
                                                        const isImage = String(value).startsWith('data:image');
                                                        const fieldMeta = form.fields?.find(f => f.name === key);
                                                        
                                                        return (
                                                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                                                                <strong>{fieldMeta?.label || key}:</strong>{' '}
                                                                {isImage ? (
                                                                    <div style={{ padding: '4px', border: '1px solid var(--glass-border)', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px' }}>
                                                                        <img src={String(value)} alt="Etiqueta" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                                    </div>
                                                                ) : (
                                                                    <span>{String(value)}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
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

            {/* Label Selector Overlay Modal */}
            {activeSelectorField && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: '16px'
              }}>
                <div className="glass-panel" style={{
                  width: '100%',
                  maxWidth: '550px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  maxHeight: '85vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Selecione o Rótulo / Etiqueta</h3>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
                      onClick={() => setActiveSelectorField(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Grid of Dynamic Labels */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px', maxHeight: '350px', overflowY: 'auto', padding: '4px' }}>
                    {availableLabels.map(label => (
                      <div
                        key={label.id}
                        onClick={() => {
                          handleFieldChange(activeSelectorField, label.image);
                          setActiveSelectorField(null);
                        }}
                        style={{
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          padding: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.03)',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                          gap: '6px'
                        }}
                        className="label-card-hover"
                      >
                        <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff', borderRadius: '4px', border: '1px solid var(--glass-border)', padding: '4px' }}>
                          <img src={label.image} alt={label.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{label.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>PLU {label.barcode}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Ou capture uma foto em tempo real pelo tablet:</h4>
                    <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', cursor: 'pointer', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                      <Camera size={18} />
                      Tirar Foto da Etiqueta
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleFieldChange(activeSelectorField, reader.result);
                              setActiveSelectorField(null);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Datalists de sugestões de autocomplete */}
            <datalist id="list-responsibles">
                {responsibles.map(name => <option key={name} value={name} />)}
            </datalist>
            <datalist id="list-visitors">
                {visitors.map(name => <option key={name} value={name} />)}
            </datalist>
            <datalist id="list-companies">
                {companies.map(name => <option key={name} value={name} />)}
            </datalist>
        </div>
    );
};

const getDatalistId = (colKey) => {
    if (!colKey) return null;
    const key = colKey.toLowerCase();
    if (
        key.includes('responsible') || 
        key.includes('responsavel') || 
        key.includes('operator') || 
        key.includes('employee') || 
        key.includes('user') ||
        key.includes('funcionario')
    ) {
        return 'list-responsibles';
    }
    if (key.includes('visitor') || key.includes('visitante') || key.includes('visita')) {
        return 'list-visitors';
    }
    if (
        key.includes('company') || 
        key.includes('empresa') || 
        key.includes('supplier') || 
        key.includes('fornecedor') ||
        key.includes('cliente') ||
        key.includes('destino') ||
        key.includes('brand') ||
        key.includes('marca')
    ) {
        return 'list-companies';
    }
    return null;
};

export default FormEntry;
