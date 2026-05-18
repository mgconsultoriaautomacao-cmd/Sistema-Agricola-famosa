import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSessionWithRecords, getUsers } from '../../services/db';
import { format } from 'date-fns';

export const DocumentPDFView = () => {
  const { docId } = useParams();
  
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [res, usersData] = await Promise.all([
          getSessionWithRecords(docId),
          getUsers()
        ]);
        setData(res);
        setUsers(usersData);
      } catch (error) {
        console.error("Error loading PDF view data:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [docId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Preparando PDF...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#c53030' }}>Documento não encontrado</div>;

  const getFieldLabel = (key) => data.form?.fields?.find(f => f.name === key)?.label || key;
  
  const getUserName = (userId) => {
    return users.find(u => u.id === String(userId))?.name || userId;
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', background: '#fff', padding: 20, border: '1px solid #ddd', color: '#111827', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #333', paddingBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>PACKING HOUSE FAMOSA</h3>
        <div style={{ fontSize: '0.85rem', color: '#555', marginTop: 4, fontWeight: 600 }}>Sistema de Gestão Operacional</div>
        <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 700, marginTop: 4 }}>Fazenda: {data.farmName}</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.form?.id} - {data.form?.title}</div>
        <div style={{ fontSize: '0.85rem', color: '#444', marginTop: 4 }}>Versão Normativa: {data.form?.version || '1.0'} | Data: {format(new Date(data.date), 'dd/MM/yyyy')}</div>
        {data.form?.haccp && <div style={{ color: '#ef4444', fontWeight: 800, marginTop: 4, fontSize: '0.75rem', letterSpacing: '0.5px' }}>[ REQUISITO CRÍTICO HACCP ]</div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: 10, border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700 }}>Horário</th>
            <th style={{ padding: 10, border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700 }}>Registro / Medições</th>
            <th style={{ padding: 10, border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700 }}>Operador</th>
          </tr>
        </thead>
        <tbody>
          {data.records?.map(r => (
            <tr key={r.id}>
              <td style={{ padding: 10, border: '1px solid #e5e7eb', fontWeight: 700 }}>{format(new Date(r.timestamp), 'HH:mm')}</td>
              <td style={{ padding: 10, border: '1px solid #e5e7eb' }}>
                {r.data?.grid ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px' }}>
                    {Object.entries(r.data.grid).map(([key, val]) => (
                      <div key={key} style={{ fontSize: '0.8rem' }}>
                        <strong>{key}:</strong> {String(val)}
                      </div>
                    ))}
                  </div>
                ) : (
                  Object.entries(r.data || {}).map(([key, value]) => {
                    if (key === 'checklist' && typeof value === 'object') return null;
                    const isImage = String(value).startsWith('data:image');
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                        <strong>{getFieldLabel(key)}:</strong>{' '}
                        {isImage ? (
                          <div style={{ padding: '4px', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px' }}>
                            <img src={String(value)} alt="Amostra" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          </div>
                        ) : (
                          <span>{String(value)}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </td>
              <td style={{ padding: 10, border: '1px solid #e5e7eb', color: '#555', fontWeight: 600 }}>{getUserName(r.userId)}</td>
            </tr>
          ))}
          {(!data.records || data.records.length === 0) && (
            <tr>
              <td colSpan="3" style={{ padding: 20, textAlign: 'center', color: '#777', fontStyle: 'italic' }}>Nenhum registro lançado nesta sessão.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 30, borderTop: '1px solid #333', paddingTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, marginRight: 20, minWidth: '250px' }}>
            <div style={{ marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>
              <strong>Observações:</strong>
            </div>
            <div style={{ minHeight: 60, border: '1px solid #ccc', borderRadius: '4px', padding: 10, backgroundColor: '#f9f9f9', fontSize: '0.8rem', lineHeight: '1.4' }}>
              {data.records?.length > 0 ? 'Registros diários preenchidos e validados conforme procedimento operacional padrão da Famosa.' : 'Nenhuma observação de campo lançada.'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center', minWidth: 200 }}>
            <div style={{ marginBottom: 8, fontWeight: 700, fontSize: '0.85rem' }}>
              <strong>Responsável pela Execução:</strong>
            </div>
            <div style={{ borderTop: '1.5px solid #111', paddingTop: 6, fontWeight: 700, fontSize: '0.85rem' }}>
              {getUserName(data.createdBy)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: 2 }}>
              Função: Operador de Produção
            </div>
            <div style={{ fontSize: '0.75rem', color: '#555' }}>
              Data: {data.records?.length > 0 ? format(new Date(data.records[0].timestamp), 'dd/MM/yyyy HH:mm') : format(new Date(data.date), 'dd/MM/yyyy')}
            </div>
          </div>
        </div>

        {data.status === 'signed' && (
          <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', borderTop: '1px solid #ddd', paddingTop: 16 }}>
            <div style={{ flex: 1, marginRight: 20, minWidth: '250px' }}>
              <div style={{ marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#059669' }}>
                <strong>Verificação HACCP:</strong>
              </div>
              <div style={{ minHeight: 40, border: '1px solid #a7f3d0', borderRadius: '4px', padding: 10, backgroundColor: '#f0fdf4', fontSize: '0.8rem', lineHeight: '1.4', color: '#047857' }}>
                Documento verificado e aprovado eletronicamente conforme requisitos de conformidade Tesco Nurture e HACCP.
              </div>
            </div>
            
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <div style={{ marginBottom: 8, fontWeight: 700, fontSize: '0.85rem' }}>
                <strong>Responsável pela Verificação:</strong>
              </div>
              <div style={{ borderTop: '1.5px solid #111', paddingTop: 6, fontWeight: 700, fontSize: '0.85rem', color: '#047857' }}>
                {getUserName(data.signedBy)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: 2 }}>
                Função: Auditor de Conformidade
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555' }}>
                Assinado em: {format(new Date(data.signedAt), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPDFView;
