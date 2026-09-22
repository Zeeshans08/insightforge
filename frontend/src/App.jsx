import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import DataUploader from './components/DataUploader';
import DataProfileCard from './components/DataProfileCard';
import DataCleaner from './components/DataCleaner';
import EDADashboard from './components/EDADashboard';
import AgentChat from './components/AgentChat';
import AdminDashboard from './components/AdminDashboard';
import { API_BASE_URL } from './config';

export default function App() {
  const [activeDataset, setActiveDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cleanReport, setCleanReport] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Route & Auth State
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'workspace';
  });
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('insightforge_admin_token') || '';
  });

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('workspace');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    if (path.startsWith('/admin')) {
      setCurrentView('admin');
    } else {
      setCurrentView('workspace');
    }
  };

  const handleAdminLoginSuccess = (token) => {
    localStorage.setItem('insightforge_admin_token', token);
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('insightforge_admin_token');
    setAdminToken('');
  };

  // Load pre-packaged sales demo dataset
  const handleLoadDemo = async () => {
    setIsLoading(true);
    navigateTo('/');
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo`);
      const data = await res.json();
      if (res.ok) {
        setActiveDataset({ dataset_id: data.dataset_id, profile: data.profile });
        setCleanReport(null);
      }
    } catch (err) {
      console.error('Failed to load demo dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload user file
  const handleFileUpload = async (file) => {
    setIsLoading(true);
    navigateTo('/');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setActiveDataset({ dataset_id: data.dataset_id, profile: data.profile });
        setCleanReport(null);
        setShowUploadModal(false);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveDataset(null);
    setCleanReport(null);
    setShowUploadModal(false);
    navigateTo('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        activeDataset={activeDataset?.profile} 
        onSelectDemo={handleLoadDemo}
        onReset={handleReset}
        currentView={currentView}
        onGoUserWorkspace={() => navigateTo('/')}
      />

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {currentView === 'admin' ? (
          adminToken ? (
            <AdminDashboard 
              API_BASE_URL={API_BASE_URL} 
              adminToken={adminToken} 
              onLogout={handleAdminLogout} 
            />
          ) : (
            <AdminLogin 
              API_BASE_URL={API_BASE_URL} 
              onLoginSuccess={handleAdminLoginSuccess} 
            />
          )
        ) : !activeDataset ? (
          <div>
            <LandingHero 
              onSelectDemo={handleLoadDemo} 
              onUploadClick={() => setShowUploadModal(true)} 
            />
            {showUploadModal && (
              <DataUploader 
                onFileUpload={handleFileUpload} 
                onSelectDemo={handleLoadDemo} 
                isLoading={isLoading} 
              />
            )}
          </div>
        ) : (
          <div>
            {/* Dataset Profile Metric Header */}
            <DataProfileCard profile={activeDataset.profile} />

            {/* 1-Click Data Cleaning */}
            <DataCleaner 
              datasetId={activeDataset.dataset_id} 
              onCleanCompleted={(report, updatedProfile) => {
                setCleanReport(report);
                if (updatedProfile) {
                  setActiveDataset(prev => ({ ...prev, profile: updatedProfile }));
                }
              }}
              cleanReport={cleanReport}
              API_BASE_URL={API_BASE_URL}
            />

            {/* Exploratory Data Analysis Dashboard */}
            <EDADashboard 
              datasetId={activeDataset.dataset_id} 
              API_BASE_URL={API_BASE_URL} 
            />

            {/* Transparent 4-Stage Agent Chat & Visual Recharts */}
            <AgentChat 
              datasetId={activeDataset.dataset_id} 
              API_BASE_URL={API_BASE_URL} 
            />
          </div>
        )}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#64748b',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <span>InsightForge Agentic Data Platform • Powered by Claude & Pandas Sandbox</span>
        <button 
          onClick={() => navigateTo('/admin')} 
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: '0.8rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Admin Gateway
        </button>
      </footer>
    </div>
  );
}
