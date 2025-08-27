// AdminSetup.js - Component to set up admin users
// IMPORTANT: Remove this component after setting up admin users for security!

import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminSetup.css';

const AdminSetup = () => {
  const [email, setEmail] = useState('discord@examrizz.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetupAdmin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      const auth = getAuth();
      let userId;
      
      // Try to create the user first
      try {
        setMessage('Creating user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
        setMessage('User account created successfully!');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          setMessage('User exists, updating permissions...');
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            userId = userCredential.user.uid;
          } catch (signInError) {
            if (signInError.code === 'auth/wrong-password') {
              setError('User exists but password is incorrect. Please use the correct password.');
            } else {
              setError(`Sign in failed: ${signInError.message}`);
            }
            setLoading(false);
            return;
          }
        } else if (error.code === 'auth/weak-password') {
          setError('Password is too weak. Please use a stronger password.');
          setLoading(false);
          return;
        } else if (error.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
          setLoading(false);
          return;
        } else {
          throw error;
        }
      }

      // Set up admin privileges in Firestore
      setMessage('Setting up admin privileges...');
      
      const adminUserData = {
        email: email,
        displayName: email === 'discord@examrizz.com' ? 'Discord Admin' : 'Admin User',
        isAdmin: true,
        role: 'admin',
        subscription: {
          status: 'active',
          plan: 'pro',
          stripeSubscriptionId: 'admin_permanent',
          startDate: new Date(),
          endDate: new Date('2099-12-31'),
          cancelledAt: null,
          features: ['all'],
          paymentType: 'admin',
        },
        usage: {
          questionsViewedToday: 0,
          questionPacksCreated: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          unlimitedAccess: true,
        },
        permissions: {
          canAccessAllContent: true,
          canManageUsers: true,
          canUploadQuestions: true,
          canModerateContent: true,
          bypassPaywall: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        accountType: 'admin',
        notes: 'Admin account with full access to all paid features',
      };

      await setDoc(doc(db, 'users', userId), adminUserData, { merge: true });
      
      setSuccess(true);
      setMessage('');
      setError('');
      
      // Sign out after creating admin to prevent auto-login
      await auth.signOut();
      
    } catch (error) {
      console.error('Error setting up admin:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="admin-setup-container">
        <div className="success-box">
          <h2>✅ Admin Setup Complete!</h2>
          <div className="success-details">
            <p><strong>Admin Email:</strong> {email}</p>
            <p><strong>Status:</strong> Active Admin with Pro Access</p>
            <h3>Account Features:</h3>
            <ul>
              <li>✓ All paid features unlocked</li>
              <li>✓ Admin panel access at /admin/questions</li>
              <li>✓ No usage restrictions</li>
              <li>✓ Can upload and manage questions</li>
              <li>✓ Bypass all paywalls</li>
            </ul>
            <h3>Next Steps:</h3>
            <ol>
              <li>Log in with the email and password you set</li>
              <li>Access admin features immediately</li>
              <li><strong>IMPORTANT:</strong> Remove this setup page from production!</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            className="login-redirect-button"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-setup-container">
      <div className="admin-setup-box">
        <h1>🔐 Admin User Setup</h1>
        <p className="warning-text">
          ⚠️ This page should be removed after setting up admin users!
        </p>
        
        <form onSubmit={handleSetupAdmin} className="admin-setup-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password"
              required
              disabled={loading}
              minLength={6}
            />
            <small>Password must be at least 6 characters</small>
          </div>
          
          {message && <div className="info-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="setup-button"
          >
            {loading ? 'Setting up...' : 'Create Admin User'}
          </button>
        </form>
        
        <div className="info-section">
          <h3>This will grant:</h3>
          <ul>
            <li>Full admin privileges</li>
            <li>Permanent Pro subscription</li>
            <li>Access to all paid features</li>
            <li>No usage limits</li>
            <li>Admin panel access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;