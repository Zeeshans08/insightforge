import React from 'react';
import { Sparkles, Database, LayoutDashboard, Zap, RefreshCw } from 'lucide-react';

export default function Navbar({ activeDataset, onSelectDemo, onReset, currentView, onGoUserWorkspace }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={onReset}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>
            Insight<span style={{ color: '#8b5cf6' }}>Forge</span>
          </h1>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
            AGENTIC DATA INTELLIGENCE
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentView === 'admin' ? (
          <button className="btn btn-primary" onClick={onGoUserWorkspace} style={{ fontSize: '0.85rem' }}>
            <LayoutDashboard size={16} /> User Workspace
          </button>
        ) : (
          <>
            {activeDataset ? (
              <div className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                <Database size={14} /> Active: {activeDataset.filename || 'Dataset'}
              </div>
            ) : (
              <div className="badge badge-indigo">
                <Zap size={14} /> 4-Stage Agent Active
              </div>
            )}

            <button className="btn btn-secondary" onClick={onSelectDemo} style={{ fontSize: '0.85rem' }}>
              <Sparkles size={16} color="#a5b4fc" /> Try 1-Click Demo
            </button>

            {activeDataset && (
              <button className="btn btn-secondary" onClick={onReset} style={{ padding: '0.5rem 0.75rem' }} title="Reset Workspace">
                <RefreshCw size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
