import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu, ArrowRight, BarChart3, Database } from 'lucide-react';

export default function LandingHero({ onSelectDemo, onUploadClick }) {
  return (
    <div style={{ maxWidth: '1100px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
      <div className="badge badge-indigo" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
        <Sparkles size={16} /> Autonomous Data Intelligence Platform
      </div>

      <h1 style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
        Turn Messy Spreadsheets into <br />
        <span style={{
          background: 'linear-gradient(135deg, #a5b4fc, #6366f1, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Verified Answers & Interactive Visuals
        </span>
      </h1>

      <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
        No SQL queries. No complex Excel formulas. No manual chart building.
        Upload raw sales data or spreadsheets to receive instant auto-cleaning, automated EDA, and multi-step AI reasoning with visible execution traces.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3.5rem' }}>
        <button className="btn btn-primary" onClick={onSelectDemo} style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
          <Sparkles size={18} /> Launch 1-Click Demo Dataset <ArrowRight size={18} />
        </button>
        <button className="btn btn-secondary" onClick={onUploadClick} style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
          <Database size={18} /> Upload Your Spreadsheet
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        textAlign: 'left'
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Database size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f8fafc' }}>1-Click Auto Clean</h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Instantly removes duplicates, fills missing numeric & text values sensibly, and flags negative anomalies.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Cpu size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f8fafc' }}>Transparent 4-Stage Agent</h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Planner $\rightarrow$ Safe Python Sandbox $\rightarrow$ Validator $\rightarrow$ Synthesizer with collapsible reasoning trace.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BarChart3 size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f8fafc' }}>Interactive Recharts</h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Renders dynamic Bar, Line, Pie, and Scatter visualizations straight from verified Python execution.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldCheck size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f8fafc' }}>Executive PDF Reports</h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Export shareable, presentation-ready PDF executive summaries containing dataset stats and agent findings.
          </p>
        </div>
      </div>
    </div>
  );
}
