// src/components/PaymentSuccess.js - Handle post-payment verification
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

        // Get pending subscription info from sessionStorage
        const pendingSubscription = sessionStorage.getItem('pendingSubscription');
        
        if (pendingSubscription) {
          const subscriptionInfo = JSON.parse(pendingSubscription);
          
          // Check if the session is recent (within 1 hour)
          const isRecentSession = (Date.now() - subscriptionInfo.timestamp) < (60 * 60 * 1000);
          
          if (isRecentSession && subscriptionInfo.userEmail === user.email) {
            console.log('Matching payment by email for user:', user.email);
            
            // Call our API to match the payment by email
            const response = await fetch('/api/match-payment-by-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                planType: 'tier1',
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log('Payment matched successfully:', result);
              
              setStatus('success');
              setMessage('🎉 Payment successful! Your premium access has been activated.');
              
              // Clear the pending subscription
              sessionStorage.removeItem('pendingSubscription');
              
              // Redirect to dashboard after 3 seconds
              setTimeout(() => {
                navigate('/');
              }, 3000);
            } else {
              console.error('Failed to match payment');
              setStatus('warning');
              setMessage('Payment received, but we need to verify your account. Please contact support if access is not granted within 5 minutes.');
            }
          } else {
            setStatus('warning');
            setMessage('Session expired or email mismatch. Please contact support for assistance.');
          }
        } else {
          // No pending subscription info, show generic success
          setStatus('success');
          setMessage('Thank you for your payment! If you don\'t see premium access within 5 minutes, please contact support.');
        }

      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage('There was an error verifying your payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    // Wait a moment for potential webhook processing
    const timer = setTimeout(verifyPayment, 2000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleContactSupport = () => {
    // You can implement your support contact method here
    alert('Please email support with your payment receipt for immediate assistance.');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '2rem'
        }} />
        <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>{message}</h2>
        <p style={{ color: '#6b7280' }}>Please wait while we confirm your subscription...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${status === 'success' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'}`
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          {status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌'}
        </div>
        
        <h1 style={{
          color: status === 'success' ? '#065f46' : status === 'warning' ? '#92400e' : '#991b1b',
          marginBottom: '1rem',
          fontSize: '1.5rem'
        }}>
          {status === 'success' ? 'Payment Successful!' : 
           status === 'warning' ? 'Payment Processing' : 
           'Verification Error'}
        </h1>
        
        <p style={{
          color: '#4b5563',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {message}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleGoHome}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Go to Home
          </button>
          
          {status !== 'success' && (
            <button
              onClick={handleContactSupport}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Contact Support
            </button>
          )}
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default PaymentSuccess;