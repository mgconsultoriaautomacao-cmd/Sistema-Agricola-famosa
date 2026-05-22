import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFarms, getSessions, getForms, getSessionWithRecords, getAuditLogs } from '../../services/db';
import { generateSessionPDF } from '../../services/pdf';
import logo from '../../assets/logo_famosa.png';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { 
  Filter, FileText, Download, Activity, Eye, 
  Users, ShieldCheck, Clock, AlertCircle, 
  CheckCircle, TrendingUp, BarChart3, 
  Calendar as CalendarIcon, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const isRestricted = !['admin', 'sede', 'auditor', 'validator', 'certifier'].includes(user?.role);

    const [filterFarm, setFilterFarm] = useState(isRestricted ? (user?.farmId || '') : '');
    const [filterDate, setFilterDate] = useState('');
    const [activeTab, setActiveTab] = useState('sessions');
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        farms: [],
        forms: [],
        sessions: [],
        auditLogs: []
    });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [farms, forms, sessions, auditLogs] = await Promise.all([
                getFarms(),
                getForms(),
                getSessions(filterFarm, filterDate),
                getAuditLogs()
            ]);
            setData({ farms, forms, sessions, auditLogs });
        } catch (err) {
            console.error("Error loading dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterFarm, filterDate]);

    const analytics = useMemo(() => {
        const { sessions } = data;
        const now = new Date();
        const weekRange = { start: startOfWeek(now), end: endOfWeek(now) };

        const stats = {
            pendingValidation: sessions.filter(s => s.status === 'signed' && s.validationStatus === 'pending').length,
            incomplete: sessions.filter(s => s.status === 'open').length,
            waitingCertification: sessions.filter(s => s.validationStatus === 'validated' && s.certificationStatus === 'waiting').length,
            weeklyGoal: sessions.filter(s => isWithinInterval(new Date(s.date), weekRange)).length
        };

        // Chart data: Last 7 days activity
        const chartData = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(now, 6 - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            return {
                name: format(date, 'dd/MM'),
                sessions: sessions.filter(s => s.date === dateStr).length
            };
        });

        return { stats, chartData };
    }, [data.sessions]);

    const generatePDF = async (sessionId) => {
        const sessionData = await getSessionWithRecords(sessionId);
        if (sessionData) generateSessionPDF(sessionData);
    };

    if (loading && data.sessions.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
                <Activity className="animate-spin" size={48} />
                <p style={{ marginTop: '16px', fontWeight: 600 }}>Sincronizando Dados HQ...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src={logo} alt="Logo" style={{ height: '70px', objectFit: 'contain' }} />
                    <div style={{ height: '50px', width: '2px', backgroundColor: 'var(--color-primary)', opacity: 0.3 }} />
                    <div>
                        <h1 className="agro-gradient-text" style={{ fontSize: '2.8rem', marginBottom: '8px' }}>Dashboard Analítico</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="status-badge validated" style={{ padding: '4px 12px', fontSize: '0.7rem' }}>SISTEMA ATIVO</div>
                            <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>ProdTech 4.0 • Agrícola Famosa HQ</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => loadData()}>
                        <Activity size={18} /> Atualizar
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/admin/documents')}>
                        <FileText size={18} /> Central de Arquivos
                    </button>
                </div>
            </motion.div>

            {/* Top Cards & Chart Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <KPICard title="Pendentes Validação" value={analytics.stats.pendingValidation} icon={ShieldCheck} color="var(--color-warning)" detail="Revisão pendente" />
                <KPICard title="Em Aberto (Campo)" value={analytics.stats.incomplete} icon={Clock} color="var(--color-info)" detail="Preenchimento ativo" />
                <KPICard title="Certificação" value={analytics.stats.waitingCertification} icon={AlertCircle} color="var(--color-danger)" detail="Aguardando aprovação" />
                <KPICard title="Fichas da Semana" value={analytics.stats.weeklyGoal} icon={CheckCircle} color="var(--color-success)" detail="Meta operacional" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-panel" style={{ padding: '32px', minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={20} color="var(--color-primary)" /> Tendência de Registros (7 Dias)
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>
                            <ArrowUpRight size={16} /> +12% vs anterior
                        </div>
                    </div>
                    {!loading && isMounted && analytics.chartData.length > 0 ? (
                        <div style={{ height: '300px', width: '100%', minHeight: '300px', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={analytics.chartData}>
                                <defs>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area name="Fichas Preenchidas" type="monotone" dataKey="sessions" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                            Carregando indicadores...
                        </div>
                    )}
                </div>

                <div className="glass-panel" style={{ padding: '32px', minWidth: 0, overflow: 'hidden' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <BarChart3 size={20} color="var(--color-primary)" /> Distribuição por Unidade
                    </h3>
                    {!loading && isMounted && data.farms.length > 0 ? (
                        <div style={{ height: '300px', width: '100%', minHeight: '300px', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={data.farms.slice(0, 5).map(f => ({ name: f.name.split(' ')[0], "registros": data.sessions.filter(s => s.farmId === f.id).length }))}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="registros" name="Fichas Preenchidas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                            Preparando métricas...
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                    <Filter size={20} /> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>FILTROS HQ:</span>
                </div>
                
                <div style={{ width: '250px' }}>
                    <select value={filterFarm} onChange={(e) => setFilterFarm(e.target.value)} disabled={isRestricted}>
                        <option value="">Todas as Unidades (Farms)</option>
                        {data.farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>

                <div style={{ width: '200px' }}>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>
                
                <div style={{ flex: 1 }} />
                
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px' }}>
                    <button onClick={() => setActiveTab('sessions')} className={activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Monitoramento</button>
                    <button onClick={() => setActiveTab('audit')} className={activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Logs RLS</button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'sessions' ? (
                    <motion.div 
                        key="sessions"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="glass-panel"
                    >
                        <table className="agro-table">
                            <thead>
                                <tr>
                                    <th>Formulário / ID Rastreio</th>
                                    <th>Unidade Produtiva</th>
                                    <th>Data Coleta</th>
                                    <th>Status Operacional</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.sessions.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{s.formId}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>UID: {s.id}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{data.farms.find(f => f.id === s.farmId)?.name || s.farmId}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{format(new Date(s.date), 'dd/MM/yyyy')}</td>
                                        <td>
                                            <div className={`status-badge ${s.status === 'signed' ? 'validated' : 'open'}`}>
                                                {s.status === 'signed' ? 'ASSINADO' : 'EM ANDAMENTO'}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button className="btn-secondary" style={{ padding: '10px' }} onClick={() => navigate(`/admin/session/${s.id}`)} title="Ver Detalhes">
                                                    <Eye size={18} />
                                                </button>
                                                {s.status === 'signed' && (
                                                    <button className="btn-primary" style={{ padding: '10px' }} onClick={() => generatePDF(s.id)} title="Baixar PDF">
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="audit"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel" 
                        style={{ padding: '32px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <ShieldCheck size={24} color="var(--color-primary)" />
                            <div>
                                <h3 style={{ margin: 0 }}>Trilha de Auditoria (Immutable Logs)</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Registros de segurança e integridade de dados</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.auditLogs.map(log => (
                                <div key={log.id} style={{ padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span className="status-badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--color-primary)' }}>{log.action}</span>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{format(new Date(log.timestamp), 'dd/MM/yyyy • HH:mm:ss')}</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 500 }}>{log.details}</div>
                                    {log.reason && (
                                        <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--color-danger)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            <strong>Justificativa:</strong> {log.reason}
                                        </div>
                                    )}
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> Operador: {log.userId}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Dispositivo: {log.userAgent?.split(') ')[0]?.split('(')[1] || 'Web Browser'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const KPICard = ({ title, value, icon: Icon, color, detail }) => (
    <motion.div whileHover={{ y: -8, scale: 1.02 }} className="glass-panel" style={{ padding: '28px', borderLeft: `8px solid ${color}`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'rgba(0,0,0,0.03)' }}>
            <Icon size={48} strokeWidth={3} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--color-text-main)' }}>{value}</div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
                {detail}
            </div>
        </div>
    </motion.div>
);
