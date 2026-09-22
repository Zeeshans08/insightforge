import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, CheckCircle2, AlertTriangle, Code, Terminal } from 'lucide-react';

export default function ReasoningTrace({ trace, codeExecuted, codeOutput }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!trace || trace.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.9)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '12px',
      marginBottom: '1.25rem',
      overflow: 'hidden'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(30, 41, 59, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="#818cf8" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
            Agent Transparent Reasoning Trace ({trace.length} Steps Executed)
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>Verified Execution</span>
        </div>
        {isOpen ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
      </div>

      {isOpen && (
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {trace.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '1rem',
                position: 'relative'
              }}>
                {/* Timeline connector dot */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: item.status === 'error' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: item.status === 'error' ? '#f43f5e' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  {item.step}
                </div>

                <div style={{ flex: 1, fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.stage}:</span>
                    <span style={{ color: '#cbd5e1' }}>{item.title}</span>
                  </div>

                  {/* Plan steps listing */}
                  {item.details && Array.isArray(item.details) && (
                    <ul style={{ paddingLeft: '1.2rem', margin: '0.4rem 0', color: '#94a3b8', fontSize: '0.83rem' }}>
                      {item.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  )}

                  {/* Code proposed or executed */}
                  {(item.code_proposed || item.code) && (
                    <div style={{ margin: '0.5rem 0', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#a5b4fc', overflowX: 'auto' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Code size={12} /> Safe Sandbox Code:
                      </div>
                      <pre style={{ margin: 0 }}>{item.code_proposed || item.code}</pre>
                    </div>
                  )}

                  {/* Code Output Summary */}
                  {item.output_summary && (
                    <div style={{ margin: '0.4rem 0', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#6ee7b7' }}>
                      <span style={{ fontWeight: 600 }}>Calculated Result:</span> {item.output_summary}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
