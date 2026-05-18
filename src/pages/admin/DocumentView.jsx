import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionWithRecords, getUsers } from '../../services/db';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Calendar, MapPin, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const DocumentView = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [res, usersVal] = await Promise.all([
          getSessionWithRecords(docId),
          getUsers()
        ]);
        setData(res);
        setUsers(usersVal);
      } catch (error) {
        console.error("Error loading document view:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [docId]);

  if (loading) return <div className="p-10 text-white animate-pulse">Carregando documento...</div>;
  if (!data) return <div className="p-10 text-white">Documento não encontrado</div>;

  const getFieldLabel = (key) => data.form?.fields?.find(f => f.name === key)?.label || key;
  
  const getUserName = (userId) => {
    return users.find(u => u.id === String(userId))?.name || userId;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Back Button & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={() => navigate('/admin/documents')}>
          <ArrowLeft size={16} /> Voltar para Arquivos
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="paper" 
        style={{ padding: '40px', background: '#fff', color: '#1f2937', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderRadius: '16px' }}
      >
        {/* Header Oficial da Famosa */}
        <header style={{ marginBottom: '32px', borderBottom: '3px solid var(--color-primary-dark)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary-dark)', letterSpacing: '0.5px' }}>
                PACKING HOUSE FAMOSA
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>
                Sistema de Gestão e Garantia da Qualidade
              </div>
              <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 700, marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="var(--color-primary)" />
                Unidade Produtiva: {data.farmName}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827' }}>
                {data.form?.id} - {data.form?.title}
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>
                Versão Normativa: {data.form?.version || '1.0'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                <Calendar size={14} />
                Data de Coleta: {format(new Date(data.date), 'dd/MM/yyyy')}
              </div>
              {data.form?.haccp && (
                <div style={{ color: 'var(--color-danger)', fontWeight: 800, marginTop: '6px', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(239, 68, 68, 0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  [ Requisito Crítico HACCP ]
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Corpo do Relatório */}
        <section>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '0.85rem', textTransform: 'uppercase' }}>Horário</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '0.85rem', textTransform: 'uppercase' }}>Registros Operacionais / Medições</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '0.85rem', textTransform: 'uppercase', width: '200px' }}>Operador</th>
              </tr>
            </thead>
            <tbody>
              {data.records?.map((r, index) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '14px 16px', color: '#111827', fontWeight: 700, fontSize: '0.9rem', verticalAlign: 'top' }}>
                    {format(new Date(r.timestamp), 'HH:mm')}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#374151' }}>
                    {r.data?.grid ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', padding: '6px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                        {Object.entries(r.data.grid).map(([key, val]) => (
                          <div key={key} style={{ fontSize: '0.85rem' }}>
                            <strong>{key}:</strong> <span style={{ fontWeight: 600 }}>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Object.entries(r.data || {}).map(([k, v]) => {
                          if (k === 'checklist' && typeof v === 'object') return null; // Don't list raw checklist objects
                          const isImage = String(v).startsWith('data:image');
                          return (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                              <strong>{getFieldLabel(k)}:</strong>{' '}
                              {isImage ? (
                                <div style={{ padding: '4px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px' }}>
                                  <img src={String(v)} alt="Amostra" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                              ) : (
                                <span style={{ fontWeight: 600 }}>{String(v)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} />
                      {getUserName(r.userId)}
                    </div>
                  </td>
                </tr>
              ))}
              {(!data.records || data.records.length === 0) && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontStyle: 'italic' }}>
                    Nenhum registro lançado para esta sessão.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Observações e Assinaturas */}
          <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '30px' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>
                  Observações de Processo:
                </div>
                <div style={{ minHeight: '80px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb', fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5' }}>
                  {data.records?.length > 0 
                    ? 'Auditoria executada em conformidade com as diretrizes de Higiene e Segurança da Qualidade estabelecidas pela Famosa.' 
                    : 'Nenhuma observação operacional registrada.'}
                </div>
              </div>
              
              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <div style={{ marginBottom: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>
                  Responsável pela Execução
                </div>
                <div style={{ borderTop: '2px solid #111827', paddingTop: '8px', fontWeight: 700, color: '#111827' }}>
                  {getUserName(data.createdBy)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>
                  Função: Supervisor de Campo
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
                  Data/Hora: {data.records?.length > 0 ? format(new Date(data.records[0].timestamp), 'dd/MM/yyyy HH:mm') : format(new Date(data.date), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>

            {/* Verificação HACCP Se Assinado */}
            {data.status === 'signed' && (
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '30px', borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} />
                    Verificação e Aprovação HACCP:
                  </div>
                  <div style={{ minHeight: '60px', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px', backgroundColor: 'rgba(52, 211, 153, 0.05)', fontSize: '0.875rem', color: 'var(--color-primary-dark)', lineHeight: '1.5', fontWeight: 500 }}>
                    Documento auditado eletronicamente. As medições foram coletadas via PWA corporativo e aprovadas nos padrões de conformidade Tesco Nurture.
                  </div>
                </div>
                
                <div style={{ textAlign: 'center', minWidth: '220px' }}>
                  <div style={{ marginBottom: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>
                    Responsável pela Verificação
                  </div>
                  <div style={{ borderTop: '2px solid #111827', paddingTop: '8px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {getUserName(data.signedBy)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>
                    Função: Auditor de Conformidade
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
                    Assinado em: {format(new Date(data.signedAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </motion.div>

    </div>
  );
};

export default DocumentView;
