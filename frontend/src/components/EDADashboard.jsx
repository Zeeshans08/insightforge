import React, { useState, useEffect } from 'react';
import { BarChart2, PieChart, Activity, AlertCircle, RefreshCw } from 'lucide-react';

export default function EDADashboard({ datasetId, API_BASE_URL }) {
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (datasetId) {
      fetchEDA();
    }
  }, [datasetId]);

  const fetchEDA = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/eda/${datasetId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEdaData(data);
      }
    } catch (err) {
      console.error('Failed to fetch EDA:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={24} className="pulsing-glow" style={{ marginBottom: '0.5rem' }} />
        <p>Computing Exploratory Data Analysis (EDA)...</p>
      </div>
    );
  }

  if (!edaData) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Automated EDA (Exploratory Data Analysis)</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Statistical summaries, categorical breakdowns, correlations, and outlier alerts</span>
        </div>
      </div>

      {/* Numeric Columns Summary Table */}
      {edaData.numeric_summary && Object.keys(edaData.numeric_summary).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#a5b4fc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={16} /> Numeric Column Summary Statistics
          </h4>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#cbd5e1' }}>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Column Name</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Mean</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Median</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Min</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Max</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Std Dev</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(edaData.numeric_summary).map(([col, stats], idx) => (
                  <tr key={col} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600, color: '#f8fafc' }}>{col}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{stats.mean}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{stats.median}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{stats.min}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{stats.max}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{stats.std}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Categorical Breakdown Grid */}
      {edaData.categorical_summary && Object.keys(edaData.categorical_summary).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#a5b4fc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <PieChart size={16} /> Top Categorical Distributions
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {Object.entries(edaData.categorical_summary).map(([col, topVals]) => (
              <div key={col} className="glass-card">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '0.5rem' }}>
                  {col}
                </span>
                {Object.entries(topVals).map(([val, count]) => (
                  <div key={val} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    <span>{val || 'Unknown'}</span>
                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{count}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outliers Alert Badge */}
      {edaData.outliers_detected && Object.keys(edaData.outliers_detected).length > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fcd34d', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            <AlertCircle size={18} /> Statistical Outliers Flagged (IQR Method)
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            {Object.entries(edaData.outliers_detected).map(([col, count]) => (
              <span key={col} className="badge badge-amber" style={{ marginRight: '0.5rem', marginTop: '0.25rem' }}>
                {col}: {count} outlier(s)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
