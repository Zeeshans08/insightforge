import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare, CheckCircle2, FileText, Download, RefreshCw } from 'lucide-react';
import ReasoningTrace from './ReasoningTrace';
import ChartRenderer from './ChartRenderer';

export default function AgentChat({ datasetId, API_BASE_URL }) {
  const [question, setQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState(null);

  const SUGGESTED_PROMPTS = [
    "Which country generated the highest revenue?",
    "Show product sales distribution as a bar chart",
    "Calculate median price and total quantity by category",
    "Are there any pricing anomalies or outliers?"
  ];

  const handleSendQuery = async (queryText) => {
    const activeQuestion = queryText || question;
    if (!activeQuestion.trim() || isQuerying) return;

    setIsQuerying(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, question: activeQuestion })
      });
      const data = await res.json();
      if (res.ok) {
        setResponse(data);
      }
    } catch (err) {
      console.error('Agent Query Error:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ask InsightForge Agent</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Multi-step planning, pandas tool execution, & self-correcting validation</span>
          </div>
        </div>

        {datasetId && (
          <a
            href={`${API_BASE_URL}/api/export-pdf/${datasetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Download size={15} /> Export PDF Report
          </a>
        )}
      </div>

      {/* Suggested Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {SUGGESTED_PROMPTS.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuestion(promptText);
              handleSendQuery(promptText);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.04)' }}
          >
            <MessageSquare size={13} color="#a5b4fc" /> {promptText}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask any analytical question in plain English (e.g. Which region sold the most units?)"
          disabled={isQuerying}
          style={{
            flex: 1,
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
        <button className="btn btn-primary" type="submit" disabled={isQuerying || !question.trim()}>
          {isQuerying ? <RefreshCw size={18} className="pulsing-glow" /> : <Send size={18} />}
          {isQuerying ? 'Analyzing...' : 'Ask Agent'}
        </button>
      </form>

      {/* Agent Response Content */}
      {response && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {/* Transparent Reasoning Trace */}
          <ReasoningTrace 
            trace={response.reasoning_trace} 
            codeExecuted={response.code_executed} 
            codeOutput={response.code_output} 
          />

          {/* Final Plain-English Answer */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.25rem'
          }}>
            <h4 style={{ fontSize: '1rem', color: '#a5b4fc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={18} color="#6366f1" /> Agent Verified Answer
            </h4>
            <p style={{ fontSize: '1.05rem', color: '#f8fafc', lineHeight: 1.6, marginBottom: response.key_metrics?.length ? '1rem' : 0 }}>
              {response.answer}
            </p>

            {/* Key Metrics Highlight Badges */}
            {response.key_metrics && response.key_metrics.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                {response.key_metrics.map((m, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '0.5rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>{m.label}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6ee7b7' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Recharts Visualization */}
          <ChartRenderer chartConfig={response.chart_config} />
        </div>
      )}
    </div>
  );
}
