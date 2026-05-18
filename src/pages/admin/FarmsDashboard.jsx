import React, { useState, useEffect, useMemo } from 'react';
import { getFarms, getSessions, addFarm, updateFarm, deleteFarm } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Edit2, Layers, MapPin, Activity, CheckCircle, Clock, Save, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FarmsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [farms, setFarms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState('');
  const [formData, setFormData] = useState({ id: '', name: '', sectors: [] });
  const [newSector, setNewSector] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, s] = await Promise.all([getFarms(), getSessions()]);
      setFarms(f);
      setSessions(s);
    } catch (error) {
      console.error("Error loading farms dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const totalFarms = farms.length;
    const totalSectors = farms.reduce((acc, f) => acc + (f.sectors?.length || 0), 0);
    const totalSessions = sessions.length;
    const openSessions = sessions.filter(s => s.status !== 'signed').length;
    
    return { totalFarms, totalSectors, totalSessions, openSessions };
  }, [farms, sessions]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingFarmId('');
    setFormData({ id: '', name: '', sectors: ['Packing House', 'Higiene', 'Campo'] });
    setNewSector('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (farm) => {
    setIsEditMode(true);
    setEditingFarmId(farm.id);
    setFormData({ id: farm.id, name: farm.name, sectors: [...(farm.sectors || [])] });
    setNewSector('');
    setIsModalOpen(true);
  };

  const handleAddSector = (e) => {
    e.preventDefault();
    const sectorName = newSector.trim();
    if (!sectorName) return;
    
    if (formData.sectors.includes(sectorName)) {
      alert('Este setor já foi adicionado.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      sectors: [...prev.sectors, sectorName]
    }));
    setNewSector('');
  };

  const handleRemoveSector = (sectorToRemove) => {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sectorToRemove)
    }));
  };

  const handleSaveFarm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, insira o nome da fazenda.');
      return;
    }
    if (!isEditMode && !formData.id.trim()) {
      alert('Por favor, insira um código/ID identificador único.');
      return;
    }
    if (formData.sectors.length === 0) {
      alert('Por favor, adicione pelo menos um setor de atividade.');
      return;
    }

    try {
      if (isEditMode) {
        await updateFarm(user.id, editingFarmId, {
          name: formData.name,
          sectors: formData.sectors
        });
        alert('Fazenda atualizada com sucesso!');
      } else {
        await addFarm(user.id, formData);
        alert('Nova fazenda cadastrada com sucesso!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteFarm = async (farmId, farmName) => {
    const farmSessions = sessions.filter(s => s.farmId === farmId);
    let confirmMsg = `Tem certeza que deseja excluir a unidade "${farmName}"?`;
    
    if (farmSessions.length > 0) {
      confirmMsg += `\n\nATENÇÃO: Existem ${farmSessions.length} fichas/sessões associadas a esta fazenda. Esta exclusão pode inviabilizar relatórios históricos.`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        await deleteFarm(user.id, farmId);
        alert('Fazenda removida com sucesso!');
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  if (loading) return <div className="p-10 text-white animate-pulse">Carregando painel de fazendas...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Title Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel" 
        style={{ padding: '24px 32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}
      >
        <div>
          <h2 className="agro-gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Gestão Corporativa de Unidades</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>Cadastre fazendas, configure setores dinâmicos e controle o fluxo PWA offline.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Cadastrar Fazenda
        </button>
      </motion.div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>UNIDADES</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalFarms}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SETORES TOTAIS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalSectors}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>HISTÓRICO DE FICHAS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalSessions}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>EM ABERTO NO CAMPO</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.openSessions}</div>
          </div>
        </div>
      </div>

      {/* Farms Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {farms.map(f => {
          const farmSessions = sessions.filter(s => s.farmId === f.id);
          const open = farmSessions.filter(s => s.status !== 'signed').length;
          const signed = farmSessions.filter(s => s.status === 'signed').length;
          
          return (
            <motion.div 
              key={f.id} 
              layout
              whileHover={{ y: -4 }}
              className="glass-panel" 
              style={{ padding: '28px', borderTop: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{f.name}</h3>
                    <code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>ID: {f.id}</code>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleOpenEditModal(f)} 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', minWidth: 'auto', borderRadius: '8px' }}
                      title="Editar Unidade"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteFarm(f.id, f.name)} 
                      className="btn-secondary" 
                      style={{ padding: '6px 10px', minWidth: 'auto', borderRadius: '8px', color: 'var(--color-danger)' }}
                      title="Excluir Unidade"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sectors Display */}
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Setores Ativos ({f.sectors?.length || 0})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {f.sectors && f.sectors.map(sector => (
                      <span key={sector} style={{ fontSize: '0.75rem', background: 'rgba(5, 150, 105, 0.08)', color: 'var(--color-primary-dark)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Session Breakdown */}
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{farmSessions.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: 600 }}>Em aberto</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-warning)' }}>{open}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>Assinados</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>{signed}</div>
                  </div>
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '10px' }}
                onClick={() => navigate(`/admin/dashboard?farm=${f.id}`)}
              >
                Explorar Documentação
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* CRUD Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 999 
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '540px', padding: '32px', margin: '20px', position: 'relative' }}
            >
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', marginTop: 0 }}>
                {isEditMode ? 'Editar Unidade' : 'Cadastrar Nova Fazenda'}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                {isEditMode ? 'Ajuste os parâmetros ou setores da fazenda selecionada.' : 'Cadastre uma nova fazenda e defina seus setores de monitoramento.'}
              </p>

              <form onSubmit={handleSaveFarm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ID Field (Only on create) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                    Código/ID Identificador Único
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: F_MACAIPO"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    disabled={isEditMode}
                    style={{ 
                      textTransform: 'uppercase',
                      backgroundColor: isEditMode ? 'rgba(0,0,0,0.05)' : 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '12px',
                      width: '100%',
                      fontSize: '0.95rem'
                    }}
                    required
                  />
                  {!isEditMode && (
                    <small style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                      Identificador interno (sem espaços ou caracteres especiais). Ex: <code>F_MACAIPO</code>
                    </small>
                  )}
                </div>

                {/* Name Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                    Nome da Unidade
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Fazenda Macaípo"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{ 
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '12px',
                      width: '100%',
                      fontSize: '0.95rem'
                    }}
                    required
                  />
                </div>

                {/* Sectors Management */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
                    Setores de Atividade
                  </label>
                  
                  {/* Active tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {formData.sectors.map(sector => (
                      <span 
                        key={sector} 
                        style={{ 
                          fontSize: '0.8rem', 
                          background: 'rgba(5, 150, 105, 0.08)', 
                          color: 'var(--color-primary-dark)', 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {sector}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSector(sector)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--color-danger)' }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    {formData.sectors.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} /> Nenhum setor adicionado!
                      </span>
                    )}
                  </div>

                  {/* Add Sector Form */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Adicionar novo setor..."
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      style={{ 
                        border: '1px solid #ddd',
                        borderRadius: '8px 0 0 8px',
                        padding: '10px 12px',
                        flex: 1,
                        fontSize: '0.9rem'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={handleAddSector}
                      className="btn-primary"
                      style={{ borderRadius: '0 8px 8px 0', padding: '10px 20px' }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setIsModalOpen(false)}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Save size={18} /> Salvar Alterações
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default FarmsDashboard;
