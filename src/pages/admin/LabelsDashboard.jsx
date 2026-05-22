import React, { useState, useEffect, useMemo } from 'react';
import { getLabels, addLabel, deleteLabel } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Tag, Upload, Save, X, Eye, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LabelsDashboard = () => {
  const { user } = useAuth();
  
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', variety: '', barcode: '', image: '' });
  const [imagePreview, setImagePreview] = useState('');

  const loadLabels = async () => {
    setLoading(true);
    try {
      const data = await getLabels();
      setLabels(data);
    } catch (error) {
      console.error("Error loading labels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabels();
  }, []);

  const stats = useMemo(() => {
    const total = labels.length;
    const varieties = new Set(labels.map(l => l.variety)).size;
    return { total, varieties };
  }, [labels]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).');
      return;
    }

    // Limit file size to 2MB to keep localStorage lightweight
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem é muito grande! Por favor, selecione uma imagem menor que 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenModal = () => {
    setFormData({ name: '', variety: '', barcode: '', image: '' });
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveLabel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.variety.trim() || !formData.barcode.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formData.image) {
      alert('Por favor, selecione ou faça upload da imagem da etiqueta.');
      return;
    }

    try {
      await addLabel(user.id, formData);
      setIsModalOpen(false);
      loadLabels();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteLabel = async (labelId, labelName) => {
    if (!window.confirm(`Tem certeza de que deseja remover o produto ou etiqueta "${labelName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteLabel(user.id, labelId);
      loadLabels();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag size={28} /> Cadastro de Produtos & Etiquetas
            </h1>
            <p style={{ margin: '6px 0 0 0', color: 'var(--color-text-muted)' }}>
              Cadastre e gerencie o catálogo de produtos e etiquetas/PLUs autorizados para uso nas linhas de embalagem e checklists de carregamento.
            </p>
          </div>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }} onClick={handleOpenModal}>
            <Plus size={20} /> Cadastrar Novo Produto / Etiqueta
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <Tag size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Produtos & Etiquetas</h4>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem' }}>{stats.total}</h2>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
            <FileText size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Variedades de Frutas</h4>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem' }}>{stats.varieties}</h2>
          </div>
        </div>
      </div>

      {/* Grid of Labels */}
      {loading ? (
        <div className="p-10 text-white animate-pulse">Carregando catálogo de etiquetas...</div>
      ) : labels.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', margin: 0 }}>Nenhum produto ou etiqueta cadastrado no sistema.</p>
          <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={handleOpenModal}>Cadastrar Primeiro Produto / Etiqueta</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {labels.map((label) => (
            <motion.div
              key={label.id}
              className="glass-panel"
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
              layout
            >
              {/* Image Box */}
              <div style={{
                width: '100%',
                height: '180px',
                borderRadius: '8px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '16px'
              }}>
                <img
                  src={label.image}
                  alt={label.name}
                  style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '4px' }}
                />
              </div>

              {/* Information */}
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-text)' }}>{label.name}</h3>
                <span className="badge-tech" style={{ display: 'inline-block', marginBottom: '12px' }}>
                  {label.variety}
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span><strong>Código PLU:</strong> {label.barcode}</span>
                  <span><strong>Rastreabilidade:</strong> TESCO Comp.</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  style={{
                    borderColor: 'var(--color-danger)',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '0.85rem'
                  }}
                  onClick={() => handleDeleteLabel(label.id, label.name)}
                >
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal - Cadastrar Nova Etiqueta */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '550px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={20} /> Novo Produto ou Rótulo de Exportação
                </h2>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}
                  onClick={handleCloseModal}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveLabel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nome do Produto / Etiqueta *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}
                    placeholder="Ex: Melancia Tesco Export Premium"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Variedade / Fruta *</label>
                    <select
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                      value={formData.variety}
                      onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      <option value="Melancia Sem Semente">Melancia Sem Semente</option>
                      <option value="Melão Amarelo">Melão Amarelo</option>
                      <option value="Melão Cantaloupe">Melão Cantaloupe</option>
                      <option value="Melão Pele de Sapo">Melão Pele de Sapo</option>
                      <option value="Melão Gália">Melão Gália</option>
                      <option value="Abóbora Cabotiá">Abóbora Cabotiá</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Código PLU / Rótulo *</label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}
                      placeholder="Ex: 1002 1392"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Upload Image Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Imagem do Produto / Etiqueta *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: imagePreview ? '120px 1fr' : '1fr', gap: '16px' }}>
                    {imagePreview && (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <label style={{
                      flexGrow: 1,
                      border: '2px dashed var(--glass-border)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      textAlign: 'center',
                      gap: '8px',
                      minHeight: '120px'
                    }}>
                      <Upload size={24} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Escolher arquivo ou tirar foto</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Formatos suportados: PNG, JPG, SVG</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <button type="button" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleCloseModal}>
                    <X size={18} /> Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: '130px' }}>
                    <Save size={18} /> Salvar Produto / Etiqueta
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

export default LabelsDashboard;
