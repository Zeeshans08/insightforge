import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  HardDrive, 
  Hash, 
  Trash2, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Terminal,
  Activity,
  Zap,
  LogOut
} from 'lucide-react';

export default function AdminDashboard({ API_BASE_URL, adminToken, onLogout }) {
  const [stats, setStats] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('datasets'); // 'datasets' | 'sessions'
  const [deletingId, setDeletingId] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [adminToken]);

  const fetchAdminData = async () => {
    setLoading(true);
    const headers = { 'X-Admin-Token': adminToken || '' };

    try {
      const [statsRes, datasetsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/datasets`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/sessions`, { headers })
      ]);

      if (statsRes.status === 401 || datasetsRes.status === 401 || sessionsRes.status === 401) {
        onLogout();
        return;
      }

      if (statsRes.ok) setStats(await statsRes.json());
      if (datasetsRes.ok) {
        const dData = await datasetsRes.json();
        setDatasets(dData.datasets || []);
      }
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        setSessions(sData.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async (datasetId, filename) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${filename}"? This will remove its files and query logs.`)) {
      return;
    }

    setDeletingId(datasetId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/dataset/${datasetId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': adminToken || '' }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        setActionMsg(`Successfully deleted dataset: ${filename}`);
        fetchAdminData();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={28} className="pulsing-glow" style={{ marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.1rem' }}>Loading InsightForge Admin Telemetry...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* Admin Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                Private Admin Portal
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                System Telemetry, Storage Management, & Agent Audit Logs
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-emerald" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <Zap size={14} /> AI Model: {stats?.model_name || 'Claude 3.5 Sonnet'}
            </span>
            <button className="btn btn-secondary" onClick={fetchAdminData} style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={onLogout} style={{ fontSize: '0.85rem', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {actionMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#6ee7b7',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} /> {actionMsg}
          </div>
        )}
      </div>

      {/* System Metrics Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Datasets</span>
            <Database size={18} color="#818cf8" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.total_datasets || 0}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Rows Processed</span>
            <Hash size={18} color="#c084fc" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.total_rows_processed ? stats.total_rows_processed.toLocaleString() : 0}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Agent Queries</span>
            <Cpu size={18} color="#34d399" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.total_queries_executed || 0}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DB Size</span>
            <HardDrive size={18} color="#fbbf24" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.db_size_mb || 0} MB
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>API Status</span>
            <Activity size={18} color="#f43f5e" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: stats?.api_key_loaded ? '#10b981' : '#f43f5e',
              boxShadow: stats?.api_key_loaded ? '0 0 8px #10b981' : 'none'
            }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              {stats?.api_key_loaded ? 'Connected' : 'Missing Key'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn ${activeTab === 'datasets' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('datasets')}
          style={{ fontSize: '0.9rem' }}
        >
          <FileSpreadsheet size={16} /> Datasets Registry ({datasets.length})
        </button>

        <button
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sessions')}
          style={{ fontSize: '0.9rem' }}
        >
          <Terminal size={16} /> Agent Query Audit Logs ({sessions.length})
        </button>
      </div>

      {/* Datasets Table */}
      {activeTab === 'datasets' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="#818cf8" /> Registered Datasets Registry
          </h3>

          {datasets.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
              No datasets found in database.
            </p>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#a5b4fc' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Filename</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Dataset ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Rows / Cols</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Clean Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Queries Run</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Created At</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d, idx) => (
                    <tr key={d.id} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                        {d.filename}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {d.id}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                        {d.row_count} rows / {d.col_count} cols
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {d.cleaned_path ? (
                          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Cleaned</span>
                        ) : (
                          <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>Raw</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontWeight: 600 }}>
                        {d.session_count || 0}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {d.created_at ? new Date(d.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <a 
                            href={`${API_BASE_URL}/api/download-cleaned/${d.id}`}
                            download
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="Download Cleaned Dataset"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDeleteDataset(d.id, d.filename)}
                            disabled={deletingId === d.id}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                            title="Delete Dataset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Agent Sessions Audit Logs */}
      {activeTab === 'sessions' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} color="#c084fc" /> Agent Execution Audit Logs
          </h3>

          {sessions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
              No query sessions recorded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sessions.map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${s.status === 'success' ? 'badge-emerald' : 'badge-amber'}`}>
                        {s.status || 'success'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Dataset: <strong style={{ color: '#f8fafc' }}>{s.dataset_filename || s.dataset_id}</strong>
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
                    Q: "{s.question}"
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    <strong>Answer:</strong> {s.final_answer}
                  </div>

                  {s.code_executed && (
                    <div style={{
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: '#a5b4fc',
                      overflowX: 'auto'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Executed Sandbox Python Code:
                      </div>
                      <pre style={{ margin: 0 }}>{s.code_executed}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
