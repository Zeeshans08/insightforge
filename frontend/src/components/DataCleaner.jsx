import React, { useState } from 'react';
import { Wand2, CheckCircle2, Download, AlertCircle, RefreshCw } from 'lucide-react';

export default function DataCleaner({ datasetId, onCleanCompleted, cleanReport, API_BASE_URL }) {
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanClick = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/clean/${datasetId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onCleanCompleted(data.report, data.profile);
      }
    } catch (err) {
      console.error('Cleaning failed:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wand2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Data Sanitization & Cleaning</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Automated duplicate removal, missing value imputation, and anomaly flagging</span>
          </div>
        </div>

        {!cleanReport ? (
          <button className="btn btn-emerald" onClick={handleCleanClick} disabled={isCleaning}>
            {isCleaning ? <RefreshCw size={16} className="pulsing-glow" /> : <Wand2 size={16} />}
            {isCleaning ? 'Cleaning Data...' : 'Run 1-Click Auto Clean'}
          </button>
        ) : (
          <a 
            href={`${API_BASE_URL}/api/download-cleaned/${datasetId}`} 
            download
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Download size={15} /> Download Cleaned CSV
          </a>
        )}
      </div>

      {cleanReport && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginTop: '1rem'
        }}>
          <h4 style={{ fontSize: '0.95rem', color: '#6ee7b7', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> Data Cleaning Log Summary
          </h4>
          <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.88rem', color: '#cbd5e1' }}>
            {cleanReport.actions && cleanReport.actions.length > 0 ? (
              cleanReport.actions.map((act, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#10b981' }}>•</span> {act}
                </li>
              ))
            ) : (
              <li style={{ color: '#94a3b8' }}>No missing values or duplicates found. Data was already clean!</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
