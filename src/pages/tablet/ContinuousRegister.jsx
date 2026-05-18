import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionWithRecords, addRecord, getUsers } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, ArrowLeft, Clock, User, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const ContinuousRegister = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rowValue, setRowValue] = useState('');
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionData, usersData] = await Promise.all([
        getSessionWithRecords(sessionId),
        getUsers()
      ]);
      setSession(sessionData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading continuous register data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const handleAdd = async () => {
    if (!rowValue.trim()) return;
    try {
      await addRecord(user.id, sessionId, { evento: rowValue });
      setRowValue('');
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-10 text-white animate-pulse">Carregando formulário contínuo...</div>;
  if (!session) return <div className="p-10 text-white">Sessão não encontrada</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={() => navigate('/forms')}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 style={{ margin: 0 }}>Registro Contínuo — {session.form?.title}</h2>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            value={rowValue} 
            onChange={e => setRowValue(e.target.value)} 
            placeholder="Descreva o evento ou ocorrência a registrar..." 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn-primary" onClick={handleAdd} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Registrar
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 0 }}>
        <table className="agro-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Horário</th>
              <th>Evento / Ocorrência</th>
              <th>Operador</th>
            </tr>
          </thead>
          <tbody>
            {session.records?.map(r => {
              const operatorName = users.find(u => u.id === r.userId)?.name || r.userId;
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary-dark)' }}>
                    <Clock size={14} />
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{r.data?.evento}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} />
                      {operatorName}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!session.records || session.records.length === 0) && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Nenhum evento registrado nesta sessão ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContinuousRegister;
