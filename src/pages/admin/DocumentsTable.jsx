import React, { useState, useEffect } from 'react';
import { getSessions, getFarms, getForms } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import { Filter, Download, Eye, FileText, Calendar, MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const DocumentsTable = () => {
  const navigate = useNavigate();
  
  const [farms, setFarms] = useState([]);
  const [forms, setForms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterFarm, setFilterFarm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Carregar dados estáticos iniciais
  useEffect(() => {
    Promise.all([getFarms(), getForms()]).then(([farmsData, formsData]) => {
      setFarms(farmsData);
      setForms(formsData);
    });
  }, []);

  // Carregar sessões filtradas sempre que os filtros mudarem
  useEffect(() => {
    setLoading(true);
    getSessions(filterFarm, filterDate).then(data => {
      setSessions(data);
      setLoading(false);
    });
  }, [filterFarm, filterDate]);

  const view = (s) => navigate(`/admin/document/${s.id}`);
  const pdf = (s) => navigate(`/admin/document-pdf/${s.id}`);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <h2 className="agro-gradient-text" style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>Central de Fichas e Relatórios</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontWeight: 500 }}>Acesse, filtre e faça o download em PDF das auditorias operacionais das fazendas.</p>
      </motion.div>

      {/* Filtros */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
          <Filter size={18} />
          <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filtrar por:</span>
        </div>
        
        <div style={{ width: '250px' }}>
          <select value={filterFarm} onChange={e => setFilterFarm(e.target.value)}>
            <option value="">Todas as Unidades (Fazendas)</option>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div style={{ width: '200px' }}>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>

        {filterDate || filterFarm ? (
          <button 
            className="btn-secondary" 
            onClick={() => { setFilterFarm(''); setFilterDate(''); }}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Limpar Filtros
          </button>
        ) : null}
      </div>

      {/* Tabela de Documentos */}
      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
            <Activity className="animate-spin" size={24} />
            <span style={{ fontWeight: 600 }}>Buscando registros...</span>
          </div>
        ) : (
          <table className="agro-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ID Rastreio</th>
                <th>Formulário / Ficha</th>
                <th>Fazenda</th>
                <th>Data Coleta</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const formObj = forms.find(f => f.id === s.formId) || {};
                const farmObj = farms.find(f => f.id === s.farmId) || {};
                const isSigned = s.status === 'signed';

                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{s.id.substring(0, 8).toUpperCase()}...</div>
                      <code style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>UID: {s.id}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.08)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formObj.title || s.formId}</div>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{s.formId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <MapPin size={14} color="var(--color-primary)" />
                        {farmObj.name || s.farmId}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        <Calendar size={14} />
                        {s.date}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isSigned ? 'signed' : 'open'}`} style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: isSigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: isSigned ? 'var(--color-success)' : 'var(--color-warning)',
                        textTransform: 'uppercase'
                      }}>
                        {isSigned ? 'Assinado' : 'Em Aberto'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn-secondary" onClick={() => view(s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem' }}>
                          <Eye size={14} /> Detalhes
                        </button>
                        <button className="btn-primary" onClick={() => pdf(s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem' }}>
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Nenhuma ficha de auditoria encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentsTable;
