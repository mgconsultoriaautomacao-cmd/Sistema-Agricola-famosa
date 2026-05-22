import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getSessionWithRecords, getUsers, editRecord, updateSessionStatus } from '../../services/db';
import { generateSessionPDF } from '../../services/pdf';
import logo from '../../assets/logo_famosa.png';
import { format } from 'date-fns';
import { ArrowLeft, Download, BookOpen, FileText, CheckCircle, AlertCircle, HelpCircle, ClipboardCheck, Edit2, Save, X } from 'lucide-react';

export const SessionDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [session, setSession] = React.useState(null);
  const [allUsers, setAllUsers] = React.useState([]);
  const [editingRecordId, setEditingRecordId] = React.useState(null);
  const [editValues, setEditValues] = React.useState({});
  const [editReason, setEditReason] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, u] = await Promise.all([getSessionWithRecords(sessionId), getUsers()]);
      if (!s) navigate('/admin/dashboard');
      else {
        setSession(s);
        setAllUsers(u);
      }
      setLoading(false);
    };
    load();
  }, [sessionId, refreshKey, navigate]);

  // Helpers to calculate compliance
  const stats = useMemo(() => {
    const lastRecord = session?.records?.[session.records.length - 1];
    if (!lastRecord?.data?.checklist) return null;
    const items = Object.values(lastRecord.data.checklist);
    const total = items.length;
    const conforms = items.filter(i => i.status === 'SIM').length;
    const nonConforms = items.filter(i => i.status === 'NÃO').length;
    const pct = total > 0 ? Math.round((conforms / (conforms + nonConforms)) * 100) : 0;
    return { total, conforms, nonConforms, pct };
  }, [session]);

  if (loading || !session) return <div className="p-10 text-white animate-pulse">Carregando detalhes...</div>;

  const { form, records } = session;
  const lastRecord = records[records.length - 1];

  const isAdmin = user?.role === 'admin';
  const isAuditor = user?.role === 'auditor';
  const isSede = user?.role === 'sede';
  const isValidator = user?.role === 'validator';
  const isCertifier = user?.role === 'certifier';

  const startEdit = (record) => {
    setEditingRecordId(record.id);
    setEditValues({ ...record.data });
  };

  const cancelEdit = () => {
      setEditingRecordId(null);
      setEditValues({});
  };

  const handleSaveEdit = async () => {
      try {
          await editRecord(user.id, session.id, editingRecordId, editValues, true, editReason);
          setEditingRecordId(null);
          setEditReason('');
          setRefreshKey(prev => prev + 1);
          alert('Registro corrigido com sucesso! A alteração foi registrada na trilha de auditoria.');
      } catch (error) {
          alert(error.message);
      }
  };

  const updateChecklistValue = (itemId, field, value) => {
    setEditValues(prev => ({
        ...prev,
        checklist: {
            ...prev.checklist,
            [itemId]: {
                ...prev.checklist[itemId],
                [field]: value
            }
        }
    }));
  };


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(isAdmin || isAuditor || isSede || isValidator || isCertifier) && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={session.validationStatus || 'pending'} 
                onChange={(e) => updateSessionStatus(user.id, session.id, 'validationStatus', e.target.value).then(() => setRefreshKey(k => k + 1))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-warning)', fontWeight: 'bold' }}
              >
                <option value="pending">Pendente Validação</option>
                <option value="validated">Validado</option>
                <option value="rejected">Rejeitado</option>
              </select>

              <select 
                value={session.certificationStatus || 'waiting'} 
                onChange={(e) => updateSessionStatus(user.id, session.id, 'certificationStatus', e.target.value).then(() => setRefreshKey(k => k + 1))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-danger)', fontWeight: 'bold' }}
              >
                <option value="waiting">Aguardando Equipe</option>
                <option value="in_review">Em Revisão</option>
                <option value="certified">Certificado</option>
              </select>
            </div>
          )}
          <button className="btn-primary" onClick={() => generateSessionPDF(session)}>
            <Download size={16} /> Gerar PDF Oficial (Auditoria)
          </button>
        </div>
      </div>

      {/* Header Informativo Premium (Audit Style) */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', borderTop: `8px solid ${stats?.nonConforms > 0 ? 'var(--color-danger)' : 'var(--color-primary)'}`, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <img src={logo} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                <div style={{ height: '40px', width: '1px', backgroundColor: 'var(--glass-border)' }} />
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ backgroundColor: 'var(--color-primary-dark)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900' }}>{form.id}</span>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{form.title}</h2>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>CÓDIGO DE AUDITORIA: AF-QA-{form.id}-V{form.version}</div>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Unidade / Farm</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{session.farmName}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Data da Coleta</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{format(new Date(session.date), 'dd/MM/yyyy')}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Versão Normativa</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>V-{form.version} (2024)</div>
                </div>
            </div>
          </div>
          
          {stats && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stats.pct === 100 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {stats.pct}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ÍNDICE DE CONFORMIDADE</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <span className="badge-success" style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem' }}>{stats.conforms} OK</span>
                <span className="badge-danger" style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.75rem' }}>{stats.nonConforms} Irregularidades</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Renderização Condicional por Tipo de Formulário */}
      {form.type === 'checklist' && lastRecord?.data?.checklist ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {form.sections.map(section => (
            <div key={section.title} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <h3 style={{ padding: '16px 24px', backgroundColor: 'var(--color-primary-light)', margin: 0, borderBottom: '1px solid var(--glass-border)', fontSize: '1.1rem' }}>
                {section.title}
              </h3>
              <div style={{ padding: '0 24px' }}>
                {section.items.map((item, idx) => {
                  const response = lastRecord.data.checklist[item.id] || {};
                  const isNo = response.status === 'NÃO';
                  
                  return (
                    <div key={item.id} style={{ 
                        padding: '16px 0', 
                        borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f0f0f0',
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px',
                        gap: '20px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, color: isNo ? 'var(--color-danger)' : 'inherit' }}>
                          {idx + 1}. {item.label}
                        </div>
                        {isNo && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-danger)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={14} /> PLANO DE AÇÃO CORRETIVA:
                            </div>
                            <div style={{ color: 'var(--color-text-main)', opacity: 0.9 }}>{response.actionPlan || 'Nenhuma descrição fornecida.'}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        {editingRecordId === lastRecord.id ? (
                            <select 
                                value={editValues.checklist?.[item.id]?.status || ''} 
                                onChange={(e) => updateChecklistValue(item.id, 'status', e.target.value)}
                                style={{ padding: '4px', borderRadius: '4px' }}
                            >
                                <option value="SIM">SIM</option>
                                <option value="NÃO">NÃO</option>
                                <option value="NA">NA</option>
                            </select>
                        ) : (
                            <StatusBadge status={response.status} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <ClipboardCheck size={20} color="var(--color-primary)" />
                <h3>Registros de Atividade</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid var(--color-primary-light)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Horário</th>
                    <th style={{ padding: '12px' }}>Dados do Registro</th>
                    <th style={{ padding: '12px' }}>Responsável</th>
                </tr>
                </thead>
                <tbody>
                {records.map(record => (
                    <tr key={record.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px', width: '120px' }}>{format(new Date(record.timestamp), 'HH:mm')}</td>
                    <td style={{ padding: '12px' }}>
                        {editingRecordId === record.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.keys(record.data).map(key => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', minWidth: '80px' }}>{key}:</span>
                                        <input 
                                            value={editValues[key] || ''} 
                                            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                                            style={{ flex: 1, padding: '4px' }}
                                        />
                                    </div>
                                ))}
                                <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>Justificativa da Alteração (Obrigatório):</label>
                                    <textarea 
                                        value={editReason}
                                        onChange={(e) => setEditReason(e.target.value)}
                                        placeholder="Descreva o motivo desta correção administrativa..."
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-danger)', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button className="btn-primary" onClick={handleSaveEdit} style={{ padding: '4px 8px', fontSize: '0.75rem' }}><Save size={12}/> Salvar</button>
                                    <button className="btn-secondary" onClick={cancelEdit} style={{ padding: '4px 8px', fontSize: '0.75rem' }}><X size={12}/> Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {record.data.grid ? (
                                <div style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Mapeamento de Grid de Inspeção Completo ({Object.keys(record.data.grid).length} itens)</div>
                                ) : (
                                    Object.entries(record.data).map(([key, value]) => (
                                        <div key={key}><strong>{key}:</strong> {String(value)}</div>
                                    ))
                                )}
                                    {record.history?.length > 0 && (
                                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-warning)', marginBottom: '4px' }}>HISTÓRICO DE CORREÇÃO ADMIN:</div>
                                            {record.history.map((h, i) => (
                                                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    • Alterado em {format(new Date(h.timestamp), 'dd/MM HH:mm')} por {allUsers.find(u => u.id === h.editedBy)?.name || h.editedBy}
                                                    <br/>
                                                    <span style={{ fontStyle: 'italic' }}>Motivo: {h.reason || 'Não informado'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </>
                        )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {allUsers.find(u => u.id === record.userId)?.name || record.userId}
                            {isAdmin && editingRecordId !== record.id && (
                                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => startEdit(record)}>
                                    <Edit2 size={12} /> Corrigir
                                </button>
                            )}
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {editingRecordId === lastRecord?.id && form.type === 'checklist' && (
                <div style={{ marginTop: '24px', padding: '16px', borderTop: '1px solid #eee' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>Justificativa da Alteração (Obrigatório para Auditoria):</label>
                        <textarea 
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            placeholder="Por que este checklist está sendo alterado?"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-danger)', marginTop: '8px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={cancelEdit}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSaveEdit}>Salvar Correções no Checklist</button>
                    </div>
                </div>
            )}
        </div>
      )}

      {session.status === 'signed' && (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '24px', border: '1px dashed var(--color-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FileText size={20} color="var(--color-secondary)" />
                    <h3 style={{ margin: 0 }}>Autenticação do Documento</h3>
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                    <p style={{ margin: '4px 0' }}><strong>Assinado Digitalmente por:</strong> {allUsers.find(u => u.id === session.signedBy)?.name || session.signedBy}</p>
                    <p style={{ margin: '4px 0' }}><strong>Data/Hora do Preenchimento:</strong> {format(new Date(session.signedAt), 'dd/MM/yyyy HH:mm')}</p>
                    <p style={{ margin: '4px 0', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>ID da Transação: {session.id}</p>
                </div>
              </div>
              <div style={{ width: '180px', height: '80px', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                 {session.signature ? (
                     <img src={session.signature} alt="Assinatura Digital" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                 ) : (
                    <small style={{ color: '#999' }}>Assinatura Digital</small>
                 )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
    const config = {
        'SIM': { color: '#166534', bg: '#dcfce7', icon: <CheckCircle size={14} /> },
        'NÃO': { color: '#991b1b', bg: '#fee2e2', icon: <AlertCircle size={14} /> },
        'NA': { color: '#4b5563', bg: '#f3f4f6', icon: <HelpCircle size={14} /> }
    }[status] || { color: '#666', bg: '#eee', icon: null };

    return (
        <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            padding: '4px 12px', 
            borderRadius: '999px', 
            backgroundColor: config.bg, 
            color: config.color,
            fontSize: '0.8rem',
            fontWeight: 'bold'
        }}>
            {config.icon} {status || 'PENDENTE'}
        </span>
    );
};

export default SessionDetail;

