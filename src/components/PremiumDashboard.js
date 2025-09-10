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
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', name: '홈', icon: '', premium: false },
    { id: 'learn', name: ' 학습', icon: '', premium: true },
    { id: 'profile', name: '도서관', icon: '', premium: true },
    { id: 'question-packs', name: '문재 팩', icon: '', premium: true },
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
      case 'overview':
        return renderOverview();
      case 'learn':
        return <LearnTab />;
      case 'profile':
        return <ProfilePage />;
      case 'question-packs':
        return <QuestionPackPage />;
      default:
        return renderOverview();
    }
  };


const renderOverview = () => (
  <div style={{ height: '100%', padding: '2rem' }}>
    {/* Welcome Header */}
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.5)', 
      backdropFilter: 'blur(10px)',
      padding: '2.5rem', 
      border: '1px solid #a8dcc6',
      marginBottom: '2rem',
      borderRadius: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            color: '#1e293b', 
            fontSize: '2.5rem', 
            fontWeight: '800',
            letterSpacing: '-0.02em' 
          }}>
            Welcome Back! 👋
          </h1>
          <p style={{ 
            margin: '0', 
            color: '#64748b', 
            fontSize: '1.125rem',
            fontWeight: '400' 
          }}>
            Access your library, create question packs, and track your learning progress
          </p>
        </div>
        
        {!isPaidUser && (
          <button 
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
            }}
          >
            ✨ Upgrade to Premium
          </button>
        )}
      </div>
    </div>

    {/* Feature Grid */}
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.5)', 
      backdropFilter: 'blur(10px)',
      borderRadius: '16px', 
      padding: '2.5rem', 
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
      border: '1px solid #a8dcc6'
    }}>
      <h2 style={{ 
        margin: '0 0 2rem 0', 
        color: '#1e293b', 
        fontSize: '1.5rem', 
        fontWeight: '700',
        letterSpacing: '-0.01em' 
      }}>
        Quick Access
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {sections.filter(s => s.id !== 'overview').map(section => {
          const getIconUrl = (sectionId) => {
            switch (sectionId) {
              case 'learn':
                return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook.svg?alt=media&token=8f21ae0e-764d-4b03-ba1d-f1423329c325';
              case 'profile':
                return 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084';
              case 'question-packs':
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
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(168, 220, 198, 0.5)',
                borderRadius: '16px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                if (!(section.premium && !isPaidUser)) {
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(168, 220, 198, 0.5)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={getIconUrl(section.id)} 
                    alt={section.name}
                    style={{ 
                      width: '32px', 
                      height: '32px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <h3 style={{ 
                  margin: '0', 
                  color: '#1e293b', 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  letterSpacing: '-0.01em' 
                }}>
                  {section.name}
                </h3>
                {section.premium && !isPaidUser && (
                  <span style={{ marginLeft: 'auto', fontSize: '1.125rem', opacity: 0.6 }}>🔒</span>
                )}
              </div>
              
              <p style={{ 
                margin: '0', 
                color: '#64748b', 
                fontSize: '0.95rem', 
                lineHeight: '1.6',
                fontWeight: '400' 
              }}>
                {getFeatureDescription(section.id)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

  const renderUpgradePrompt = () => (
    <div className="upgrade-prompt">
      <div className="upgrade-content">
        <div className="upgrade-icon">🔒</div>
        <h2>프리미엄</h2>
        <p>구독</p>
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
      case 'learn':
        return 'Weekly curated content with question packs, videos, and vocabulary';
      case 'profile':
        return 'Practise timed question packs, review, and watch video solutions';
      case 'question-packs':
        return '문재은행';
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

      {/* Sleek Left Sidebar */}
      <nav className="modern-sidebar">
        <div className="sidebar-tabs">
          {sections.map(section => {
            const getTabIcon = (sectionId) => {
              switch (sectionId) {
                case 'overview': return '🏠';
                case 'learn': return '📚';
                case 'profile': return '📖';
                case 'question-packs': return '💡';
                default: return '•';
              }
            };

            return (
              <button
                key={section.id}
                className={`sidebar-tab ${activeSection === section.id ? 'active' : ''} 
                           ${section.premium && !isPaidUser ? 'locked' : ''}`}
                onClick={() => handleSectionClick(section.id, section.premium)}
                title={section.name}
              >
                <span className="tab-icon">{getTabIcon(section.id)}</span>
                <span className="tab-label">{section.name}</span>
                {section.premium && !isPaidUser && (
                  <span className="lock-indicator">🔒</span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {(user.displayName || 'U')[0].toUpperCase()}
          </div>
          <div className="plan-indicator" title={planInfo.name}>
            {isPaidUser ? '👑' : '🔓'}
          </div>
        </div>
      </nav>

      {/* Full-width Main Content */}
      <main className="fullwidth-main">
        {renderSectionContent()}
      </main>

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
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
          margin: 0;
          padding: 0;
          overflow: hidden;
          display: flex;
        }

        /* Modern Sleek Sidebar */
        .modern-sidebar {
          width: 80px;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .modern-sidebar:hover {
          width: 200px;
        }

        .sidebar-tabs {
          flex: 1;
          padding: 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-tab {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          margin: 0 0.75rem;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          font-size: 0.875rem;
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .sidebar-tab::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 12px;
        }

        .sidebar-tab:hover::before {
          opacity: 1;
        }

        .sidebar-tab:hover {
          color: rgba(255, 255, 255, 0.9);
          transform: translateX(4px);
        }

        .sidebar-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transform: translateX(4px);
        }

        .sidebar-tab.active:hover {
          transform: translateX(4px);
        }

        .sidebar-tab.locked {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sidebar-tab.locked:hover {
          transform: none;
          color: rgba(255, 255, 255, 0.6);
        }

        .tab-icon {
          font-size: 1.25rem;
          min-width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tab-label {
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          transform: translateX(-10px);
        }

        .modern-sidebar:hover .tab-label {
          opacity: 1;
          transform: translateX(0);
        }

        .lock-indicator {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-left: auto;
        }

        .sidebar-user {
          padding: 1.5rem 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .plan-indicator {
          font-size: 1.125rem;
          opacity: 0.8;
          transition: all 0.3s ease;
        }

        .plan-indicator:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        /* Full-width Main Content */
        .fullwidth-main {
          flex: 1;
          margin-left: 80px;
          height: 100vh;
          overflow-y: auto;
          transition: margin-left 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        @media (min-width: 768px) {
          .premium-dashboard:hover .fullwidth-main {
            margin-left: 200px;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .modern-sidebar {
            width: 60px;
          }
          
          .modern-sidebar:hover {
            width: 60px;
          }
          
          .tab-label {
            display: none;
          }
          
          .fullwidth-main {
            margin-left: 60px;
          }
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