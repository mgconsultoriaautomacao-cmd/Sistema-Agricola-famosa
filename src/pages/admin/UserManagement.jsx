import React, { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Edit, Trash2, Shield, User, Key, X, Save } from 'lucide-react';

export const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'operator',
        pin: '',
        username: '',
        password: '',
        farmId: 'FAMOSA'
    });

    useEffect(() => {
        const load = async () => {
            const data = await getUsers();
            setUsers(data || []);
        };
        load();
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                role: user.role,
                pin: user.pin || '',
                username: user.username || '',
                password: user.password || '',
                farmId: user.farmId || 'FAMOSA'
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                role: 'operator',
                pin: '',
                username: '',
                password: '',
                farmId: 'FAMOSA'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await updateUser(currentUser.id, editingUser.id, formData);
            } else {
                await addUser(currentUser.id, formData);
            }
            const data = await getUsers();
            setUsers(data || []);
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            await deleteUser(currentUser.id, userId);
            const data = await getUsers();
            setUsers(data || []);
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 className="agro-gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Gestão de Equipe</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontWeight: 600 }}>Governança de acessos e permissões RLS</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <UserPlus size={20} /> Adicionar Colaborador
                </button>
            </div>

            <div className="glass-panel">
                <table className="agro-table">
                    <thead>
                        <tr>
                            <th>Colaborador</th>
                            <th>Permissão</th>
                            <th>Acesso</th>
                            <th>Fazenda</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{u.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ID: {u.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '500',
                                        backgroundColor: u.role === 'admin' ? '#FED7D7' : 
                                                         u.role === 'supervisor' ? '#FEEBC8' : 
                                                         u.role === 'validator' ? '#E9D8FD' : 
                                                         u.role === 'certifier' ? '#BEE3F8' : 
                                                         u.role === 'sede' ? '#E2E8F0' : 
                                                         u.role === 'auditor' ? '#EDF2F7' : '#C6F6D5',
                                        color: u.role === 'admin' ? '#9B2C2C' : 
                                               u.role === 'supervisor' ? '#975A16' : 
                                               u.role === 'validator' ? '#553C9A' : 
                                               u.role === 'certifier' ? '#2B6CB0' : 
                                               u.role === 'sede' ? '#4A5568' : 
                                               u.role === 'auditor' ? '#4A5568' : '#22543D'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {u.pin ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                                            <Key size={14} /> PIN: ****
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                                            <Shield size={14} /> @{u.username}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>{u.farmId || '--'}</td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button className="btn-secondary" style={{ padding: '8px' }} onClick={() => handleOpenModal(u)}><Edit size={16} /></button>
                                        <button className="btn-secondary" style={{ padding: '8px', color: 'var(--color-danger)' }} onClick={() => handleDelete(u.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nome Completo</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Função / Permissão</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                    <option value="operator">Operador (Acesso PIN)</option>
                                    <option value="supervisor">Supervisor (Acesso PIN)</option>
                                    <option value="admin">Administrador</option>
                                    <option value="sede">Sede / HQ</option>
                                    <option value="auditor">Auditor (Somente Leitura)</option>
                                    <option value="validator">Validador (Validação de Pastas)</option>
                                    <option value="certifier">Certificador (Equipe de Certificação)</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Fazenda Principal</label>
                                    <input 
                                        type="text" 
                                        value={formData.farmId} 
                                        onChange={e => setFormData({...formData, farmId: e.target.value})} 
                                    />
                                </div>
                                {['operator', 'supervisor'].includes(formData.role) ? (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>PIN (4 dígitos)</label>
                                        <input 
                                            type="password" 
                                            maxLength={4} 
                                            required 
                                            value={formData.pin} 
                                            onChange={e => setFormData({...formData, pin: e.target.value})} 
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Username</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.username} 
                                            onChange={e => setFormData({...formData, username: e.target.value})} 
                                        />
                                    </div>
                                )}
                            </div>

                            {!['operator', 'supervisor'].includes(formData.role) && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Senha de Acesso</label>
                                    <input 
                                        type="password" 
                                        required 
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})} 
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}><Save size={18} /> Salvar Usuário</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
