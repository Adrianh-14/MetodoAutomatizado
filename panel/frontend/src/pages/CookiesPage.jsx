import { useState, useEffect } from 'react';
import api from '../services/api';

const CookiesPage = () => {
  const [cookies, setCookies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [showDownload, setShowDownload] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [downloadCount, setDownloadCount] = useState(100);
  const [downloadCountry, setDownloadCountry] = useState('');
  
  const [uploadText, setUploadText] = useState('');
  const [uploadCountryCode, setUploadCountryCode] = useState('');
  const [uploadCountryName, setUploadCountryName] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchCookies();
  }, [page, filterCountry, filterStatus]);

  const fetchCountries = async () => {
    try {
      const res = await api.get('/cookies/countries');
      setCountries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCookies = async () => {
    setLoading(true);
    try {
      let url = `/cookies?page=${page}&limit=15`;
      if (filterCountry) url += `&country=${filterCountry}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      
      const res = await api.get(url);
      setCookies(res.data.cookies);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.post('/cookies/download', {
        quantity: parseInt(downloadCount),
        countryCode: downloadCountry || undefined
      });
      
      const data = res.data.cookies.join('\n');
      const blob = new window.Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `millonesgang_cookies_${downloadCountry || 'all'}_${res.data.count}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowDownload(false);
      fetchCookies(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Download failed');
    }
  };

  const handleUpload = async () => {
    if (!uploadText.trim() || !uploadCountryCode || !uploadCountryName) {
      alert('Please fill all fields');
      return;
    }

    setUploadLoading(true);
    try {
      const cookiesArray = uploadText.split('\n').filter(c => c.trim().length > 0);
      await api.post('/cookies', {
        cookies: cookiesArray,
        countryCode: uploadCountryCode,
        countryName: uploadCountryName
      });
      
      setShowUpload(false);
      setUploadText('');
      setPage(1);
      fetchCookies();
      fetchCountries();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">BÓVEDA_DATOS // COOKIES</h1>
          <p className="page-subtitle">Gestionar y extraer cadenas de cookies encriptadas</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowUpload(true)} className="btn btn-cyan">
            + INYECTAR_DATOS
          </button>
          <button onClick={() => setShowDownload(true)} className="btn btn-primary">
            EXTRAER_DATOS
          </button>
        </div>
      </header>

      <div className="card">
        <div className="filters-bar">
          <div className="input-group">
            <label className="input-label">FILTRO_GEOLOCALIZACIÓN</label>
            <select 
              className="input" 
              value={filterCountry} 
              onChange={e => { setFilterCountry(e.target.value); setPage(1); }}
            >
              <option value="">TODAS_LAS_REGIONES</option>
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.available} disp)</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">FILTRO_ESTADO</label>
            <select 
              className="input" 
              value={filterStatus} 
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">TODOS_LOS_ESTADOS</option>
              <option value="available">DISPONIBLE</option>
              <option value="downloaded">EXTRAÍDO</option>
            </select>
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
                    <th>HASH_ID</th>
                    <th>REGIÓN</th>
                    <th>CARGA_DATOS</th>
                    <th>ESTADO</th>
                    <th>MARCA_DE_TIEMPO</th>
                  </tr>
                </thead>
                <tbody>
                  {cookies.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>NO_SE_ENCONTRARON_REGISTROS</td>
                    </tr>
                  ) : (
                    cookies.map(cookie => (
                      <tr key={cookie.id}>
                        <td style={{ color: 'var(--neon-magenta)' }}>...{cookie.id.slice(-8)}</td>
                        <td>{cookie.countryCode} - {cookie.countryName}</td>
                        <td>
                          <div className="cookie-text">{cookie.cookieData}</div>
                        </td>
                        <td>
                          <span className={`badge ${cookie.status === 'available' ? 'badge-available' : 'badge-downloaded'}`}>
                            {cookie.status === 'available' ? 'DISPONIBLE' : 'EXTRAÍDO'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(cookie.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>ANT</button>
                  <span className="pagination-info">PÁGINA {page} DE {totalPages} ({totalRecords} total)</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>SIG</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Download Modal */}
      {showDownload && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">RUTINA_EXTRACCIÓN_DATOS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">CANTIDAD_OBJETIVO</label>
                <input 
                  type="number" 
                  className="input" 
                  value={downloadCount} 
                  onChange={e => setDownloadCount(e.target.value)} 
                  min="1" max="10000"
                />
              </div>
              <div className="input-group">
                <label className="input-label">REGIÓN_ESPECÍFICA (OPCIONAL)</label>
                <select 
                  className="input" 
                  value={downloadCountry} 
                  onChange={e => setDownloadCountry(e.target.value)}
                >
                  <option value="">CUALQUIER_REGIÓN</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.available} disp)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDownload(false)}>CANCELAR</button>
              <button className="btn btn-primary" onClick={handleDownload}>EJECUTAR_EXTRACCIÓN</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '600px' }}>
            <h2 className="modal-title" style={{ color: 'var(--neon-cyan)' }}>PROTOCOLO_INYECCIÓN_DATOS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">CÓDIGO_PAÍS (ISO 2)</label>
                  <input type="text" className="input" placeholder="US" maxLength="2" value={uploadCountryCode} onChange={e => setUploadCountryCode(e.target.value.toUpperCase())} />
                </div>
                <div className="input-group" style={{ flex: 2 }}>
                  <label className="input-label">NOMBRE_PAÍS</label>
                  <input type="text" className="input" placeholder="United States" value={uploadCountryName} onChange={e => setUploadCountryName(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">PAYLOAD_RAW (UNA POR LÍNEA)</label>
                <textarea 
                  className="upload-textarea" 
                  placeholder="Inserta los strings de cookies aquí..."
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowUpload(false)} disabled={uploadLoading}>ABORTAR</button>
              <button className="btn btn-cyan" onClick={handleUpload} disabled={uploadLoading}>
                {uploadLoading ? 'INYECTANDO...' : 'INICIAR_INYECCIÓN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookiesPage;
