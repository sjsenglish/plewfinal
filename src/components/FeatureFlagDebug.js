// Feature Flag Debug Component
// This component displays the current feature flag status for development/testing
import React from 'react';
import { getActiveFeatureFlags } from '../config/featureFlags';

const FeatureFlagDebug = ({ user }) => {
  // Only show in development mode or with debug URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const showDebug = process.env.NODE_ENV === 'development' || urlParams.get('debugFeatures') === 'true';
  
  if (!showDebug) return null;
  
  const flags = getActiveFeatureFlags(user);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px' }}>
        🚀 Feature Flags
      </div>
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: flags.applicationBuilder ? '#4ade80' : '#ef4444' }}>
          {flags.applicationBuilder ? '✓' : '✗'} Application Builder
        </span>
      </div>
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: flags.studyBuddy ? '#4ade80' : '#ef4444' }}>
          {flags.studyBuddy ? '✓' : '✗'} Study Buddy
        </span>
      </div>
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: flags.gradePersonalStatement ? '#4ade80' : '#ef4444' }}>
          {flags.gradePersonalStatement ? '✓' : '✗'} Grade Personal Statement
        </span>
      </div>
      {flags.isTestUser && (
        <div style={{ marginBottom: '4px', color: '#fbbf24' }}>
          ⚡ Test User Mode
        </div>
      )}
      {Object.keys(flags.urlParams).length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
          <div style={{ marginBottom: '4px', opacity: 0.7 }}>URL Params:</div>
          {Object.entries(flags.urlParams).map(([key, value]) => (
            <div key={key} style={{ marginLeft: '8px', opacity: 0.7 }}>
              {key}: {value}
            </div>
          ))}
        </div>
      )}
      {user?.email && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)', opacity: 0.7 }}>
          User: {user.email}
        </div>
      )}
    </div>
  );
};

export default FeatureFlagDebug;