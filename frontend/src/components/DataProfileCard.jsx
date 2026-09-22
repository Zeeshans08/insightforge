import React from 'react';
import { Database, Columns, Hash, AlertTriangle, Table } from 'lucide-react';

export default function DataProfileCard({ profile }) {
  if (!profile) return null;

  const totalMissing = profile.missing_values 
    ? Object.values(profile.missing_values).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Dataset Profile</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{profile.filename}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Total Rows</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{profile.rows}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Total Columns</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{profile.columns}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Missing Values</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: totalMissing > 0 ? '#f59e0b' : '#10b981' }}>
            {totalMissing}
          </span>
        </div>
      </div>

      {/* Sample Data Table Preview */}
      {profile.sample_rows && profile.sample_rows.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={16} /> Sample Rows Preview (First 5 Rows)
          </h4>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {profile.column_names.map((col) => (
                    <th key={col} style={{ padding: '0.6rem 0.8rem', color: '#a5b4fc', fontWeight: 600 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.sample_rows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)' }}>
                    {profile.column_names.map((col) => (
                      <td key={col} style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>
                        {row[col] !== "" && row[col] !== null ? String(row[col]) : <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
