import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle } from 'lucide-react';

export default function DataUploader({ onFileUpload, onSelectDemo, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setErrorMsg('Please upload a valid CSV or Excel spreadsheet (.csv, .xlsx, .xls)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit.');
      return;
    }
    setErrorMsg('');
    onFileUpload(file);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '2rem auto', padding: '0 1rem' }}>
      <div 
        className="glass-panel"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          border: dragActive ? '2px dashed var(--primary)' : '2px dashed rgba(255, 255, 255, 0.15)',
          background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Upload your Data Spreadsheet</h3>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
          Drag and drop your CSV or Excel file here, or browse files from your computer
        </p>

        <label className="btn btn-primary" style={{ cursor: 'pointer', marginBottom: '1.25rem' }}>
          <FileSpreadsheet size={18} /> {isLoading ? 'Processing File...' : 'Select CSV / Excel File'}
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            onChange={handleChange} 
            disabled={isLoading}
            style={{ display: 'none' }} 
          />
        </label>

        {errorMsg && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fda4af',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginTop: '1rem',
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Don't have a dataset ready?</span>
          <button className="btn btn-secondary" onClick={onSelectDemo} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <Sparkles size={15} color="#a5b4fc" /> Load Sample Sales Data
          </button>
        </div>
      </div>
    </div>
  );
}
