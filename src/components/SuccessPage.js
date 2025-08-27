// src/components/SuccessPage.js - Simple version for Payment Links
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { updateUserSubscription } from '../services/subscriptionService';

const SuccessPage = () => {
  const [processing, setProcessing] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        console.log('🎉 Payment successful! Activating subscription...');
        
        // Get plan from URL
        const urlParams = new URLSearchParams(location.search);
        const plan = urlParams.get('plan') || 'study';

        if (!user) {
          alert('Please log in to complete your subscription');
          navigate('/login');
          return;
        }

        // Update user subscription in Firebase
        const subscriptionData = {
          status: 'active',
          plan: plan,
          activatedAt: new Date(),
          updatedAt: new Date()
        };

        console.log('Updating subscription for user:', user.uid, 'with plan:', plan);
        
        const result = await updateUserSubscription(user.uid, subscriptionData);

        if (result.success) {
          console.log('✅ Subscription activated!');
          
          // Show success message
          alert('🎉 Subscription activated! You now have unlimited access!');
          
          // Force reload the page to refresh all state
          window.location.href = '/';
        } else {
          console.error('Failed to activate subscription:', result.error);
          alert('Payment successful but there was an issue activating your account. Please contact support.');
          navigate('/');
        }

      } catch (error) {
        console.error('Error activating subscription:', error);
        alert('There was an issue activating your subscription. Please contact support.');
        navigate('/');
      } finally {
        setProcessing(false);
      }
    };

    // Wait a moment for everything to load, then process
    setTimeout(activateSubscription, 1000);
  }, [location, navigate, user]);

  if (processing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid #f3f3f3',
          borderTop: '6px solid #28a745',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '2rem'
        }} />
        
        <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>
          🎉 Payment Successful!
        </h2>
        
        <p style={{ color: '#666', textAlign: 'center' }}>
          Activating your subscription...
        </p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default SuccessPage;