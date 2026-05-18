import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getForms, openSession } from '../../services/db';
import { FileText, Play } from 'lucide-react';

export const DayForms = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);

  useEffect(() => {
    getForms().then(setForms);
  }, []);

  const start = async (formId) => {
    // Open or reuse today's session for demo
    const session = await openSession('1', formId, 'F1');
    navigate(`/forms/session/${session.id}`);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 12 }}><FileText size={18} /> Formulários do Dia</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {forms.map(f => (
          <div key={f.id} className="glass-panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{f.title}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{f.description}</div>
            </div>
            <button className="btn-primary" onClick={() => start(f.id)}>
              <Play size={14} /> Iniciar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayForms;
