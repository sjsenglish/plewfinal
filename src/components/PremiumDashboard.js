// components/PremiumDashboard.js
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { usePaywall } from '../hooks/usePaywall';
import { QuestionPackPage } from './QuestionPackPage';
import { ProfilePage } from './ProfilePage';
import SubscriptionPlansModal from './SubscriptionPlansModal';
import { Button } from './ui';
import LearnTab from './LearnTab';

const getCurrentTheme = () => {
  const appElement = document.querySelector('.app');
  if (appElement?.classList.contains('alternate-theme')) return 'plew';
  if (appElement?.classList.contains('maths-theme')) return 'maths';
  return 'tsa';
};

const PremiumDashboard = () => {
  // Check URL params to set initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'overview';
  
  const [activeSection, setActiveSection] = useState(initialTab);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const {
    subscription,
    usage,
    loading: paywallLoading,
    isPaidUser,
    getPlanInfo
  } = usePaywall();

  const planInfo = getPlanInfo();

  // Redirect if not logged in
  useEffect(() => {
    if (!paywallLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, paywallLoading]);

  if (paywallLoading || !user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto',
          }} />
          <div>loading...</div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', name: '홈', icon: '', premium: false },
    { id: 'learn', name: '학습', icon: '', premium: true },
    { id: 'profile', name: '도서관', icon: '', premium: true },
    { id: 'question-packs', name: '문재은행', icon: '', premium: true },
  ];

  const handleSectionClick = (sectionId, isPremiumSection) => {
    if (isPremiumSection && !isPaidUser) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveSection(sectionId);
  };

  const renderSectionContent = () => {
    if (!isPaidUser && ['learn', 'profile', 'question-packs'].includes(activeSection)) {
      return renderUpgradePrompt();
    }

    switch (activeSection) {
      case '홈':
        return renderOverview();
      case 'learn':
        return <LearnTab />;
      case '도서관':
        return <ProfilePage />;
      case '문재 팩 만들기':
        return <QuestionPackPage />;
      default:
        return renderOverview();
    }
  };


