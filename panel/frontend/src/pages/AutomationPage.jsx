import { useState, useRef, useEffect } from 'react';
import { automationApi } from '../services/api';

const AutomationPage = () => {
  const [profiles, setProfiles] = useState(null);
  const [msg, setMsg] = useState('');
  const [threads, setThreads] = useState(3);
  const [loading, setLoading] = useState({ upload: false, msg: false, start: false, stop: false, login: false });
  const [status, setStatus] = useState({ upload: '', msg: '', start: '', login: '' });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const [serverProfiles, setServerProfiles] = useState(0);
  const [automationRunning, setAutomationRunning] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkStatus();
    const statusTimer = window.setInterval(checkStatus, 3000);
    return () => window.clearInterval(statusTimer);
  }, []);

  const api = async (endpoint, options = {}) => {
    const { timeoutMs = 15000, body, ...requestOptions } = options;

    try {
      const response = await automationApi.request({
        url: `/${endpoint}`,
        ...requestOptions,
        data: body,
        timeout: timeoutMs,
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('El servidor tardó demasiado en responder');
      }
      const responseError = error.response?.data;
      const message = typeof responseError === 'string' ? responseError : responseError?.error;
      throw new Error(message || error.message || 'Error de comunicación');
    }
  };

  const checkStatus = async () => {
    try {
      const data = await api('status');
      setServerOnline(true);
      setServerProfiles(data.profiles_loaded || 0);
      setAutomationRunning(Boolean(data.running || data.stopping));
    } catch {
      setServerOnline(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || fileInputRef.current?.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      setLoading(p => ({ ...p, upload: true }));
      setStatus(p => ({ ...p, upload: '' }));
      try {
        const data = await api('upload-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: text,
          timeoutMs: 120000,
        });
        setStatus(p => ({ ...p, upload: data.success ? `✅ ${data.count} perfiles cargados` : '❌ Error al cargar' }));
        if (data.success) { setProfiles(data.count); checkStatus(); }
      } catch (error) { setStatus(p => ({ ...p, upload: `❌ ${error.message}` })); }
      finally { setLoading(p => ({ ...p, upload: false })); }
    };
    reader.readAsText(file);
  };

  const handleSaveMsg = async () => {
    if (!msg.trim()) return;
    setLoading(p => ({ ...p, msg: true }));
    setStatus(p => ({ ...p, msg: '' }));
    try {
      const data = await api('update-message', {
        method: 'POST',
        body: JSON.stringify({ mensaje: msg }),
      });
      setStatus(p => ({ ...p, msg: data.success ? '✅ Mensaje guardado' : '❌ Error' }));
    } catch (error) { setStatus(p => ({ ...p, msg: `❌ ${error.message}` })); }
    finally { setLoading(p => ({ ...p, msg: false })); }
  };

  const openViewer = () => {
    const configuredViewerUrl = import.meta.env.VITE_AUTOMATION_VIEWER_URL;
    const viewerUrl = configuredViewerUrl || `http://${window.location.hostname}:6081/vnc.html?autoconnect=1&resize=scale&show_dot=true`;
    const viewerWindow = window.open(viewerUrl, 'mosivo-automation-viewer');
    viewerWindow?.focus();
  };

  const handleStart = async () => {
    openViewer();

    setLoading(p => ({ ...p, start: true }));
    setStatus(p => ({ ...p, start: '' }));
    try {
      const data = await api('iniciar-automatizacion', {
        method: 'POST',
        body: JSON.stringify({ threads }),
      });
      setStatus(p => ({ ...p, start: data.success ? `✅ Iniciado con ${threads} hilos` : '❌ Error' }));
      setAutomationRunning(Boolean(data.success));
    } catch (error) { setStatus(p => ({ ...p, start: `❌ ${error.message}` })); }
    finally { setLoading(p => ({ ...p, start: false })); }
  };

  const handleStop = async () => {
    setLoading(p => ({ ...p, stop: true }));
    setStatus(p => ({ ...p, start: '⏹ Deteniendo automatización...' }));
    try {
      const data = await api('detener-automatizacion', { method: 'POST' });
      setAutomationRunning(false);
      setStatus(p => ({ ...p, start: data.success ? `✅ ${data.message}` : '❌ No se pudo detener' }));
    } catch (error) {
      setStatus(p => ({ ...p, start: `❌ ${error.message}` }));
      checkStatus();
    } finally {
      setLoading(p => ({ ...p, stop: false }));
    }
  };

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) return;
    openViewer();

    setLoading(p => ({ ...p, login: true }));
    setStatus(p => ({ ...p, login: '⏳ Login humanizado en curso... mira el visor (tarda 1-2 min)' }));
    try {
      const data = await api('login-guilla', {
        method: 'POST',
        body: JSON.stringify({ user: loginUser.trim(), pass: loginPass.trim() }),
        timeoutMs: 180000,
      });
      setStatus(p => ({ ...p, login: data.success ? `✅ ${data.message}` : '❌ Error en el login' }));
      if (data.success) {
        setLoginPass('');
        checkStatus();
      }
    } catch (error) {
      setStatus(p => ({ ...p, login: `❌ ${error.message}` }));
    } finally {
      setLoading(p => ({ ...p, login: false }));
    }
  };

  const renderStatus = (text) => text ? (
    <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap',
      background: text.includes('✅') ? 'rgba(0,255,65,0.05)' : (text.includes('⏳') ? 'rgba(79,172,254,0.08)' : 'rgba(255,59,59,0.05)'),
      border: `1px solid ${text.includes('✅') ? 'rgba(0,255,65,0.2)' : (text.includes('⏳') ? 'rgba(79,172,254,0.3)' : 'rgba(255,59,59,0.2)')}`,
      color: text.includes('✅') ? 'var(--neon-green)' : (text.includes('⏳') ? 'var(--neon-cyan)' : 'var(--danger)')
    }}>{text}</div>
  ) : null;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,242,254,0.05), rgba(79,172,254,0.05))',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-green))',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>⚡</div>
            <h1 className="page-title" style={{ fontSize: '22px', margin: 0 }}>
              MOSIVO <span style={{ color: 'var(--neon-cyan)' }}>AUTO</span>
            </h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '12px' }}>
            Automatización de perfiles · Facebook
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '6px',
          border: `1px solid ${serverOnline ? 'rgba(0,255,65,0.3)' : 'rgba(255,59,59,0.3)'}`,
          background: serverOnline ? 'rgba(0,255,65,0.05)' : 'rgba(255,59,59,0.05)',
          fontSize: '11px', fontFamily: 'var(--font-mono)'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: serverOnline ? 'var(--neon-green)' : 'var(--danger)',
            boxShadow: serverOnline ? '0 0 8px var(--neon-green)' : '0 0 8px var(--danger)'
          }}></span>
          {serverOnline ? `${serverProfiles} perfiles` : 'SERVIDOR OFF'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* UPLOAD PROFILES */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📁 Subir Perfiles</h2>
          </div>
          <div
            className="upload-area"
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--neon-green)'; e.currentTarget.style.background = 'rgba(0,255,65,0.03)'; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>📄</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              Arrastra tu .txt aquí o haz clic
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
              formato: usuario:contraseña por línea
            </p>
            <input ref={fileInputRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFileDrop} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
            disabled={loading.upload} onClick={() => fileInputRef.current?.click()}>
            {loading.upload ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> CARGANDO...</> : '⬆ SELECCIONAR ARCHIVO'}
          </button>
          {status.upload && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)',
              background: status.upload.includes('✅') ? 'rgba(0,255,65,0.05)' : 'rgba(255,59,59,0.05)',
              border: `1px solid ${status.upload.includes('✅') ? 'rgba(0,255,65,0.2)' : 'rgba(255,59,59,0.2)'}`,
              color: status.upload.includes('✅') ? 'var(--neon-green)' : 'var(--danger)'
            }}>{status.upload}</div>
          )}
        </div>

        {/* MESSAGE CONFIG */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">✉ Mensaje a Reenviar</h2>
          </div>
          <textarea className="upload-textarea" rows="5" placeholder="Escribe aquí el mensaje..."
            value={msg} onChange={e => setMsg(e.target.value)} />
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
            disabled={loading.msg || !msg.trim()} onClick={handleSaveMsg}>
            {loading.msg ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> GUARDANDO...</> : '💾 GUARDAR MENSAJE'}
          </button>
          {status.msg && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)',
              background: status.msg.includes('✅') ? 'rgba(0,255,65,0.05)' : 'rgba(255,59,59,0.05)',
              border: `1px solid ${status.msg.includes('✅') ? 'rgba(0,255,65,0.2)' : 'rgba(255,59,59,0.2)'}`,
              color: status.msg.includes('✅') ? 'var(--neon-green)' : 'var(--danger)'
            }}>{status.msg}</div>
          )}
        </div>

        {/* EXECUTION OPTIONS */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🚀 Opciones de Ejecución</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              VENTANAS (HILOS):
            </label>
            <input type="number" className="input" value={threads}
              onChange={e => setThreads(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              min="1" max="10"
              style={{ width: '70px', textAlign: 'center', padding: '8px 12px', fontSize: '14px' }} />
          </div>
          <button className="btn" style={{
            width: '100%', justifyContent: 'center', padding: '16px', fontSize: '14px',
            background: 'linear-gradient(135deg, rgba(0,255,65,0.15), rgba(0,212,255,0.1))',
            border: '1px solid var(--neon-green)', color: 'var(--neon-green)'
          }} disabled={loading.start || loading.stop || automationRunning} onClick={handleStart}>
            {loading.start ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> INICIANDO...</>
            ) : '▶ INICIAR AUTOMATIZACIÓN'}
          </button>
          <button className="btn" style={{
            width: '100%', justifyContent: 'center', padding: '14px', fontSize: '13px', marginTop: '10px',
            background: 'rgba(255,59,59,0.08)', border: '1px solid var(--danger)', color: 'var(--danger)'
          }} disabled={loading.stop || loading.start || !automationRunning} onClick={handleStop}>
            {loading.stop ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> DETENIENDO...</>
            ) : '■ DETENER AUTOMATIZACIÓN'}
          </button>
          {status.start && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)',
              background: status.start.includes('✅') ? 'rgba(0,255,65,0.05)' : 'rgba(255,59,59,0.05)',
              border: `1px solid ${status.start.includes('✅') ? 'rgba(0,255,65,0.2)' : 'rgba(255,59,59,0.2)'}`,
              color: status.start.includes('✅') ? 'var(--neon-green)' : 'var(--danger)'
            }}>{status.start}</div>
          )}
        </div>

        {/* LOGIN INDIVIDUAL HUMANIZADO */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔑 Login Individual</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
            Pega el correo y contraseña de una cuenta para hacer login humanizado y guardar sus cookies.
          </p>
          <input type="text" className="input" placeholder="Correo o usuario"
            value={loginUser} onChange={e => setLoginUser(e.target.value)}
            style={{ width: '100%', marginBottom: '10px' }} />
          <input type="password" className="input" placeholder="Contraseña"
            value={loginPass} onChange={e => setLoginPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%' }} />
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
            disabled={loading.login || loading.start || automationRunning || !loginUser.trim() || !loginPass.trim()} onClick={handleLogin}>
            {loading.login ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> LOGUEANDO...</> : '🔓 INICIAR SESIÓN'}
          </button>
          {renderStatus(status.login)}
        </div>
      </div>
    </div>
  );
};

export default AutomationPage;
