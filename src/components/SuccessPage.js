// src/components/SuccessPage.js - Handle post-payment success for programmatic checkout
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePaywall } from '../hooks/usePaywall';

const SuccessPage = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = usePaywall();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check if user is logged in
        if (!user) {
          setStatus('error');
          setMessage('Please log in to verify your payment.');
          setLoading(false);
          return;
        }

        // Get session ID from URL parameters
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setStatus('error');
          setMessage('Invalid payment session. Please contact support if you completed a payment.');
          setLoading(false);
          return;
        }

        console.log('✅ Payment completed with session ID:', sessionId);

        // Wait a moment for webhook to process
        setTimeout(async () => {
          // Refresh subscription data to check if webhook processed the payment
          await refreshSubscription();
          
          setStatus('success');
          setMessage('Payment successful! Your premium subscription is now active.');
          setLoading(false);
          
          // Redirect to main page after showing success message
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }, 2000);

      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage('Unable to verify payment. Please contact support if you completed a payment.');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [user, searchParams, navigate, refreshSubscription]);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1"/>
            <path d="M16 24l6 6 12-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1"/>
            <path d="M16 16l16 16M32 16l-16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        padding: '48px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          color: getStatusColor(),
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {getStatusIcon()}
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          letterSpacing: '-0.5px'
        }}>
          {status === 'success' ? 'Payment Successful!' : 
           status === 'error' ? 'Payment Issue' : 
           'Processing Payment...'}
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '0 0 32px 0',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {status === 'success' && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#10b981',
              margin: 0
            }}>
              You now have access to all premium features. Redirecting you to the main page...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#ef4444',
              margin: '0 0 12px 0'
            }}>
              If you completed a payment, please contact support:
            </p>
            <a 
              href="mailto:team@plew.co.kr"
              style={{
                color: '#ef4444',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              team@plew.co.kr
            </a>
          </div>
        )}

        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5046e4';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#6366f1';
          }}
        >
          Return to Home
        </button>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SuccessPage;