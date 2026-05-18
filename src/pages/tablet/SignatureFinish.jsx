import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signAndCloseSession, getSessionWithRecords } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { Save } from 'lucide-react';

export const SignatureFinish = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [haccpPassword, setHaccpPassword] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [session, setSession] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    getSessionWithRecords(sessionId).then(setSession);
  }, [sessionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 160 * window.devicePixelRatio;
    canvas.style.height = '160px';
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
  }, []);

  const getCanvasContext = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    return ctx;
  };


  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = getCanvasContext();
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left), (clientY - rect.top));
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo((clientX - rect.left), (clientY - rect.top));
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e && e.cancelable) e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSign = async () => {
    if (isEmpty) {
        alert("Por favor, realize a assinatura digital antes de fechar o documento.");
        return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    try {
      await signAndCloseSession(user.id, sessionId, data, haccpPassword);
      navigate('/forms');
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => startDrawing(e);
    const handleTouchMove = (e) => draw(e);
    const handleTouchEnd = (e) => stopDrawing(e);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing]);

  if (!session) return <div className="p-10 text-white animate-pulse">Carregando detalhes da sessão...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '24px' }}>Finalizar e Assinar — {session.form.title}</h2>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: 16, fontWeight: '600' }}>Assinatura digital:</div>
        <div style={{ border: '2px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ width: '100%', height: 160, display: 'block', cursor: 'crosshair', touchAction: 'none' }}
          />
        </div>
        
        {session.form.haccp && (
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8, color: 'red', fontWeight: 'bold' }}>
              [HACCP] Senha requerida para documentos críticos:
            </div>
            <input
              type="password"
              value={haccpPassword}
              onChange={e => setHaccpPassword(e.target.value)}
              placeholder="Digite a senha HACCP"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}
        
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleClear}>Limpar</button>
          <button className="btn-primary" onClick={handleSign}><Save size={14} /> Assinar e Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default SignatureFinish;