const renderOverview = () => (
  <div style={{ height: '100%' }}>
    {/* Simplified Header similar to ProfilePage */}
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.5)', 
      backdropFilter: 'blur(10px)',
      padding: '32px 24px', 
      border: '1px solid #a8dcc6',
      marginBottom: '24px',
      borderRadius: '12px',
      margin: '0 0 24px 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              color: '#1e293b', 
              fontSize: '2rem', 
              fontWeight: '700' 
            }}>
              Hi!
            </h1>
            <p style={{ 
              margin: '0', 
              color: '#64748b', 
              fontSize: '1rem' 
            }}>
              
            </p>
          </div>
          
          {!isPaidUser && (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              style={{
                padding: '12px 24px',
                background: '#d8f0ed',
                color: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#c4e9e0'}
              onMouseOut={(e) => e.target.style.background = '#d8f0ed'}
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Content matching ProfilePage style */}
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Feature Grid */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.5)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '12px', 
        padding: '32px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        border: '1px solid #a8dcc6',
        marginBottom: '24px' 
      }}>
        <h2 style={{ 
          margin: '0 0 24px 0', 
          color: '#1e293b', 
          fontSize: '1.25rem', 
          fontWeight: '600' 
        }}>
          
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {sections.filter(s => s.id !== 'overview').map(section => {
            const getIconUrl = (sectionId) => {
              switch (sectionId) {
                case '학습':
                  return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook.svg?alt=media&token=8f21ae0e-764d-4b03-ba1d-f1423329c325';
                case '프로필':
                  return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084';
                case '문제은행':
                  return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbulb.svg?alt=media&token=1f21ae0e-764d-4b03-ba1d-f1423329c325';
                default:
                  return '';
              }
            };

            return (
              <div 
                key={section.id}
                onClick={() => handleSectionClick(section.id, section.premium)}
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid #a8dcc6',
                  borderRadius: '12px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  if (!(section.premium && !isPaidUser)) {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#a8dcc6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img 
                    src={getIconUrl(section.id)} 
                    alt={section.name}
                    style={{ 
                      width: '50px', 
                      height: '50px',
                      objectFit: 'contain'
                    }}
                  />
                  <h3 style={{ 
                    margin: '0', 
                    color: '#1e293b', 
                    fontSize: '1.1rem', 
                    fontWeight: '600' 
                  }}>
                    {section.name}
                  </h3>
                </div>
                
                <p style={{ 
                  margin: '0', 
                  color: '#64748b', 
                  fontSize: '14px', 
                  lineHeight: '1.5' 
                }}>
                  {getFeatureDescription(section.id)}
                </p>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

  const renderUpgradePrompt = () => (
    <div className="upgrade-prompt">
      <div className="upgrade-content">
        <div className="upgrade-icon">🔒</div>
        <h2>프리미엄</h2>
        <p>구독하기</p>
        <button 
          className="upgrade-button"
          onClick={() => setShowUpgradeModal(true)}
        >
          구독하기
        </button>
      </div>
    </div>
  );

  const getFeatureDescription = (sectionId) => {
    switch (sectionId) {
      case '학습':
        return '귀하의 수준에 맞는 엄선된 코스를 따르세요';
      case '도서관':
        return '시간 문제 팩 풀기 연습하기';
      case '문재 팩 만들기':
        return '문재 팩 만들기';
      default:
        return '';
    }
  };

  return (
    <div className="premium-dashboard">
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <SubscriptionPlansModal onClose={() => setShowUpgradeModal(false)} />
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <nav className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
            <div className="user-info">
              <span className="user-name">{user.displayName || 'User'}</span>
              <span className="user-plan">{planInfo.name}</span>
            </div>
          </div>

          <ul className="sidebar-nav">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  className={`nav-item ${activeSection === section.id ? 'active' : ''} 
                             ${section.premium && !isPaidUser ? 'locked' : ''}`}
                  onClick={() => handleSectionClick(section.id, section.premium)}
                >
                  <span className="nav-icon">{section.icon}</span>
                  <span className="nav-text">{section.name}</span>
                  {section.premium && !isPaidUser && (
                    <span className="lock-icon">🔒</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          {renderSectionContent()}
        </main>
      </div>

      {/* Updated styles with gradient background */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        
        #root, #__next {
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
      <style jsx>{`
        .premium-dashboard {
          height: 100vh;
          background: linear-gradient(135deg, #b8e6d3 0%, #a8dcc6 20%, #d4edda 40%, #f0c5a0 60%, #f5b885 80%, #fad0c4 100%);
          position: relative;
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          overflow: hidden;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .premium-dashboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 15% 60%, rgba(168, 230, 207, 0.4) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(240, 197, 160, 0.4) 0%, transparent 45%),
            radial-gradient(circle at 45% 85%, rgba(212, 237, 218, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(250, 208, 196, 0.3) 0%, transparent 40%);
          pointer-events: none;
          animation: floatBackground 8s ease-in-out infinite;
        }

        @keyframes floatBackground {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-10px, -5px) scale(1.02);
          }
          66% {
            transform: translate(5px, -10px) scale(0.98);
          }
        }

        .dashboard-container {
          display: flex;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          height: 100vh;
        }

        .dashboard-sidebar {
          width: 280px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          border-right: 1px solid #a8dcc6;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid #a8dcc6;
        }

        .sidebar-header h2 {
          margin: 0 0 1.5rem 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .user-name {
          font-weight: 500;
          color: #475569;
        }

        .user-plan {
          font-size: 0.875rem;
          color: #64748b;
          padding: 0.25rem 0.5rem;
          background: rgba(241, 245, 249, 0.8);
          border-radius: 4px;
          display: inline-block;
        }

        .sidebar-nav {
          list-style: none;
          padding: 1rem 0;
          margin: 0;
        }

        .nav-item {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .nav-item:hover {
          background-color: rgba(248, 250, 252, 0.8);
        }

        .nav-item.active {
          background-color: #d8f0ed;
          color: #1e293b;
          font-weight: 600;
        }

        .nav-item.locked {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .nav-text {
          flex: 1;
          font-weight: 500;
        }

        .lock-icon {
          font-size: 0.875rem;
        }

        .dashboard-main {
          flex: 1;
          padding: 2rem;
          height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .dashboard-section {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          borderRadius: 12px;
          padding: 2rem;
          boxShadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #a8dcc6;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.875rem;
          font-weight: 700;
        }

        .section-header p {
          margin: 0;
          color: #64748b;
          font-size: 1.125rem;
        }

        .plan-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          borderRadius: 12px;
          margin-bottom: 2rem;
        }

        .plan-banner.free {
          background: linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(253, 230, 138, 0.9) 100%);
          border: 1px solid rgba(245, 158, 11, 0.5);
          backdrop-filter: blur(10px);
        }

        .plan-banner.premium {
          background: linear-gradient(135deg, rgba(221, 214, 254, 0.9) 0%, rgba(196, 181, 253, 0.9) 100%);
          border: 1px solid rgba(139, 92, 246, 0.5);
          backdrop-filter: blur(10px);
        }

        .plan-badge {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.875rem;
          padding: 0.25rem 0.75rem;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          margin-right: 1rem;
        }

        .upgrade-hint {
          color: #92400e;
          font-size: 0.875rem;
        }

        .usage-stats {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .usage-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .upgrade-btn {
          padding: 0.75rem 1.5rem;
          background: #d8f0ed;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upgrade-btn:hover {
          background: #c4e9e0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(5px);
          border: 1px solid #a8dcc6;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .feature-card.locked:hover {
          transform: none;
          border-color: #a8dcc6;
        }

        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .feature-title {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .feature-description {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .quick-stats {
          margin-top: 2rem;
        }

        .quick-stats h3 {
          margin: 0 0 1rem 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(5px);
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #a8dcc6;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #6366f1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
        }

        .upgrade-prompt {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .upgrade-content {
          text-align: center;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #a8dcc6;
        }

        .upgrade-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .upgrade-content h2 {
          margin: 0 0 1rem 0;
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .upgrade-content p {
          margin: 0 0 2rem 0;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.5;
        }

        .upgrade-button {
          padding: 0.75rem 2rem;
          background: #d8f0ed;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upgrade-button:hover {
          background: #c4e9e0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 95vw;
          max-height: 95vh;
          overflow-y: auto;
          margin: 1rem;
        }

        .quiz-dashboard-content {
          max-width: 100%;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PremiumDashboard;