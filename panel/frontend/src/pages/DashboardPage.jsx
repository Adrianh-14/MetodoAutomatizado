import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, countriesRes, activityRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/countries'),
          api.get('/dashboard/activity?limit=5')
        ]);
        
        setStats(statsRes.data);
        // Only show top 10 countries in chart to avoid overcrowding
        setCountries(countriesRes.data.slice(0, 10));
        setActivity(activityRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(10,10,18,0.95)', border: '1px solid var(--neon-green)', padding: '10px', borderRadius: '4px' }}>
          <p style={{ color: 'var(--neon-green)', margin: 0, fontFamily: 'var(--font-mono)' }}>{label}</p>
          <p style={{ color: '#fff', margin: '4px 0 0', fontSize: '12px' }}>Total: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in">
      <header className="page-header">
        <h1 className="page-title">VISTA_GENERAL</h1>
        <p className="page-subtitle">Métricas en tiempo real y análisis de operaciones</p>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{stats?.totalCookies?.toLocaleString()}</div>
          <div className="stat-label">TOTAL DE COOKIES EN BD</div>
        </div>
        <div className="card stat-card cyan">
          <div className="stat-value">{stats?.totalCountries?.toLocaleString()}</div>
          <div className="stat-label">PAÍSES DETECTADOS</div>
        </div>
        <div className="card stat-card amber">
          <div className="stat-value">{stats?.downloadedCookies?.toLocaleString()}</div>
          <div className="stat-label">COOKIES EXTRAÍDAS</div>
        </div>
        <div className="card stat-card magenta">
          <div className="stat-value">{stats?.todayCookies?.toLocaleString()}</div>
          <div className="stat-label">NUEVOS REGISTROS (HOY)</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <div className="card-header">
            <h2 className="card-title">TOP DISTRIBUCIÓN GEOGRÁFICA</h2>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countries} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="countryCode" stroke="var(--text-secondary)" tick={{fontFamily: 'var(--font-mono)', fontSize: 11}} />
                <YAxis stroke="var(--text-secondary)" tick={{fontFamily: 'var(--font-mono)', fontSize: 11}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,255,65,0.05)'}} />
                <Bar dataKey="total" fill="var(--neon-green)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">EXTRACCIONES RECIENTES</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>NO HAY ACTIVIDAD RECIENTE.</div>
            ) : (
              activity.map(log => (
                <div key={log.id} style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {log.user.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    Extrajo <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>{log.quantity}</span> cookies 
                    {log.countryCode && ` de ${log.countryName}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
